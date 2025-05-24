// import axios from "axios";
// import {
//   AlertTriangle,
//   CheckCircle,
//   Eye,
//   EyeOff,
//   Info,
//   Loader2,
//   Minus,
//   Plus,
//   Search
// } from "lucide-react";
// import React, { useCallback, useEffect, useRef, useState } from "react";
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
//   { key: "14:00", label: "2.00", inspectionNo: 4 },
//   { key: "16:00", label: "4.00", inspectionNo: 5 },
//   { key: "18:00", label: "6.00", inspectionNo: 6 }
// ];

// const TEMP_TOLERANCE = 5;
// const TIME_TOLERANCE = 2;
// const PRESSURE_TOLERANCE = 2;

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

// // Helper to parse pressure value
// const parsePressure = (pressureValue) => {
//   if (pressureValue === null || pressureValue === undefined) return null;
//   if (typeof pressureValue === "number") return pressureValue;
//   if (typeof pressureValue === "string") {
//     const num = parseFloat(pressureValue);
//     return isNaN(num) ? null : num;
//   }
//   return null;
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

//   const moNoInputRef = useRef(null);
//   const moNoDropdownRef = useRef(null);

//   // Sync with formData prop from parent
//   useEffect(() => {
//     setMoNoSearch(formData.moNo || "");
//     const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
//       const existingInsp = formData.inspections?.find(
//         (i) => i.timeSlotKey === slotConf.key
//       );
//       if (existingInsp) {
//         acc[slotConf.key] = {
//           ...initialSlotData,
//           ...existingInsp,
//           temp_req:
//             existingInsp.temp_req !== null
//               ? Number(existingInsp.temp_req)
//               : null,
//           temp_actual:
//             existingInsp.temp_actual !== null
//               ? Number(existingInsp.temp_actual)
//               : null,
//           time_req:
//             existingInsp.time_req !== null
//               ? Number(existingInsp.time_req)
//               : null,
//           time_actual:
//             existingInsp.time_actual !== null
//               ? Number(existingInsp.time_actual)
//               : null,
//           pressure_req:
//             existingInsp.pressure_req !== null
//               ? Number(existingInsp.pressure_req)
//               : null,
//           pressure_actual:
//             existingInsp.pressure_actual !== null
//               ? Number(existingInsp.pressure_actual)
//               : null
//         };
//       } else {
//         acc[slotConf.key] = {
//           ...initialSlotData,
//           inspectionNo: slotConf.inspectionNo,
//           timeSlotKey: slotConf.key
//         };
//       }
//       return acc;
//     }, {});

//     setLocalFormData((prev) => ({
//       ...prev,
//       ...formData,
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
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setRecordStatusMessage("");
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
//         washingTestResult: "Pending",
//         isStretchWashingTestDone: false,
//         inspections: []
//       };
//       newLocalData = resetLocalDetailedSlots(newLocalData);
//       setRecordStatusMessage("");
//       updateParentFormData(newLocalData);
//       return newLocalData;
//     });
//   };

//   const calculateStatus = (actual, req, tolerance) => {
//     if (actual === null || req === null) return "pending";
//     const numActual = Number(actual);
//     const numReq = Number(req);
//     if (isNaN(numActual) || isNaN(numReq)) return "pending";

//     const diff = Math.abs(numActual - numReq);
//     if (diff <= tolerance) return "ok";
//     return numActual < numReq ? "low" : "high";
//   };

//   // Fetch base specifications
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
//                 : calculateStatus(
//                     slot.temp_actual,
//                     slot.temp_req,
//                     TEMP_TOLERANCE
//                   );
//             }
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
//                 : calculateStatus(
//                     slot.time_actual,
//                     slot.time_req,
//                     TIME_TOLERANCE
//                   );
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
//                 : calculateStatus(
//                     slot.pressure_actual,
//                     slot.pressure_req,
//                     PRESSURE_TOLERANCE
//                   );
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

//   // Auto-set req and actual values for the active slot
//   useEffect(() => {
//     if (
//       currentActiveSlotKey &&
//       localFormData.slotsDetailed &&
//       localFormData.slotsDetailed[currentActiveSlotKey] &&
//       localFormData.moNo &&
//       localFormData.color &&
//       localFormData.inspectionDate
//     ) {
//       // Trigger fetchBaseSpecs to ensure baseReq* values are fresh
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

//   // Ensure baseReq* values are applied to the active slot when they change
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
//           slotToUpdate.temp_status = calculateStatus(
//             slotToUpdate.temp_actual,
//             slotToUpdate.temp_req,
//             TEMP_TOLERANCE
//           );
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
//           slotToUpdate.time_status = calculateStatus(
//             slotToUpdate.time_actual,
//             slotToUpdate.time_req,
//             TIME_TOLERANCE
//           );
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
//           slotToUpdate.pressure_status = calculateStatus(
//             slotToUpdate.pressure_actual,
//             slotToUpdate.pressure_req,
//             PRESSURE_TOLERANCE
//           );
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
//       let baseSpecsShouldBeFetched = false;
//       let moForBaseSpecs = currentMoNo;
//       let colorForBaseSpecs = currentColor;
//       let dateForBaseSpecs = currentInspectionDate;
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
//           if (params.moNo && params.color) {
//             baseSpecsShouldBeFetched = true;
//           }
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
//                   pressure_actual:
//                     existingInsp.pressure_actual !== null
//                       ? Number(existingInsp.pressure_actual)
//                       : null
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
//               baseReqPressure: parsePressure(data.baseReqPressure),
//               stretchTestResult: data.stretchTestResult || "Pending",
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

//           if (!data.baseReqTemp && data.moNo && data.color) {
//             baseSpecsShouldBeFetched = true;
//           }
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

//       const field_actual = `${fieldType}_actual`;
//       const field_req = `${fieldType}_req`;
//       const field_status = `${fieldType}_status`;
//       const field_isUserModified = `${fieldType}_isUserModified`;
//       const field_isNA = `${fieldType}_isNA`;

//       if (slot[field_isNA]) return prev;

//       const numValue = value === "" || value === null ? null : Number(value);
//       slot[field_actual] = numValue;
//       slot[field_isUserModified] = true;

//       if (fieldType === "temp")
//         slot[field_status] = calculateStatus(
//           numValue,
//           slot[field_req],
//           TEMP_TOLERANCE
//         );
//       if (fieldType === "time")
//         slot[field_status] = calculateStatus(
//           numValue,
//           slot[field_req],
//           TIME_TOLERANCE
//         );
//       if (fieldType === "pressure")
//         slot[field_status] = calculateStatus(
//           numValue,
//           slot[field_req],
//           PRESSURE_TOLERANCE
//         );

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

//       const field_actual = `${fieldType}_actual`;
//       const field_req = `${fieldType}_req`;
//       const field_status = `${fieldType}_status`;
//       const field_isUserModified = `${fieldType}_isUserModified`;
//       const field_isNA = `${fieldType}_isNA`;

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

//       if (fieldType === "temp")
//         slot[field_status] = calculateStatus(
//           currentValue,
//           slot[field_req],
//           TEMP_TOLERANCE
//         );
//       if (fieldType === "time")
//         slot[field_status] = calculateStatus(
//           currentValue,
//           slot[field_req],
//           TIME_TOLERANCE
//         );
//       if (fieldType === "pressure")
//         slot[field_status] = calculateStatus(
//           currentValue,
//           slot[field_req],
//           PRESSURE_TOLERANCE
//         );

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

//       const field_actual = `${fieldType}_actual`;
//       const field_req = `${fieldType}_req`;
//       const field_status = `${fieldType}_status`;
//       const field_isNA = `${fieldType}_isNA`;

//       slot[field_isNA] = !slot[field_isNA];
//       if (slot[field_isNA]) {
//         slot[field_actual] = null;
//         slot[field_status] = "na";
//       } else {
//         slot[field_actual] =
//           slot[field_actual] === null ? slot[field_req] : slot[field_actual];
//         if (fieldType === "temp")
//           slot[field_status] = calculateStatus(
//             slot[field_actual],
//             slot[field_req],
//             TEMP_TOLERANCE
//           );
//         if (fieldType === "time")
//           slot[field_status] = calculateStatus(
//             slot[field_actual],
//             slot[field_req],
//             TIME_TOLERANCE
//           );
//         if (fieldType === "pressure")
//           slot[field_status] = calculateStatus(
//             slot[field_actual],
//             slot[field_req],
//             PRESSURE_TOLERANCE
//           );
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

//   const renderCurrentSlotTable = () => {
//     if (!currentActiveSlotKey) return null;
//     const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
//     if (!currentSlot) return null;

//     const parameters = [
//       { label: t("sccDailyHTQC.temperature"), field: "temp", unit: "°C" },
//       { label: t("sccDailyHTQC.timing"), field: "time", unit: "Sec" },
//       { label: t("sccDailyHTQC.pressure"), field: "pressure", unit: "" }
//     ];

//     const slotConfig = TIME_SLOTS_CONFIG.find(
//       (s) => s.key === currentActiveSlotKey
//     );

//     return (
//       <div className="border border-gray-300 rounded-md shadow-sm bg-white">
//         <h3 className="text-md font-semibold text-gray-700 px-3 py-2 bg-gray-100">
//           {t("sccDailyHTQC.currentInspectionSlot")}: {slotConfig.label} AM (#
//           {slotConfig.inspectionNo})
//         </h3>
//         <table className="min-w-full divide-y divide-gray-300 text-xs">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-3 py-2.5 text-left font-semibold text-gray-800 border-r border-gray-300 w-1/3">
//                 {t("sccDailyHTQC.parameter")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-300 w-1/3">
//                 {t("sccDailyHTQC.reqValue")}
//               </th>
//               <th className="px-3 py-2.5 text-center font-semibold text-gray-800 w-1/3">
//                 {slotConfig.label}
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {parameters.map((param) => {
//               const fieldType = param.field;
//               const reqField = `${fieldType}_req`;
//               const actualField = `${fieldType}_actual`;
//               const isNAField = `${fieldType}_isNA`;
//               const statusField = `${fieldType}_status`;

//               const reqValue = currentSlot[reqField];
//               const actualValue = currentSlot[actualField];
//               const isNA = currentSlot[isNAField];
//               const status = currentSlot[statusField];

//               return (
//                 <tr key={param.field} className="hover:bg-gray-50">
//                   <td className="px-3 py-2.5 border border-gray-300 font-medium text-gray-700">
//                     {param.label} {param.unit ? `(${param.unit})` : ""}
//                   </td>
//                   <td className="px-3 py-2.5 border border-gray-300 text-center">
//                     {reqValue !== null ? reqValue : "N/A"}
//                   </td>
//                   <td
//                     className={`px-1 py-2 border border-gray-300 text-center ${getCellBG(
//                       status,
//                       isNA
//                     )}`}
//                   >
//                     {isNA ? (
//                       <span className="italic text-gray-500">
//                         {t("scc.na", "N/A")}
//                       </span>
//                     ) : (
//                       <input
//                         type="number"
//                         value={actualValue !== null ? actualValue : ""}
//                         onChange={(e) =>
//                           handleSlotActualValueChange(
//                             currentActiveSlotKey,
//                             fieldType,
//                             e.target.value
//                           )
//                         }
//                         className={`${inputFieldClasses} text-center text-xs p-1 w-full mb-2`}
//                       />
//                     )}
//                     <div className="flex justify-center items-center space-x-3">
//                       {!isNA && (
//                         <>
//                           <button
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 fieldType,
//                                 "decrement"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-300 rounded"
//                             type="button"
//                           >
//                             <Minus size={14} />
//                           </button>
//                           <button
//                             onClick={() =>
//                               handleSlotIncrementDecrement(
//                                 currentActiveSlotKey,
//                                 fieldType,
//                                 "increment"
//                               )
//                             }
//                             className="p-1 hover:bg-gray-300 rounded"
//                             type="button"
//                           >
//                             <Plus size={14} />
//                           </button>
//                         </>
//                       )}
//                       <button
//                         onClick={() =>
//                           toggleSlotNA(currentActiveSlotKey, fieldType)
//                         }
//                         className="p-1 hover:bg-gray-300 rounded"
//                         type="button"
//                       >
//                         {isNA ? (
//                           <EyeOff size={14} className="text-gray-500" />
//                         ) : (
//                           <Eye size={14} />
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
//     const submittedInspections = formData.inspections
//       .sort((a, b) => a.inspectionNo - b.inspectionNo)
//       .filter(
//         (insp) =>
//           insp.temp_actual !== null ||
//           insp.time_actual !== null ||
//           insp.pressure_actual !== null ||
//           insp.temp_isNA ||
//           insp.time_isNA ||
//           insp.pressure_isNA
//       );

//     if (submittedInspections.length === 0) return null;

//     const parameters = [
//       { label: t("sccDailyHTQC.temperature"), field: "temp", unit: "°C" },
//       { label: t("sccDailyHTQC.timing"), field: "time", unit: "Sec" },
//       { label: t("sccDailyHTQC.pressure"), field: "pressure", unit: "" }
//     ];

//     return (
//       <div className="border border-gray-300 rounded-md shadow-sm bg-white mt-5">
//         <h3 className="text-md font-semibold text-gray-700 px-3 py-2 bg-gray-100">
//           {t("sccDailyHTQC.previousRecords")}
//         </h3>
//         <table className="min-w-full divide-y divide-gray-300 text-xs">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-3 py-2.5 text-left font-semibold text-gray-800 border-r border-gray-300 w-1/4">
//                 {t("sccDailyHTQC.parameter")}
//               </th>
//               {submittedInspections.map((insp) => (
//                 <th
//                   key={insp.timeSlotKey}
//                   className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-300"
//                 >
//                   {
//                     TIME_SLOTS_CONFIG.find((s) => s.key === insp.timeSlotKey)
//                       .label
//                   }
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {parameters.map((param) => (
//               <tr key={param.field} className="hover:bg-gray-50">
//                 <td className="px-3 py-2.5 border border-gray-300 font-medium text-gray-700">
//                   {param.label} {param.unit ? `(${param.unit})` : ""}
//                 </td>
//                 {submittedInspections.map((insp) => {
//                   const fieldActual = `${param.field}_actual`;
//                   const fieldIsNA = `${param.field}_isNA`;
//                   const fieldStatus = `${param.field}_status`;
//                   const value = insp[fieldActual];
//                   const isNA = insp[fieldIsNA];
//                   const status = insp[fieldStatus];

//                   return (
//                     <td
//                       key={`${insp.timeSlotKey}-${param.field}`}
//                       className={`px-3 py-2.5 border border-gray-300 text-center ${getCellBG(
//                         status,
//                         isNA
//                       )}`}
//                     >
//                       {isNA ? (
//                         <span className="italic text-gray-500">
//                           {t("scc.na", "N/A")}
//                         </span>
//                       ) : value !== null ? (
//                         value
//                       ) : (
//                         ""
//                       )}
//                       {status &&
//                         status !== "pending" &&
//                         (isNA ? (
//                           <Info
//                             size={12}
//                             className="inline-block ml-1 text-blue-500"
//                             title={t("scc.notAssessed", "Not Assessed")}
//                           />
//                         ) : status === "ok" ? (
//                           <CheckCircle
//                             size={12}
//                             className="inline-block ml-1 text-green-500"
//                           />
//                         ) : (
//                           <AlertTriangle
//                             size={12}
//                             className="inline-block ml-1 text-red-500"
//                           />
//                         ))}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   if (!user)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

//   return (
//     <div className="space-y-4 sm:space-y-6">
//       <h2 className="text-lg font-semibold text-gray-800">
//         {t("sccDailyHTQC.title")}
//       </h2>
//       <p className="text-xs text-gray-600 -mt-3">
//         {t("sccDailyHTQC.subtitle")}
//       </p>

//       {loading && (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
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
//           <Info size={18} className="mr-2 flex-shrink-0" />{" "}
//           {recordStatusMessage}
//         </div>
//       )}

//       {/* Row 1: Date, Machine No, MO No Search */}
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
//             {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
//               <option key={`machine-${num}`} value={String(num)}>
//                 {String(num)}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="relative">
//           <label htmlFor="htqcMoNoSearch" className={labelClasses}>
//             {t("scc.moNo")}
//           </label>
//           <div className="relative mt-1">
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
//               <ul
//                 ref={moNoDropdownRef}
//                 className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
//               >
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
//                   const selectedVal = e.target.value;
//                   if (selectedVal) {
//                     const [selectedMo, selectedColor] = selectedVal.split("|");
//                     setLocalFormData((prev) => {
//                       let newLocalData = {
//                         ...prev,
//                         moNo: selectedMo,
//                         color: selectedColor,
//                         _id: null,
//                         baseReqTemp: null,
//                         baseReqTime: null,
//                         baseReqPressure: null,
//                         inspections: []
//                       };
//                       newLocalData = resetLocalDetailedSlots(newLocalData);
//                       setMoNoSearch(selectedMo);
//                       return newLocalData;
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
//                     {rec.moNo} - {rec.color} (
//                     {rec.buyerStyle || t("scc.naCap", "N/A")})
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Row 2: Buyer, Buyer Style, Color */}
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

//       {/* Inspection Tables */}
//       {localFormData.moNo && localFormData.color && (
//         <div className="mt-4 space-y-5">
//           {currentActiveSlotKey ? (
//             renderCurrentSlotTable()
//           ) : (
//             <div className="text-center py-4 text-gray-500">
//               {t("sccDailyHTQC.allInspectionsCompleted")}
//             </div>
//           )}
//           {renderPreviousRecordsTable()}

//           {/* Stretch & Washing Tests */}
//           {!localFormData.isStretchWashingTestDone && currentActiveSlotKey && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-3">
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
//           {localFormData.isStretchWashingTestDone && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-3">
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

//       {/* Submit Button */}
//       <div className="pt-4 flex justify-end">
//         <button
//           type="button"
//           onClick={handleFormActualSubmit}
//           disabled={isSubmitting || !currentActiveSlotKey || loading}
//           className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
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

import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown, // For multiselect dropdown arrow
  Eye,
  EyeOff,
  Info,
  Loader2,
  Minus,
  Plus,
  Search,
  X, // For removing selected reasons
  History, // For Check History button
  Triangle // Generic triangle for difference indicator
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

const TIME_SLOTS_CONFIG = [
  { key: "07:00", label: "07.00", inspectionNo: 1 },
  { key: "09:00", label: "09.00", inspectionNo: 2 },
  { key: "12:00", label: "12.00", inspectionNo: 3 },
  { key: "14:00", label: "2.00 PM", inspectionNo: 4 }, // Adjusted label for clarity
  { key: "16:00", label: "4.00 PM", inspectionNo: 5 },
  { key: "18:00", label: "6.00 PM", inspectionNo: 6 }
];

const TEMP_TOLERANCE = 5;
const TIME_TOLERANCE = 2;
const PRESSURE_TOLERANCE = 0.5; // Example for numeric pressure

const initialSlotData = {
  inspectionNo: 0,
  timeSlotKey: "",
  temp_req: null,
  temp_actual: null,
  temp_status: "pending",
  temp_isUserModified: false,
  temp_isNA: false,
  time_req: null,
  time_actual: null,
  time_status: "pending",
  time_isUserModified: false,
  time_isNA: false,
  pressure_req: null,
  pressure_actual: null,
  pressure_status: "pending",
  pressure_isUserModified: false,
  pressure_isNA: false
};

const STRETCH_TEST_REJECT_REASONS_OPTIONS = ["NA1", "NA2", "NA3", "Other"]; // Added "Other"

const parsePressure = (pressureValue) => {
  if (
    pressureValue === null ||
    pressureValue === undefined ||
    pressureValue === ""
  )
    return null;
  const num = parseFloat(pressureValue);
  return isNaN(num) ? null : num;
};

const DailyHTQC = ({
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
      ...formData, // Includes stretchTestRejectReasons from parent
      slotsDetailed: initialSlots,
      baseReqPressure: parsePressure(formData.baseReqPressure)
    };
  });

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableMachineRecords, setAvailableMachineRecords] = useState([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [firstOutputSpecsLoading, setFirstOutputSpecsLoading] = useState(false);
  const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState("");
  const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);
  const [showHistory, setShowHistory] = useState(false); // New state for history visibility
  const [showRejectReasonDropdown, setShowRejectReasonDropdown] =
    useState(false);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const rejectReasonDropdownRef = useRef(null);

  useEffect(() => {
    setMoNoSearch(formData.moNo || "");
    const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
      const existingInsp = formData.inspections?.find(
        (i) => i.timeSlotKey === slotConf.key
      );
      acc[slotConf.key] = existingInsp
        ? {
            ...initialSlotData,
            ...existingInsp,
            temp_req:
              existingInsp.temp_req !== null
                ? Number(existingInsp.temp_req)
                : null,
            temp_actual:
              existingInsp.temp_actual !== null
                ? Number(existingInsp.temp_actual)
                : null,
            time_req:
              existingInsp.time_req !== null
                ? Number(existingInsp.time_req)
                : null,
            time_actual:
              existingInsp.time_actual !== null
                ? Number(existingInsp.time_actual)
                : null,
            pressure_req: parsePressure(existingInsp.pressure_req), // Ensure numeric pressure
            pressure_actual: parsePressure(existingInsp.pressure_actual) // Ensure numeric pressure
          }
        : {
            ...initialSlotData,
            inspectionNo: slotConf.inspectionNo,
            timeSlotKey: slotConf.key
          };
      return acc;
    }, {});

    setLocalFormData((prev) => ({
      ...prev,
      ...formData, // This will bring in stretchTestResult and stretchTestRejectReasons from parent
      baseReqPressure: parsePressure(formData.baseReqPressure),
      slotsDetailed: newSlotsDetailed
    }));
  }, [formData]);

  const updateParentFormData = useCallback(
    (updatedLocalData) => {
      const inspectionsArray = Object.values(updatedLocalData.slotsDetailed)
        .filter(
          (slot) =>
            slot.temp_isUserModified ||
            slot.time_isUserModified ||
            slot.pressure_isUserModified ||
            slot.temp_isNA ||
            slot.time_isNA ||
            slot.pressure_isNA ||
            slot.temp_actual !== null ||
            slot.time_actual !== null ||
            slot.pressure_actual !== null
        )
        .map((slot) => ({
          inspectionNo: slot.inspectionNo,
          timeSlotKey: slot.timeSlotKey,
          temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
          temp_actual:
            slot.temp_actual !== null ? Number(slot.temp_actual) : null,
          temp_status: slot.temp_status,
          temp_isUserModified: slot.temp_isUserModified,
          temp_isNA: slot.temp_isNA,
          time_req: slot.time_req !== null ? Number(slot.time_req) : null,
          time_actual:
            slot.time_actual !== null ? Number(slot.time_actual) : null,
          time_status: slot.time_status,
          time_isUserModified: slot.time_isUserModified,
          time_isNA: slot.time_isNA,
          pressure_req:
            slot.pressure_req !== null ? Number(slot.pressure_req) : null, // Ensure numeric
          pressure_actual:
            slot.pressure_actual !== null ? Number(slot.pressure_actual) : null, // Ensure numeric
          pressure_status: slot.pressure_status,
          pressure_isUserModified: slot.pressure_isUserModified,
          pressure_isNA: slot.pressure_isNA
        }));

      onFormDataChange({
        _id: updatedLocalData._id,
        inspectionDate: updatedLocalData.inspectionDate,
        machineNo: updatedLocalData.machineNo,
        moNo: updatedLocalData.moNo,
        buyer: updatedLocalData.buyer,
        buyerStyle: updatedLocalData.buyerStyle,
        color: updatedLocalData.color,
        baseReqTemp:
          updatedLocalData.baseReqTemp !== null
            ? Number(updatedLocalData.baseReqTemp)
            : null,
        baseReqTime:
          updatedLocalData.baseReqTime !== null
            ? Number(updatedLocalData.baseReqTime)
            : null,
        baseReqPressure:
          updatedLocalData.baseReqPressure !== null
            ? Number(updatedLocalData.baseReqPressure)
            : null, // Ensure numeric
        inspections: inspectionsArray,
        stretchTestResult: updatedLocalData.stretchTestResult,
        stretchTestRejectReasons:
          updatedLocalData.stretchTestResult === "Reject"
            ? updatedLocalData.stretchTestRejectReasons || []
            : [], // Pass reasons if reject, else empty
        washingTestResult: updatedLocalData.washingTestResult,
        isStretchWashingTestDone: updatedLocalData.isStretchWashingTestDone
      });
    },
    [onFormDataChange]
  );

  const resetLocalDetailedSlots = (currentLocalData) => {
    const newSlots = { ...currentLocalData.slotsDetailed };
    TIME_SLOTS_CONFIG.forEach((slot) => {
      newSlots[slot.key] = {
        ...initialSlotData,
        inspectionNo: slot.inspectionNo,
        timeSlotKey: slot.key
      };
    });
    return { ...currentLocalData, slotsDetailed: newSlots };
  };

  const handleDateChange = (date) => {
    setLocalFormData((prev) => {
      let newLocalData = {
        ...prev,
        inspectionDate: date,
        moNo: "",
        color: "",
        buyer: "",
        buyerStyle: "",
        _id: null,
        baseReqTemp: null,
        baseReqTime: null,
        baseReqPressure: null,
        stretchTestResult: "Pending",
        stretchTestRejectReasons: [],
        washingTestResult: "Pending",
        isStretchWashingTestDone: false,
        inspections: []
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
        baseReqTime: null,
        baseReqPressure: null,
        stretchTestResult: "Pending",
        stretchTestRejectReasons: [],
        washingTestResult: "Pending",
        isStretchWashingTestDone: false,
        inspections: []
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

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    setShowMoNoDropdown(false);
    setLocalFormData((prev) => {
      let newLocalData = {
        ...prev,
        moNo: selectedMo,
        color: "",
        buyer: "",
        buyerStyle: "",
        _id: null,
        baseReqTemp: null,
        baseReqTime: null,
        baseReqPressure: null,
        stretchTestResult: "Pending",
        stretchTestRejectReasons: [],
        washingTestResult: "Pending",
        isStretchWashingTestDone: false,
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setRecordStatusMessage("");
      setShowHistory(false);
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!localFormData.moNo) {
        if (localFormData.buyer || localFormData.buyerStyle) {
          setLocalFormData((prev) => {
            const updatedData = { ...prev, buyer: "", buyerStyle: "" };
            updateParentFormData(updatedData);
            return updatedData;
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
          const newLocalData = {
            ...prev,
            buyer: details.engName || "N/A",
            buyerStyle: details.custStyle || "N/A"
          };
          updateParentFormData(newLocalData);
          return newLocalData;
        });
        setAvailableColors(details.colors || []);
      } catch (error) {
        console.error(t("scc.errorFetchingOrderDetailsLog"), error);
        setLocalFormData((prev) => {
          const newLocalData = { ...prev, buyer: "", buyerStyle: "" };
          updateParentFormData(newLocalData);
          return newLocalData;
        });
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    if (localFormData.moNo) {
      fetchOrderDetails();
    } else {
      if (localFormData.buyer || localFormData.buyerStyle) {
        setLocalFormData((prev) => {
          const updatedData = { ...prev, buyer: "", buyerStyle: "" };
          updateParentFormData(updatedData);
          return updatedData;
        });
      }
      setAvailableColors([]);
    }
  }, [localFormData.moNo, t, updateParentFormData]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setLocalFormData((prev) => {
      let newLocalData = {
        ...prev,
        color: newColor,
        _id: null,
        baseReqTemp: null,
        baseReqTime: null,
        baseReqPressure: null,
        stretchTestResult: "Pending",
        stretchTestRejectReasons: [],
        washingTestResult: "Pending",
        isStretchWashingTestDone: false,
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setRecordStatusMessage("");
      setShowHistory(false);
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const calculateStatusAndDiff = (actual, req, tolerance) => {
    if (actual === null || req === null)
      return { status: "pending", diff: null };
    const numActual = Number(actual);
    const numReq = Number(req);
    if (isNaN(numActual) || isNaN(numReq))
      return { status: "pending", diff: null };

    const difference = numActual - numReq;
    if (Math.abs(difference) <= tolerance)
      return { status: "ok", diff: difference };
    return { status: numActual < numReq ? "low" : "high", diff: difference };
  };

  const fetchBaseSpecs = useCallback(
    async (
      moNoToFetch,
      colorToFetch,
      inspectionDateToFetch,
      activeSlotKeyForUpdate
    ) => {
      if (!moNoToFetch || !colorToFetch || !inspectionDateToFetch) return;
      setFirstOutputSpecsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/get-first-output-specs`,
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
        let newBaseReqTemp = null,
          newBaseReqTime = null,
          newBaseReqPressure = null;
        if (response.data.data) {
          const specs = response.data.data;
          newBaseReqTemp = specs.tempC !== null ? Number(specs.tempC) : null;
          newBaseReqTime =
            specs.timeSec !== null ? Number(specs.timeSec) : null;
          newBaseReqPressure = parsePressure(specs.pressure); // Ensure numeric
        }
        setLocalFormData((prevLocalData) => {
          const updatedSlotsDetailed = { ...prevLocalData.slotsDetailed };
          const slotKeyToUpdate =
            activeSlotKeyForUpdate ||
            (TIME_SLOTS_CONFIG[0] ? TIME_SLOTS_CONFIG[0].key : null);

          if (slotKeyToUpdate && updatedSlotsDetailed[slotKeyToUpdate]) {
            const slot = updatedSlotsDetailed[slotKeyToUpdate];
            if (!slot.temp_isUserModified && !slot.temp_isNA) {
              slot.temp_req = newBaseReqTemp;
              slot.temp_actual =
                slot.temp_actual === null &&
                !slot.temp_isNA &&
                newBaseReqTemp !== null
                  ? newBaseReqTemp
                  : slot.temp_actual;
              slot.temp_status = slot.temp_isNA
                ? "na"
                : calculateStatusAndDiff(
                    slot.temp_actual,
                    slot.temp_req,
                    TEMP_TOLERANCE
                  ).status;
            }
            // Similar logic for time and pressure
            if (!slot.time_isUserModified && !slot.time_isNA) {
              slot.time_req = newBaseReqTime;
              slot.time_actual =
                slot.time_actual === null &&
                !slot.time_isNA &&
                newBaseReqTime !== null
                  ? newBaseReqTime
                  : slot.time_actual;
              slot.time_status = slot.time_isNA
                ? "na"
                : calculateStatusAndDiff(
                    slot.time_actual,
                    slot.time_req,
                    TIME_TOLERANCE
                  ).status;
            }
            if (!slot.pressure_isUserModified && !slot.pressure_isNA) {
              slot.pressure_req = newBaseReqPressure;
              slot.pressure_actual =
                slot.pressure_actual === null &&
                !slot.pressure_isNA &&
                newBaseReqPressure !== null
                  ? newBaseReqPressure
                  : slot.pressure_actual;
              slot.pressure_status = slot.pressure_isNA
                ? "na"
                : calculateStatusAndDiff(
                    slot.pressure_actual,
                    slot.pressure_req,
                    PRESSURE_TOLERANCE
                  ).status;
            }
          }
          const newLocalData = {
            ...prevLocalData,
            baseReqTemp: newBaseReqTemp,
            baseReqTime: newBaseReqTime,
            baseReqPressure: newBaseReqPressure,
            slotsDetailed: updatedSlotsDetailed
          };
          updateParentFormData(newLocalData);
          return newLocalData;
        });
      } catch (error) {
        console.error(t("scc.errorFetchingHtSpecsLog"), error);
        setLocalFormData((prevLocalData) => {
          const newLocalData = {
            ...prevLocalData,
            baseReqTemp: null,
            baseReqTime: null,
            baseReqPressure: null
          };
          updateParentFormData(newLocalData);
          return newLocalData;
        });
      } finally {
        setFirstOutputSpecsLoading(false);
      }
    },
    [t, updateParentFormData]
  );

  useEffect(() => {
    if (
      currentActiveSlotKey &&
      localFormData.slotsDetailed &&
      localFormData.slotsDetailed[currentActiveSlotKey] &&
      localFormData.moNo &&
      localFormData.color &&
      localFormData.inspectionDate
    ) {
      fetchBaseSpecs(
        localFormData.moNo,
        localFormData.color,
        localFormData.inspectionDate,
        currentActiveSlotKey
      );
    }
  }, [
    currentActiveSlotKey,
    localFormData.moNo,
    localFormData.color,
    localFormData.inspectionDate,
    fetchBaseSpecs
  ]);

  useEffect(() => {
    if (
      currentActiveSlotKey &&
      localFormData.slotsDetailed &&
      localFormData.slotsDetailed[currentActiveSlotKey]
    ) {
      setLocalFormData((prevLocalData) => {
        const currentSlotsDetailed = prevLocalData.slotsDetailed;
        const slotToUpdate = { ...currentSlotsDetailed[currentActiveSlotKey] };
        const baseTemp = prevLocalData.baseReqTemp;
        const baseTime = prevLocalData.baseReqTime;
        const basePressure = prevLocalData.baseReqPressure;
        let hasChanged = false;

        if (
          !slotToUpdate.temp_isUserModified &&
          !slotToUpdate.temp_isNA &&
          baseTemp !== null
        ) {
          if (slotToUpdate.temp_req !== baseTemp) {
            slotToUpdate.temp_req = baseTemp;
            hasChanged = true;
          }
          if (slotToUpdate.temp_actual === null) {
            slotToUpdate.temp_actual = baseTemp;
            hasChanged = true;
          }
          slotToUpdate.temp_status = calculateStatusAndDiff(
            slotToUpdate.temp_actual,
            slotToUpdate.temp_req,
            TEMP_TOLERANCE
          ).status;
        } else if (slotToUpdate.temp_isNA) {
          slotToUpdate.temp_status = "na";
        }

        if (
          !slotToUpdate.time_isUserModified &&
          !slotToUpdate.time_isNA &&
          baseTime !== null
        ) {
          if (slotToUpdate.time_req !== baseTime) {
            slotToUpdate.time_req = baseTime;
            hasChanged = true;
          }
          if (slotToUpdate.time_actual === null) {
            slotToUpdate.time_actual = baseTime;
            hasChanged = true;
          }
          slotToUpdate.time_status = calculateStatusAndDiff(
            slotToUpdate.time_actual,
            slotToUpdate.time_req,
            TIME_TOLERANCE
          ).status;
        } else if (slotToUpdate.time_isNA) {
          slotToUpdate.time_status = "na";
        }

        if (
          !slotToUpdate.pressure_isUserModified &&
          !slotToUpdate.pressure_isNA &&
          basePressure !== null
        ) {
          if (slotToUpdate.pressure_req !== basePressure) {
            slotToUpdate.pressure_req = basePressure;
            hasChanged = true;
          }
          if (slotToUpdate.pressure_actual === null) {
            slotToUpdate.pressure_actual = basePressure;
            hasChanged = true;
          }
          slotToUpdate.pressure_status = calculateStatusAndDiff(
            slotToUpdate.pressure_actual,
            slotToUpdate.pressure_req,
            PRESSURE_TOLERANCE
          ).status;
        } else if (slotToUpdate.pressure_isNA) {
          slotToUpdate.pressure_status = "na";
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
    localFormData.baseReqTime,
    localFormData.baseReqPressure
  ]);

  const fetchDailyHTQCData = useCallback(
    async (
      currentMoNo,
      currentColor,
      currentInspectionDate,
      currentMachineNo
    ) => {
      if (!currentInspectionDate || !currentMachineNo) return;
      setExistingQCRecordLoading(true);
      setRecordStatusMessage("");
      setShowHistory(false);
      let baseSpecsShouldBeFetched = false;
      let moForBaseSpecs = currentMoNo,
        colorForBaseSpecs = currentColor,
        dateForBaseSpecs = currentInspectionDate;
      let activeSlotForBaseSpecsUpdate = currentActiveSlotKey;

      try {
        const params = {
          inspectionDate:
            currentInspectionDate instanceof Date
              ? currentInspectionDate.toISOString()
              : currentInspectionDate,
          machineNo: currentMachineNo
        };
        if (currentMoNo && currentColor) {
          params.moNo = currentMoNo;
          params.color = currentColor;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/scc/daily-htfu-test`,
          { params }
        );
        const { message, data } = response.data;

        if (
          message === "DAILY_HTFU_RECORD_NOT_FOUND" ||
          (message === "NO_RECORDS_FOR_DATE_MACHINE" && !params.moNo)
        ) {
          setRecordStatusMessage(t("sccDailyHTQC.newRecord"));
          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              _id: null,
              stretchTestResult: "Pending",
              stretchTestRejectReasons: [],
              washingTestResult: "Pending",
              isStretchWashingTestDone: false,
              inspections: [],
              baseReqTemp: null,
              baseReqTime: null,
              baseReqPressure: null
            };
            newLocalState = resetLocalDetailedSlots(newLocalState);
            const firstSlotKey = TIME_SLOTS_CONFIG[0]
              ? TIME_SLOTS_CONFIG[0].key
              : null;
            setCurrentActiveSlotKey(firstSlotKey);
            activeSlotForBaseSpecsUpdate = firstSlotKey;
            return newLocalState;
          });
          if (params.moNo && params.color) baseSpecsShouldBeFetched = true;
        } else if (message === "RECORD_FOUND" && data) {
          setRecordStatusMessage(t("sccDailyHTQC.recordLoaded"));
          const populatedSlots = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
            const existingInsp = (data.inspections || []).find(
              (i) => i.timeSlotKey === slotConf.key
            );
            acc[slotConf.key] = existingInsp
              ? {
                  ...initialSlotData,
                  ...existingInsp,
                  temp_actual:
                    existingInsp.temp_actual !== null
                      ? Number(existingInsp.temp_actual)
                      : null,
                  time_actual:
                    existingInsp.time_actual !== null
                      ? Number(existingInsp.time_actual)
                      : null,
                  pressure_actual: parsePressure(existingInsp.pressure_actual) // Ensure numeric
                }
              : {
                  ...initialSlotData,
                  inspectionNo: slotConf.inspectionNo,
                  timeSlotKey: slotConf.key
                };
            return acc;
          }, {});
          setLocalFormData((prev) => {
            const newLocalState = {
              ...prev,
              _id: data._id,
              moNo: data.moNo,
              buyer: data.buyer,
              buyerStyle: data.buyerStyle,
              color: data.color,
              baseReqTemp:
                data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
              baseReqTime:
                data.baseReqTime !== null ? Number(data.baseReqTime) : null,
              baseReqPressure: parsePressure(data.baseReqPressure), // Ensure numeric
              stretchTestResult: data.stretchTestResult || "Pending",
              stretchTestRejectReasons: data.stretchTestRejectReasons || [], // Load reasons
              washingTestResult: data.washingTestResult || "Pending",
              isStretchWashingTestDone: data.isStretchWashingTestDone || false,
              inspections: data.inspections || [],
              slotsDetailed: populatedSlots
            };
            setMoNoSearch(data.moNo || "");
            const lastSubmittedInspNo =
              (data.inspections || []).length > 0
                ? Math.max(...data.inspections.map((i) => i.inspectionNo))
                : 0;
            const nextInspNo = lastSubmittedInspNo + 1;
            const activeSlotConfig = TIME_SLOTS_CONFIG.find(
              (s) => s.inspectionNo === nextInspNo
            );
            const newActiveSlotKey = activeSlotConfig
              ? activeSlotConfig.key
              : null;
            setCurrentActiveSlotKey(newActiveSlotKey);
            activeSlotForBaseSpecsUpdate = newActiveSlotKey;
            return newLocalState;
          });
          moForBaseSpecs = data.moNo;
          colorForBaseSpecs = data.color;
          if (!data.baseReqTemp && data.moNo && data.color)
            baseSpecsShouldBeFetched = true;
        } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
          setRecordStatusMessage(t("sccDailyHTQC.selectMoColor"));
          setAvailableMachineRecords(data);
          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              moNo: "",
              color: "",
              buyer: "",
              buyerStyle: "",
              _id: null,
              baseReqTemp: null,
              baseReqTime: null,
              baseReqPressure: null,
              inspections: []
            };
            newLocalState = resetLocalDetailedSlots(newLocalState);
            setMoNoSearch("");
            setCurrentActiveSlotKey(null);
            updateParentFormData(newLocalState);
            return newLocalState;
          });
        } else {
          setRecordStatusMessage(t("sccDailyHTQC.newRecord"));
          setLocalFormData((prev) => {
            let newLocalState = { ...prev, _id: null, inspections: [] };
            newLocalState = resetLocalDetailedSlots(newLocalState);
            const firstSlotKey = TIME_SLOTS_CONFIG[0]
              ? TIME_SLOTS_CONFIG[0].key
              : null;
            setCurrentActiveSlotKey(firstSlotKey);
            activeSlotForBaseSpecsUpdate = firstSlotKey;
            return newLocalState;
          });
          if (params.moNo && params.color) baseSpecsShouldBeFetched = true;
        }
        if (
          baseSpecsShouldBeFetched &&
          moForBaseSpecs &&
          colorForBaseSpecs &&
          dateForBaseSpecs
        ) {
          fetchBaseSpecs(
            moForBaseSpecs,
            colorForBaseSpecs,
            dateForBaseSpecs,
            activeSlotForBaseSpecsUpdate
          );
        }
      } catch (error) {
        console.error(t("sccDailyHTQC.errorLoadingRecord"), error);
        Swal.fire(
          t("scc.error"),
          t("sccDailyHTQC.errorLoadingRecordMsg"),
          "error"
        );
      } finally {
        setExistingQCRecordLoading(false);
      }
    },
    [t, fetchBaseSpecs, updateParentFormData, currentActiveSlotKey]
  );

  useEffect(() => {
    if (localFormData.inspectionDate && localFormData.machineNo) {
      fetchDailyHTQCData(
        localFormData.moNo,
        localFormData.color,
        localFormData.inspectionDate,
        localFormData.machineNo
      );
    }
  }, [
    localFormData.inspectionDate,
    localFormData.machineNo,
    localFormData.moNo,
    localFormData.color,
    fetchDailyHTQCData
  ]);

  const handleSlotActualValueChange = (slotKey, fieldType, value) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot) return prev;
      const field_actual = `${fieldType}_actual`,
        field_req = `${fieldType}_req`,
        field_status = `${fieldType}_status`,
        field_isUserModified = `${fieldType}_isUserModified`,
        field_isNA = `${fieldType}_isNA`;
      if (slot[field_isNA]) return prev;
      const numValue = value === "" || value === null ? null : Number(value);
      slot[field_actual] = numValue;
      slot[field_isUserModified] = true;
      const tolerance =
        fieldType === "temp"
          ? TEMP_TOLERANCE
          : fieldType === "time"
          ? TIME_TOLERANCE
          : PRESSURE_TOLERANCE;
      slot[field_status] = calculateStatusAndDiff(
        numValue,
        slot[field_req],
        tolerance
      ).status;
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleSlotIncrementDecrement = (slotKey, fieldType, action) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot) return prev;
      const field_actual = `${fieldType}_actual`,
        field_req = `${fieldType}_req`,
        field_status = `${fieldType}_status`,
        field_isUserModified = `${fieldType}_isUserModified`,
        field_isNA = `${fieldType}_isNA`;
      if (slot[field_isNA]) return prev;
      let currentValue = parseFloat(slot[field_actual]);
      if (isNaN(currentValue)) {
        currentValue = parseFloat(slot[field_req]);
        if (isNaN(currentValue)) currentValue = 0;
      }
      if (action === "increment") currentValue += 1;
      if (action === "decrement") currentValue -= 1;
      slot[field_actual] = currentValue;
      slot[field_isUserModified] = true;
      const tolerance =
        fieldType === "temp"
          ? TEMP_TOLERANCE
          : fieldType === "time"
          ? TIME_TOLERANCE
          : PRESSURE_TOLERANCE;
      slot[field_status] = calculateStatusAndDiff(
        currentValue,
        slot[field_req],
        tolerance
      ).status;
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const toggleSlotNA = (slotKey, fieldType) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot) return prev;
      const field_actual = `${fieldType}_actual`,
        field_req = `${fieldType}_req`,
        field_status = `${fieldType}_status`,
        field_isNA = `${fieldType}_isNA`;
      slot[field_isNA] = !slot[field_isNA];
      if (slot[field_isNA]) {
        slot[field_actual] = null;
        slot[field_status] = "na";
      } else {
        slot[field_actual] =
          slot[field_actual] === null ? slot[field_req] : slot[field_actual];
        const tolerance =
          fieldType === "temp"
            ? TEMP_TOLERANCE
            : fieldType === "time"
            ? TIME_TOLERANCE
            : PRESSURE_TOLERANCE;
        slot[field_status] = calculateStatusAndDiff(
          slot[field_actual],
          slot[field_req],
          tolerance
        ).status;
      }
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleTestResultChange = (field, value) => {
    setLocalFormData((prev) => {
      const newLocalData = { ...prev, [field]: value };
      // If stretchTestResult is changed to not 'Reject', clear reasons
      if (field === "stretchTestResult" && value !== "Reject") {
        newLocalData.stretchTestRejectReasons = [];
      }
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleRejectReasonSelect = (reason) => {
    setLocalFormData((prev) => {
      const currentReasons = prev.stretchTestRejectReasons || [];
      let newReasons;
      if (currentReasons.includes(reason)) {
        newReasons = currentReasons.filter((r) => r !== reason); // Remove if already selected
      } else {
        newReasons = [...currentReasons, reason]; // Add if not selected
      }
      const newLocalData = { ...prev, stretchTestRejectReasons: newReasons };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
    // Do not close dropdown: setShowRejectReasonDropdown(false);
  };

  const getCellBG = (status, isNA) => {
    if (isNA) return "bg-gray-200 text-gray-500";
    if (status === "ok") return "bg-green-100 text-green-700";
    if (status === "low" || status === "high") return "bg-red-100 text-red-700";
    return "bg-white";
  };

  const handleFormActualSubmit = () => {
    if (
      !localFormData.inspectionDate ||
      !localFormData.machineNo ||
      !localFormData.moNo ||
      !localFormData.color
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.fillBasic"),
        "warning"
      );
      return;
    }
    if (!currentActiveSlotKey) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.allSlotsDone"),
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
    if (
      (activeSlotData.temp_actual === null && !activeSlotData.temp_isNA) ||
      (activeSlotData.time_actual === null && !activeSlotData.time_isNA) ||
      (activeSlotData.pressure_actual === null && !activeSlotData.pressure_isNA)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.fillActiveSlot"),
        "warning"
      );
      return;
    }
    if (
      localFormData.stretchTestResult === "Reject" &&
      (!localFormData.stretchTestRejectReasons ||
        localFormData.stretchTestRejectReasons.length === 0)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.rejectReasonRequired"),
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
      baseReqTime:
        localFormData.baseReqTime !== null
          ? Number(localFormData.baseReqTime)
          : null,
      baseReqPressure:
        localFormData.baseReqPressure !== null
          ? Number(localFormData.baseReqPressure)
          : null, // Ensure numeric
      stretchTestResult: localFormData.stretchTestResult,
      stretchTestRejectReasons:
        localFormData.stretchTestResult === "Reject"
          ? localFormData.stretchTestRejectReasons || []
          : [],
      washingTestResult: localFormData.washingTestResult,
      isStretchWashingTestDone: localFormData.isStretchWashingTestDone,
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
        temp_status: activeSlotData.temp_status,
        temp_isUserModified: activeSlotData.temp_isUserModified,
        temp_isNA: activeSlotData.temp_isNA,
        time_req:
          activeSlotData.time_req !== null
            ? Number(activeSlotData.time_req)
            : null,
        time_actual:
          activeSlotData.time_actual !== null
            ? Number(activeSlotData.time_actual)
            : null,
        time_status: activeSlotData.time_status,
        time_isUserModified: activeSlotData.time_isUserModified,
        time_isNA: activeSlotData.time_isNA,
        pressure_req:
          activeSlotData.pressure_req !== null
            ? Number(activeSlotData.pressure_req)
            : null, // Ensure numeric
        pressure_actual:
          activeSlotData.pressure_actual !== null
            ? Number(activeSlotData.pressure_actual)
            : null, // Ensure numeric
        pressure_status: activeSlotData.pressure_status,
        pressure_isUserModified: activeSlotData.pressure_isUserModified,
        pressure_isNA: activeSlotData.pressure_isNA
      }
    };
    onFormSubmit(formType, payloadForParent);
  };

  const loading =
    orderDetailsLoading || firstOutputSpecsLoading || existingQCRecordLoading;

  const renderDifference = (actual, req, tolerance, fieldType) => {
    if (
      actual === null ||
      req === null ||
      isNaN(Number(actual)) ||
      isNaN(Number(req))
    )
      return null;
    const { status, diff } = calculateStatusAndDiff(actual, req, tolerance);
    if (status === "ok" || diff === 0 || diff === null) return null; // No indicator for 'ok' or zero difference

    const isHigh = status === "high";
    const colorClass = isHigh ? "text-red-500" : "text-orange-500"; // Red for high, orange for low
    const sign = isHigh ? "+" : "";

    return (
      <span
        className={`ml-1 text-xs font-semibold ${colorClass} flex items-center`}
      >
        <Triangle
          className={`w-2 h-2 fill-current ${
            isHigh ? "rotate-0" : "rotate-180"
          }`}
        />
        {sign}
        {diff.toFixed(fieldType === "pressure" ? 1 : 0)}
      </span>
    );
  };

  const currentSlotTableTitle = useMemo(() => {
    if (!currentActiveSlotKey) return t("sccDailyHTQC.noActiveSlot");
    const slotConfig = TIME_SLOTS_CONFIG.find(
      (s) => s.key === currentActiveSlotKey
    );
    if (!slotConfig) return t("sccDailyHTQC.noActiveSlot");
    return `${t("sccDailyHTQC.currentInspectionSlot")}: ${slotConfig.label} (#${
      slotConfig.inspectionNo
    })`;
  }, [currentActiveSlotKey, t]);

  const renderCurrentSlotTable = () => {
    if (!currentActiveSlotKey) return null;
    const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
    if (!currentSlot) return null;

    const parameters = [
      {
        label: t("sccDailyHTQC.temperature"),
        field: "temp",
        unit: "°C",
        tolerance: TEMP_TOLERANCE
      },
      {
        label: t("sccDailyHTQC.timing"),
        field: "time",
        unit: "Sec",
        tolerance: TIME_TOLERANCE
      },
      {
        label: t("sccDailyHTQC.pressure"),
        field: "pressure",
        unit: "Bar",
        tolerance: PRESSURE_TOLERANCE
      } // Assuming Bar unit
    ];

    return (
      <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
        <table className="min-w-full text-xs divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-r w-1/3">
                {t("sccDailyHTQC.parameter")}
              </th>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-700 border-r w-1/3">
                {t("sccDailyHTQC.reqValue")}
              </th>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-700 w-1/3">
                {t("sccDailyHTQC.actualValue")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parameters.map((param) => {
              const reqVal = currentSlot[`${param.field}_req`];
              const actualVal = currentSlot[`${param.field}_actual`];
              const isNA = currentSlot[`${param.field}_isNA`];
              const { status } = calculateStatusAndDiff(
                actualVal,
                reqVal,
                param.tolerance
              );

              return (
                <tr
                  key={param.field}
                  className={`hover:bg-gray-50 ${getCellBG(status, isNA)}`}
                >
                  <td className="px-3 py-2 border-r font-medium">
                    {param.label} {param.unit ? `(${param.unit})` : ""}
                  </td>
                  <td className="px-3 py-2 border-r text-center">
                    {reqVal !== null ? reqVal : "N/A"}
                  </td>
                  <td className={`px-1.5 py-1.5 text-center`}>
                    {isNA ? (
                      <span className="italic text-gray-500">
                        {t("scc.na")}
                      </span>
                    ) : (
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={actualVal !== null ? actualVal : ""}
                          onChange={(e) =>
                            handleSlotActualValueChange(
                              currentActiveSlotKey,
                              param.field,
                              e.target.value
                            )
                          }
                          className={`${inputFieldClasses} text-center text-xs p-1 w-20`}
                        />
                        {renderDifference(
                          actualVal,
                          reqVal,
                          param.tolerance,
                          param.field
                        )}
                      </div>
                    )}
                    <div className="flex justify-center items-center space-x-2 mt-1">
                      {!isNA && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotIncrementDecrement(
                                currentActiveSlotKey,
                                param.field,
                                "decrement"
                              )
                            }
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotIncrementDecrement(
                                currentActiveSlotKey,
                                param.field,
                                "increment"
                              )
                            }
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <Plus size={12} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          toggleSlotNA(currentActiveSlotKey, param.field)
                        }
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        {isNA ? (
                          <EyeOff size={12} className="text-gray-500" />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPreviousRecordsTable = () => {
    if (!showHistory) return null;
    const submittedInspections = (localFormData.inspections || [])
      .filter((insp) => insp.timeSlotKey !== currentActiveSlotKey) // Exclude current active slot
      .sort((a, b) => a.inspectionNo - b.inspectionNo);

    if (submittedInspections.length === 0) {
      return (
        <p className="text-sm text-gray-500 italic mt-2">
          {t("sccDailyHTQC.noHistoryToShow")}
        </p>
      );
    }

    const parameters = [
      {
        label: t("sccDailyHTQC.temperature"),
        field: "temp",
        unit: "°C",
        tolerance: TEMP_TOLERANCE
      },
      {
        label: t("sccDailyHTQC.timing"),
        field: "time",
        unit: "Sec",
        tolerance: TIME_TOLERANCE
      },
      {
        label: t("sccDailyHTQC.pressure"),
        field: "pressure",
        unit: "Bar",
        tolerance: PRESSURE_TOLERANCE
      }
    ];

    return (
      <div className="border border-gray-300 rounded-lg shadow-sm bg-white mt-5 overflow-hidden">
        <h3 className="text-md font-semibold text-gray-700 px-4 py-3 bg-gray-100 border-b">
          {t("sccDailyHTQC.previousRecords")}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 min-w-[120px]">
                  {t("sccDailyHTQC.parameter")}
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
              {parameters.map((param) => (
                <tr key={param.field} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-r font-medium text-gray-700 sticky left-0 bg-white z-10">
                    {param.label} {param.unit ? `(${param.unit})` : ""}
                  </td>
                  {submittedInspections.map((insp) => {
                    const actualVal = insp[`${param.field}_actual`];
                    const reqVal = insp[`${param.field}_req`];
                    const isNA = insp[`${param.field}_isNA`];
                    const { status } = calculateStatusAndDiff(
                      actualVal,
                      reqVal,
                      param.tolerance
                    );

                    return (
                      <td
                        key={`${insp.timeSlotKey}-${param.field}`}
                        className={`px-3 py-2 border-r text-center ${getCellBG(
                          status,
                          isNA
                        )}`}
                      >
                        {isNA ? (
                          <span className="italic">{t("scc.na")}</span>
                        ) : actualVal !== null ? (
                          actualVal
                        ) : (
                          ""
                        )}
                        {!isNA &&
                          renderDifference(
                            actualVal,
                            reqVal,
                            param.tolerance,
                            param.field
                          )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        rejectReasonDropdownRef.current &&
        !rejectReasonDropdownRef.current.contains(event.target)
      ) {
        setShowRejectReasonDropdown(false);
      }
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

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">
        {t("sccDailyHTQC.title")}
      </h2>
      <p className="text-xs text-gray-600 -mt-3">
        {t("sccDailyHTQC.subtitle")}
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
              t("sccDailyHTQC.newRecordKey", "New")
            ) ||
            recordStatusMessage.includes(
              t("sccDailyHTQC.selectMoColorKey", "select MO and Color")
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
          <label htmlFor="htqcInspectionDate" className={labelClasses}>
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
            id="htqcInspectionDate"
          />
        </div>
        <div>
          <label htmlFor="htqcMachineNo" className={labelClasses}>
            {t("scc.machineNo")}
          </label>
          <select
            id="htqcMachineNo"
            name="machineNo"
            value={localFormData.machineNo || ""}
            onChange={handleMachineNoChange}
            className={inputFieldClasses}
            required
          >
            <option value="">{t("scc.selectMachine")}</option>
            {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((num) => (
              <option key={`machine-${num}`} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="htqcMoNoSearch" className={labelClasses}>
            {t("scc.moNo")}
          </label>
          <div className="relative mt-1" ref={moNoDropdownRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="htqcMoNoSearch"
              value={moNoSearch}
              ref={moNoInputRef}
              onChange={(e) => setMoNoSearch(e.target.value)}
              onFocus={() => setShowMoNoDropdown(true)}
              placeholder={t("scc.searchMoNo")}
              className={`${inputFieldClasses} pl-10`}
              required
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
          {availableMachineRecords.length > 0 && !localFormData.moNo && (
            <div className="mt-1">
              <label
                htmlFor="selectExistingMo"
                className={`${labelClasses} text-xs`}
              >
                {t("sccDailyHTQC.selectExisting")}
              </label>
              <select
                id="selectExistingMo"
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
                        baseReqTime: null,
                        baseReqPressure: null,
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
                    {rec.moNo} - {rec.color} ({rec.buyerStyle || t("scc.naCap")}
                    )
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
          <label htmlFor="htqcColor" className={labelClasses}>
            {t("scc.color")}
          </label>
          <select
            id="htqcColor"
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

      {localFormData.moNo && localFormData.color && (
        <div className="mt-4 space-y-4">
          <h3 className="text-md font-semibold text-gray-700">
            {currentSlotTableTitle}
          </h3>
          {currentActiveSlotKey ? (
            renderCurrentSlotTable()
          ) : (
            <div className="text-center py-4 text-gray-500 italic">
              {t("sccDailyHTQC.allInspectionsCompleted")}
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
                ? t("sccDailyHTQC.hideHistory")
                : t("sccDailyHTQC.checkHistory")}
            </button>
          </div>
          {renderPreviousRecordsTable()}

          {!localFormData.isStretchWashingTestDone && currentActiveSlotKey && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
              <div>
                <label htmlFor="htqcStretchTest" className={labelClasses}>
                  {t("sccDailyHTQC.stretchScratchTest")}
                </label>
                <select
                  id="htqcStretchTest"
                  value={localFormData.stretchTestResult || "Pending"}
                  onChange={(e) =>
                    handleTestResultChange("stretchTestResult", e.target.value)
                  }
                  className={`${inputFieldClasses} ${
                    localFormData.stretchTestResult === "Pass"
                      ? "bg-green-50 text-green-700"
                      : localFormData.stretchTestResult === "Reject"
                      ? "bg-red-50 text-red-700"
                      : ""
                  }`}
                >
                  <option value="Pending">{t("scc.pending")}</option>
                  <option value="Pass">{t("scc.pass")}</option>
                  <option value="Reject">{t("scc.reject")}</option>
                </select>
                {localFormData.stretchTestResult === "Reject" && (
                  <div className="mt-2 relative" ref={rejectReasonDropdownRef}>
                    <label className={`${labelClasses} text-xs`}>
                      {t("sccDailyHTQC.rejectReasons")}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowRejectReasonDropdown((prev) => !prev)
                      }
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm flex justify-between items-center"
                    >
                      <span>
                        {(localFormData.stretchTestRejectReasons || []).join(
                          ", "
                        ) || t("sccDailyHTQC.selectReasons")}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform ${
                          showRejectReasonDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showRejectReasonDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto py-1">
                        {STRETCH_TEST_REJECT_REASONS_OPTIONS.map((reason) => (
                          <div
                            key={reason}
                            onClick={() => handleRejectReasonSelect(reason)}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                              (
                                localFormData.stretchTestRejectReasons || []
                              ).includes(reason)
                                ? "bg-indigo-50 text-indigo-700"
                                : ""
                            }`}
                          >
                            {reason}
                            {(
                              localFormData.stretchTestRejectReasons || []
                            ).includes(reason) && (
                              <CheckCircle
                                size={14}
                                className="text-indigo-600"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="htqcWashingTest" className={labelClasses}>
                  {t("sccDailyHTQC.washingTest")}
                </label>
                <select
                  id="htqcWashingTest"
                  value={localFormData.washingTestResult || "Pending"}
                  onChange={(e) =>
                    handleTestResultChange("washingTestResult", e.target.value)
                  }
                  className={`${inputFieldClasses} ${
                    localFormData.washingTestResult === "Pass"
                      ? "bg-green-50 text-green-700"
                      : localFormData.washingTestResult === "Reject"
                      ? "bg-red-50 text-red-700"
                      : ""
                  }`}
                >
                  <option value="Pending">{t("scc.pending")}</option>
                  <option value="Pass">{t("scc.pass")}</option>
                  <option value="Reject">{t("scc.reject")}</option>
                </select>
              </div>
            </div>
          )}
          {localFormData.isStretchWashingTestDone /* Display read-only if tests are marked done */ && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-4 border-t border-gray-200 mt-4">
              <div>
                <label className={labelClasses}>
                  {t("sccDailyHTQC.stretchScratchTest")}
                </label>
                <input
                  type="text"
                  value={t(
                    `scc.${
                      localFormData.stretchTestResult?.toLowerCase() ||
                      "pending"
                    }`
                  )}
                  readOnly
                  className={`${inputFieldReadonlyClasses} ${
                    localFormData.stretchTestResult === "Pass"
                      ? "bg-green-100 text-green-700"
                      : localFormData.stretchTestResult === "Reject"
                      ? "bg-red-100 text-red-700"
                      : ""
                  }`}
                />
                {localFormData.stretchTestResult === "Reject" &&
                  (localFormData.stretchTestRejectReasons || []).length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      <strong>{t("sccDailyHTQC.reasons")}:</strong>{" "}
                      {localFormData.stretchTestRejectReasons.join(", ")}
                    </div>
                  )}
              </div>
              <div>
                <label className={labelClasses}>
                  {t("sccDailyHTQC.washingTest")}
                </label>
                <input
                  type="text"
                  value={t(
                    `scc.${
                      localFormData.washingTestResult?.toLowerCase() ||
                      "pending"
                    }`
                  )}
                  readOnly
                  className={`${inputFieldReadonlyClasses} ${
                    localFormData.washingTestResult === "Pass"
                      ? "bg-green-100 text-green-700"
                      : localFormData.washingTestResult === "Reject"
                      ? "bg-red-100 text-red-700"
                      : ""
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleFormActualSubmit}
          disabled={isSubmitting || !currentActiveSlotKey || loading}
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

export default DailyHTQC;
