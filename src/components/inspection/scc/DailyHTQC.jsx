// import axios from "axios";
// import {
//   Eye,
//   EyeOff,
//   Loader2,
//   Minus,
//   Plus,
//   Search,
//   Settings2,
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
//   Send,
//   ClipboardCheck,
//   UserCircle2,
//   PlusCircle,
//   ChevronDown,
//   ChevronUp,
//   X // Added ChevronUp, X
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

// // Helper: Get Face Photo URL
// const getFacePhotoUrl = (facePhotoPath) => {
//   if (!facePhotoPath) return null;
//   if (
//     facePhotoPath.startsWith("http://") ||
//     facePhotoPath.startsWith("https://")
//   )
//     return facePhotoPath;
//   if (facePhotoPath.startsWith("/storage/"))
//     return `${API_BASE_URL}${facePhotoPath}`;
//   if (facePhotoPath.startsWith("/")) {
//     try {
//       const apiOrigin = new URL(API_BASE_URL).origin;
//       return `${apiOrigin}${facePhotoPath}`;
//     } catch (e) {
//       console.warn(
//         "API_BASE_URL is not valid for operator image paths, using path directly:",
//         facePhotoPath
//       );
//       return facePhotoPath;
//     }
//   }
//   console.warn("Unhandled operator face_photo path format:", facePhotoPath);
//   return facePhotoPath;
// };

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
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
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
//   const [totalMachines, setTotalMachines] = useState(15); // For HT
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
//   const [regOperatorData, setRegOperatorData] = useState(null);
//   const [regOperatorLoading, setRegOperatorLoading] = useState(false);
//   const [moDropdownOptions, setMoDropdownOptions] = useState([]);
//   const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
//   const [isRegLoading, setIsRegLoading] = useState(false);

//   const regMoSearchInputRef = useRef(null);
//   const regMoDropdownContainerRef = useRef(null);

//   const [registeredMachines, setRegisteredMachines] = useState([]);
//   const [uniqueMoNosForDate, setUniqueMoNosForDate] = useState([]);

//   const [filterHourlyInspMO, setFilterHourlyInspMO] = useState("All");
//   const [filterHourlyInspMachineNo, setFilterHourlyInspMachineNo] =
//     useState("All");
//   const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
//   const [actualValues, setActualValues] = useState({});
//   const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
//   const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

//   const [filterTestResultMO, setFilterTestResultMO] = useState("All");
//   const [filterTestResultMachineNo, setFilterTestResultMachineNo] =
//     useState("All");
//   const [testResultsData, setTestResultsData] = useState({});
//   const [submittingTestResultId, setSubmittingTestResultId] = useState(null);
//   const [scratchDefectOptions, setScratchDefectOptions] = useState([]);
//   const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
//   const [currentMachineForRejectReason, setCurrentMachineForRejectReason] =
//     useState(null);

//   const htMachineOptions = useMemo(
//     () => Array.from({ length: totalMachines }, (_, i) => String(i + 1)),
//     [totalMachines]
//   );

//   useEffect(() => {
//     const fetchScratchDefects = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/scratch-defects`
//         );
//         setScratchDefectOptions(response.data || []);
//       } catch (error) {
//         console.error("Error fetching scratch defects:", error);
//         Swal.fire(
//           t("scc.error"),
//           t(
//             "sccScratchDefects.failedToFetch",
//             "Failed to fetch scratch defects."
//           ),
//           "error"
//         );
//       }
//     };
//     fetchScratchDefects();
//   }, [t]);

//   useEffect(() => {
//     const fetchRegOperator = async () => {
//       if (!regMachineNo) {
//         setRegOperatorData(null);
//         return;
//       }
//       setRegOperatorLoading(true);
//       try {
//         // For Daily HT QC, operator type is always 'ht'
//         const response = await axios.get(
//           `${API_BASE_URL}/api/scc/operator-by-machine/ht/${regMachineNo}`
//         );
//         setRegOperatorData(response.data?.data || null);
//       } catch (error) {
//         setRegOperatorData(null);
//         if (
//           !(
//             error.response?.status === 404 &&
//             error.response?.data?.message === "OPERATOR_NOT_FOUND"
//           )
//         ) {
//           console.error("Error fetching operator for registration:", error);
//         }
//       } finally {
//         setRegOperatorLoading(false);
//       }
//     };
//     fetchRegOperator();
//   }, [regMachineNo]);

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

//   const handleMoSelect = (selectedMo) => {
//     setRegMoNoSearch(selectedMo.moNo);
//     setRegMoNo(selectedMo.moNo);
//     setRegBuyer(selectedMo.buyer);
//     setRegBuyerStyle(selectedMo.buyerStyle);
//     setShowRegMoDropdown(false);
//     setRegColor("");
//     setRegAvailableColors([]);
//     setRegReqTemp(null);
//     setRegReqTime(null);
//     setRegReqPressure(null);
//     setIsRegLoading(true);
//     axios
//       .get(
//         `${API_BASE_URL}/api/scc/ht-first-output/mo-details-for-registration`,
//         { params: { moNo: selectedMo.moNo } }
//       )
//       .then((response) => {
//         setRegAvailableColors(response.data.colors || []);
//         if (response.data.colors && response.data.colors.length === 1) {
//           handleColorChange(response.data.colors[0], selectedMo.moNo);
//         } else {
//           setIsRegLoading(false); // Stop loading if multiple colors need selection
//         }
//       })
//       .catch((error) => {
//         console.error(
//           "Error fetching MO colors:",
//           error.response?.data || error.message
//         );
//         setRegAvailableColors([]);
//         setIsRegLoading(false);
//       });
//   };

//   const handleColorChange = (newColor, moNumberFromSelect = null) => {
//     setRegColor(newColor);
//     const moToUse = moNumberFromSelect || regMoNo;
//     if (moToUse && newColor) {
//       setIsRegLoading(true);
//       axios
//         .get(`${API_BASE_URL}/api/scc/ht-first-output/specs-for-registration`, {
//           params: { moNo: moToUse, color: newColor }
//         })
//         .then((response) => {
//           const specs = response.data;
//           setRegReqTemp(specs?.reqTemp !== undefined ? specs.reqTemp : null);
//           setRegReqTime(specs?.reqTime !== undefined ? specs.reqTime : null);
//           setRegReqPressure(
//             specs?.reqPressure !== undefined ? specs.reqPressure : null
//           );
//         })
//         .catch((error) => {
//           console.error(
//             "Error fetching specs:",
//             error.response?.data || error.message
//           );
//           setRegReqTemp(null);
//           setRegReqTime(null);
//           setRegReqPressure(null);
//           Swal.fire(
//             t("scc.error"),
//             t(
//               "sccDailyHTQC.errorFetchingSpecs",
//               "Error fetching standard specs."
//             ),
//             "error"
//           );
//         })
//         .finally(() => setIsRegLoading(false));
//     } else {
//       setRegReqTemp(null);
//       setRegReqTime(null);
//       setRegReqPressure(null);
//     }
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
//     setRegOperatorData(null);
//   };

//   const handleRegisterMachine = async () => {
//     if (!regMachineNo || !regMoNo || !regColor) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t(
//           "sccDailyHTQC.validation.fillMachineMoColor",
//           "Please select Machine No, MO No, and Color."
//         ),
//         "warning"
//       );
//       return;
//     }
//     if (
//       regOperatorData &&
//       (!regOperatorData.emp_id || !regOperatorData.emp_reference_id)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t(
//           "sccDailyHTQC.validation.operatorDataIncomplete",
//           "Operator data is incomplete or not found."
//         ),
//         "warning"
//       );
//       // return; // Decide if this is a hard stop or just a warning
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
//       operatorData: regOperatorData,
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
//     const paramsForDate = { inspectionDate: formatDateForAPI(inspectionDate) };

//     axios
//       .get(`${API_BASE_URL}/api/scc/daily-htfu/distinct-mos`, {
//         params: paramsForDate
//       })
//       .then((res) => setUniqueMoNosForDate(res.data || []))
//       .catch((err) => {
//         console.error("Error fetching distinct MOs:", err);
//         setUniqueMoNosForDate([]);
//       });

//     axios
//       .get(`${API_BASE_URL}/api/scc/daily-htfu/by-date`, {
//         params: paramsForDate
//       })
//       .then((response) => {
//         setRegisteredMachines(response.data || []);
//         const initialTestResults = {};
//         (response.data || []).forEach((machine) => {
//           initialTestResults[machine._id] = {
//             stretchTestResult: machine.stretchTestResult || "",
//             stretchTestRejectReasons: machine.stretchTestRejectReasons || [],
//             washingTestResult: machine.washingTestResult || ""
//           };
//         });
//         setTestResultsData(initialTestResults);
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

//   useEffect(() => {
//     const newActuals = {};
//     if (selectedTimeSlotKey && registeredMachines.length > 0) {
//       registeredMachines.forEach((machine) => {
//         const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
//         const existingInspection = machine.inspections.find(
//           (insp) => insp.timeSlotKey === selectedTimeSlotKey
//         );
//         if (existingInspection) {
//           newActuals[docSlotKey] = {
//             temp_actual: existingInspection.temp_actual,
//             temp_isNA: existingInspection.temp_isNA,
//             temp_isUserModified: true,
//             time_actual: existingInspection.time_actual,
//             time_isNA: existingInspection.time_isNA,
//             time_isUserModified: true,
//             pressure_actual: existingInspection.pressure_actual,
//             pressure_isNA: existingInspection.pressure_isNA,
//             pressure_isUserModified: true
//           };
//         } else {
//           if (
//             !actualValues[docSlotKey] ||
//             !actualValues[docSlotKey].temp_isUserModified
//           ) {
//             newActuals[docSlotKey] = {
//               temp_actual: null,
//               temp_isNA: false,
//               temp_isUserModified: false,
//               time_actual: null,
//               time_isNA: false,
//               time_isUserModified: false,
//               pressure_actual: null,
//               pressure_isNA: false,
//               pressure_isUserModified: false
//             };
//           } else {
//             newActuals[docSlotKey] = actualValues[docSlotKey];
//           }
//         }
//       });
//       if (JSON.stringify(newActuals) !== JSON.stringify(actualValues)) {
//         setActualValues(newActuals);
//       }
//     } else if (!selectedTimeSlotKey && Object.keys(actualValues).length > 0) {
//       setActualValues({});
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedTimeSlotKey, registeredMachines]);

//   const handleActualValueChange = (docId, timeSlotKey, paramField, value) => {
//     const key = `${docId}_${timeSlotKey}`;
//     const actualFieldKey = `${paramField}_actual`;
//     const userModifiedFlagKey = `${paramField}_isUserModified`;
//     setActualValues((prev) => {
//       const currentSlotData = prev[key] || {
//         temp_isNA: false,
//         time_isNA: false,
//         pressure_isNA: false,
//         temp_isUserModified: false,
//         time_isUserModified: false,
//         pressure_isUserModified: false
//       };
//       return {
//         ...prev,
//         [key]: {
//           ...currentSlotData,
//           [actualFieldKey]: value === "" ? null : Number(value),
//           [userModifiedFlagKey]: true
//         }
//       };
//     });
//   };

//   const toggleActualNA = (docId, timeSlotKey, paramField) => {
//     const key = `${docId}_${timeSlotKey}`;
//     const actualFieldKey = `${paramField}_actual`;
//     const isNAFlagKey = `${paramField}_isNA`;
//     const userModifiedFlagKey = `${paramField}_isUserModified`;
//     setActualValues((prev) => {
//       const currentSlotActuals = prev[key] || {
//         temp_isNA: false,
//         time_isNA: false,
//         pressure_isNA: false,
//         temp_isUserModified: false,
//         time_isUserModified: false,
//         pressure_isUserModified: false
//       };
//       const newIsNA = !currentSlotActuals[isNAFlagKey];
//       return {
//         ...prev,
//         [key]: {
//           ...currentSlotActuals,
//           [actualFieldKey]: newIsNA ? null : currentSlotActuals[actualFieldKey],
//           [isNAFlagKey]: newIsNA,
//           [userModifiedFlagKey]: true
//         }
//       };
//     });
//   };

//   const handleIncrementDecrement = (
//     docId,
//     timeSlotKey,
//     paramField,
//     increment
//   ) => {
//     const key = `${docId}_${timeSlotKey}`;
//     const actualFieldKey = `${paramField}_actual`;
//     const userModifiedFlagKey = `${paramField}_isUserModified`;
//     setActualValues((prev) => {
//       const currentSlotActuals = prev[key] || {
//         temp_isNA: false,
//         time_isNA: false,
//         pressure_isNA: false,
//         temp_isUserModified: false,
//         time_isUserModified: false,
//         pressure_isUserModified: false
//       };
//       let currentActualNum = Number(currentSlotActuals[actualFieldKey]);
//       if (isNaN(currentActualNum)) {
//         const machineDoc = registeredMachines.find((m) => m._id === docId);
//         currentActualNum =
//           (paramField === "temp"
//             ? machineDoc?.baseReqTemp
//             : paramField === "time"
//             ? machineDoc?.baseReqTime
//             : machineDoc?.baseReqPressure) || 0;
//       }
//       let newValue = currentActualNum + increment;
//       if (paramField === "pressure") newValue = parseFloat(newValue.toFixed(1));
//       else newValue = Math.max(0, newValue);
//       return {
//         ...prev,
//         [key]: {
//           ...currentSlotActuals,
//           [actualFieldKey]: newValue,
//           [userModifiedFlagKey]: true
//         }
//       };
//     });
//   };

//   const getFilteredTableData = (baseData, filterMO, filterMachine) => {
//     let filtered = baseData;
//     if (filterMO !== "All") {
//       filtered = filtered.filter((m) => m.moNo === filterMO);
//     }
//     if (filterMachine !== "All") {
//       filtered = filtered.filter((m) => m.machineNo === filterMachine);
//     }
//     return filtered.sort((a, b) => {
//       const numA = parseInt(a.machineNo, 10);
//       const numB = parseInt(b.machineNo, 10);
//       return !isNaN(numA) && !isNaN(numB)
//         ? numA - numB
//         : a.machineNo.localeCompare(b.machineNo);
//     });
//   };

//   const inspectionTableDisplayData = useMemo(
//     () =>
//       getFilteredTableData(
//         registeredMachines,
//         filterHourlyInspMO,
//         filterHourlyInspMachineNo
//       ),
//     [registeredMachines, filterHourlyInspMO, filterHourlyInspMachineNo]
//   );

//   const testResultsTableDisplayData = useMemo(
//     () =>
//       getFilteredTableData(
//         registeredMachines,
//         filterTestResultMO,
//         filterTestResultMachineNo
//       ),
//     [registeredMachines, filterTestResultMO, filterTestResultMachineNo]
//   );

//   const handleSubmitMachineSlotInspection = async (machineDoc) => {
//     if (!selectedTimeSlotKey) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.selectTimeSlot"),
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
//       : currentActuals.temp_actual ?? null;
//     const timeActualToSubmit = currentActuals.time_isNA
//       ? null
//       : currentActuals.time_actual ?? null;
//     const pressureActualToSubmit = currentActuals.pressure_isNA
//       ? null
//       : currentActuals.pressure_actual ?? null;

//     if (
//       (!currentActuals.temp_isNA && tempActualToSubmit === null) ||
//       (!currentActuals.time_isNA && timeActualToSubmit === null) ||
//       (!currentActuals.pressure_isNA && pressureActualToSubmit === null)
//     ) {
//       Swal.fire(
//         t("scc.validationErrorTitle"),
//         t("sccDailyHTQC.validation.fillAllActualsOrNA"),
//         "warning"
//       );
//       return;
//     }
//     const payload = {
//       inspectionDate: formatDateForAPI(inspectionDate),
//       timeSlotKey: selectedTimeSlotKey,
//       inspectionNo: currentSlotConfig.inspectionNo,
//       dailyTestingDocId: machineDoc._id,
//       temp_req: machineDoc.baseReqTemp ?? null,
//       temp_actual: tempActualToSubmit,
//       temp_isNA: !!currentActuals.temp_isNA,
//       temp_isUserModified: !!currentActuals.temp_isUserModified,
//       time_req: machineDoc.baseReqTime ?? null,
//       time_actual: timeActualToSubmit,
//       time_isNA: !!currentActuals.time_isNA,
//       time_isUserModified: !!currentActuals.time_isUserModified,
//       pressure_req: machineDoc.baseReqPressure ?? null,
//       pressure_actual: pressureActualToSubmit,
//       pressure_isNA: !!currentActuals.pressure_isNA,
//       pressure_isUserModified: !!currentActuals.pressure_isUserModified,
//       emp_id: user.emp_id
//     };
//     setSubmittingMachineSlot(docSlotKey);
//     const success = await onFormSubmit("submitSlotInspection", payload);
//     setSubmittingMachineSlot(null);
//     if (success) fetchRegisteredMachinesForDate();
//   };

//   const handleTestResultChange = (
//     docId,
//     field,
//     valueOrReasons,
//     isReasons = false
//   ) => {
//     setTestResultsData((prev) => {
//       const newDocData = {
//         ...(prev[docId] || {
//           stretchTestResult: "",
//           stretchTestRejectReasons: [],
//           washingTestResult: ""
//         })
//       }; // Ensure init
//       if (isReasons) {
//         newDocData.stretchTestRejectReasons = valueOrReasons;
//       } else {
//         newDocData[field] = valueOrReasons;
//       }
//       if (field === "stretchTestResult" && valueOrReasons === "Pass") {
//         newDocData.stretchTestRejectReasons = [];
//       }
//       return { ...prev, [docId]: newDocData };
//     });
//   };

//   const openRejectReasonModal = (machineId) => {
//     setCurrentMachineForRejectReason(machineId);
//     setShowRejectReasonModal(true);
//   };

//   const handleRejectReasonSave = (selectedReasons) => {
//     if (currentMachineForRejectReason) {
//       handleTestResultChange(
//         currentMachineForRejectReason,
//         "stretchTestRejectReasons",
//         selectedReasons,
//         true
//       );
//     }
//     setShowRejectReasonModal(false);
//     setCurrentMachineForRejectReason(null);
//   };

//   const handleSubmitTestResult = async (machineDoc, testTypeToSubmit) => {
//     const docId = machineDoc._id;
//     const currentTestValues = testResultsData[docId];
//     if (!currentTestValues) return;
//     let payload = { dailyTestingDocId: docId, emp_id: user.emp_id };
//     let successMessage = "";

//     if (testTypeToSubmit === "stretch") {
//       if (!currentTestValues.stretchTestResult) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t("sccDailyHTQC.validation.selectStretchResult"),
//           "warning"
//         );
//         return;
//       }
//       if (
//         currentTestValues.stretchTestResult === "Reject" &&
//         (!currentTestValues.stretchTestRejectReasons ||
//           currentTestValues.stretchTestRejectReasons.length === 0)
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t("sccDailyHTQC.validation.selectStretchRejectReason"),
//           "warning"
//         );
//         return;
//       }
//       payload.stretchTestResult = currentTestValues.stretchTestResult;
//       payload.stretchTestRejectReasons =
//         currentTestValues.stretchTestResult === "Reject"
//           ? currentTestValues.stretchTestRejectReasons
//           : [];
//       successMessage = t("sccDailyHTQC.stretchTestSubmittedSuccess");
//     } else if (testTypeToSubmit === "washing") {
//       if (!currentTestValues.washingTestResult) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t("sccDailyHTQC.validation.selectWashingResult"),
//           "warning"
//         );
//         return;
//       }
//       payload.washingTestResult = currentTestValues.washingTestResult;
//       successMessage = t("sccDailyHTQC.washingTestSubmittedSuccess");
//     } else {
//       return;
//     }

//     setSubmittingTestResultId(docId + "_" + testTypeToSubmit);
//     const success = await onFormSubmit("updateDailyHTFUTestResult", payload);
//     setSubmittingTestResultId(null);
//     if (success) {
//       Swal.fire(t("scc.success"), successMessage, "success");
//       fetchRegisteredMachinesForDate();
//     }
//   };

//   const getStatusAndBG = useCallback(
//     (actual, req, toleranceKey, isNA, forCellBackground = false) => {
//       const currentTolerance = tolerances[toleranceKey];
//       if (isNA)
//         return {
//           statusText: "N/A",
//           bgColor: forCellBackground
//             ? "bg-slate-100"
//             : "bg-slate-200 text-slate-600",
//           icon: <EyeOff size={14} className="mr-1" />
//         };
//       if (forCellBackground && (actual === null || actual === undefined))
//         return { statusText: "", bgColor: "bg-white" };
//       if (
//         actual === null ||
//         req === null ||
//         actual === undefined ||
//         req === undefined
//       )
//         return {
//           statusText: t("scc.pending"),
//           bgColor: "bg-amber-100 text-amber-700",
//           icon: <Clock size={14} className="mr-1" />
//         };
//       const numActual = Number(actual);
//       const numReq = Number(req);
//       if (isNaN(numActual) || isNaN(numReq))
//         return {
//           statusText: t("scc.invalidData"),
//           bgColor: "bg-gray-100 text-gray-700",
//           icon: <AlertTriangle size={14} className="mr-1" />
//         };
//       let diff = numActual - numReq;
//       if (
//         toleranceKey === "pressure" ||
//         (typeof req === "number" && req.toString().includes("."))
//       ) {
//         diff = parseFloat(diff.toFixed(1));
//       } else {
//         diff = Math.round(diff);
//       }
//       if (Math.abs(diff) <= currentTolerance)
//         return {
//           statusText: `OK`,
//           valueText: `(${numActual})`,
//           bgColor: "bg-green-100 text-green-700",
//           icon: <Check size={14} className="mr-1" />
//         };
//       const deviationText = diff < 0 ? `Low` : `High`;
//       const valueText = `(${numActual}, ${diff < 0 ? "" : "+"}${
//         typeof diff === "number" ? diff.toFixed(1) : diff
//       })`;
//       return {
//         statusText: deviationText,
//         valueText,
//         bgColor: "bg-red-100 text-red-700",
//         icon: <AlertTriangle size={14} className="mr-1" />
//       };
//     },
//     [t, tolerances]
//   );

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
//       if (
//         machineNoDropdownRef.current &&
//         !machineNoDropdownRef.current.contains(event.target) &&
//         machineNoInputRef.current &&
//         !machineNoInputRef.current.contains(event.target)
//       ) {
//         setShowMachineNoDropdown(false);
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
//     !!submittingMachineSlot ||
//     !!submittingTestResultId ||
//     regOperatorLoading;

//   const renderOperatorDataCell = (operatorData) => {
//     if (regOperatorLoading && !operatorData)
//       return (
//         <Loader2 size={16} className="animate-spin mx-auto text-indigo-500" />
//       ); // Show loader if specific regOperator is loading
//     if (!operatorData || !operatorData.emp_id) {
//       return (
//         <span className="text-xs text-slate-400 italic">{t("scc.naCap")}</span>
//       );
//     }
//     const imageUrl = operatorData.emp_face_photo
//       ? getFacePhotoUrl(operatorData.emp_face_photo)
//       : null;
//     return (
//       <div className="flex flex-col items-center justify-center text-center p-0.5 min-w-[90px] max-w-[120px] mx-auto">
//         {imageUrl ? (
//           <img
//             src={imageUrl}
//             alt={operatorData.emp_eng_name || "Operator"}
//             className="w-8 h-8 rounded-full object-cover border border-slate-200 mb-0.5"
//             onError={(e) => {
//               e.currentTarget.style.display = "none";
//             }}
//           />
//         ) : (
//           <UserCircle2 className="w-8 h-8 text-slate-300 mb-0.5" />
//         )}
//         <span
//           className="text-[10px] font-medium text-slate-700 truncate block w-full"
//           title={operatorData.emp_id}
//         >
//           {operatorData.emp_id}
//         </span>
//         <span
//           className="text-[9px] text-slate-500 truncate block w-full"
//           title={operatorData.emp_eng_name}
//         >
//           {operatorData.emp_eng_name || t("scc.naCap")}
//         </span>
//       </div>
//     );
//   };

//   const renderSpecsCell = (machine) => {
//     return (
//       <div className="text-[10px] p-1 space-y-0.5 min-w-[100px] text-left">
//         <div className="flex items-center">
//           <Thermometer size={10} className="mr-1 text-red-500 flex-shrink-0" />{" "}
//           {t("sccDailyHTQC.tempShort")}: {machine.baseReqTemp ?? t("scc.naCap")}
//           °C
//         </div>
//         <div className="flex items-center">
//           <Clock size={10} className="mr-1 text-blue-500 flex-shrink-0" />{" "}
//           {t("sccDailyHTQC.timeShort")}: {machine.baseReqTime ?? t("scc.naCap")}
//           s
//         </div>
//         <div className="flex items-center">
//           <Gauge size={10} className="mr-1 text-green-500 flex-shrink-0" />{" "}
//           {t("sccDailyHTQC.pressureShort")}:{" "}
//           {machine.baseReqPressure ?? t("scc.naCap")}Bar
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
//       {overallIsLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
//           <Loader2 className="animate-spin h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
//         </div>
//       )}
//       <header className="text-center mb-6">
//         <h1 className="text-sm md:text-xl font-bold text-slate-800">
//           {t("sccDailyHTQC.mainTitle")}
//         </h1>
//         <p className="text-xs text-slate-500 mt-1">
//           {t("sccDailyHTQC.mainSubtitle")}
//         </p>
//       </header>

//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <div className="flex justify-between items-center mb-3">
//           <div className="flex items-center text-slate-700">
//             <Settings2 size={18} className="mr-2 text-indigo-600" />
//             <h2 className="text-md md:text-lg font-semibold">
//               {t("sccDailyHTQC.settingsTitle")}
//             </h2>
//           </div>
//           <button
//             type="button"
//             onClick={() => setSettingsEnabled(!settingsEnabled)}
//             className={`p-1.5 md:p-2 rounded-md flex items-center transition-colors ${
//               settingsEnabled
//                 ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
//                 : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//             }`}
//             title={
//               settingsEnabled
//                 ? t("scc.turnOffSettings")
//                 : t("scc.turnOnSettings")
//             }
//           >
//             {settingsEnabled ? <Power size={16} /> : <PowerOff size={16} />}{" "}
//             <span className="ml-1.5 text-xs md:text-sm font-medium">
//               {settingsEnabled ? t("scc.onUpper") : t("scc.offUpper")}
//             </span>
//           </button>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4 items-end">
//           <div>
//             <label htmlFor="totalMachines" className={labelClasses}>
//               {t("sccDailyHTQC.totalMachines")}
//             </label>
//             <input
//               id="totalMachines"
//               type="number"
//               value={totalMachines}
//               onChange={(e) =>
//                 setTotalMachines(Math.max(1, Number(e.target.value)))
//               }
//               disabled={!settingsEnabled}
//               className={`${baseInputClasses} py-1.5`}
//             />
//           </div>
//           <div>
//             <label htmlFor="tempTolerance" className={labelClasses}>
//               <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.tempTolerance")}
//             </label>
//             <input
//               id="tempTolerance"
//               type="number"
//               value={tolerances.temp}
//               onChange={(e) =>
//                 setTolerances((p) => ({ ...p, temp: Number(e.target.value) }))
//               }
//               disabled={!settingsEnabled}
//               className={`${baseInputClasses} py-1.5`}
//             />
//           </div>
//           <div>
//             <label htmlFor="timeTolerance" className={labelClasses}>
//               <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.timeTolerance")}
//             </label>
//             <input
//               id="timeTolerance"
//               type="number"
//               value={tolerances.time}
//               onChange={(e) =>
//                 setTolerances((p) => ({ ...p, time: Number(e.target.value) }))
//               }
//               disabled={!settingsEnabled}
//               className={`${baseInputClasses} py-1.5`}
//             />
//           </div>
//           <div>
//             <label htmlFor="pressureTolerance" className={labelClasses}>
//               <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
//               {t("sccDailyHTQC.pressureTolerance")}
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
//               className={`${baseInputClasses} py-1.5`}
//             />
//           </div>
//         </div>
//       </section>

//       <div className="max-w-xs mx-auto my-4 md:my-5">
//         <label
//           htmlFor="htqcInspectionDate"
//           className={`${labelClasses} text-center`}
//         >
//           {t("scc.inspectionDate")}
//         </label>
//         <div className="relative">
//           <DatePicker
//             selected={inspectionDate}
//             onChange={(date) => setInspectionDate(date)}
//             dateFormat="MM/dd/yyyy"
//             className={`${baseInputClasses} py-1.5 text-center`}
//             id="htqcInspectionDate"
//             popperPlacement="bottom"
//             wrapperClassName="w-full"
//           />
//           <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
//         </div>
//       </div>

//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
//           <BookUser size={18} className="mr-2 text-indigo-600" />{" "}
//           {t("sccDailyHTQC.registerMachineTitle")}
//         </h2>
//         <div className="overflow-x-auto pretty-scrollbar">
//           <table
//             className="w-full text-xs sm:text-sm whitespace-nowrap"
//             style={{ tableLayout: "fixed" }}
//           >
//             <colgroup>
//               <col style={{ width: "8%" }} /> {/* Machine No */}
//               <col style={{ width: "15%" }} /> {/* MO No */}
//               <col style={{ width: "22%" }} /> {/* Order Details */}
//               <col style={{ width: "12%" }} /> {/* Color */}
//               <col style={{ width: "15%" }} /> {/* Operator Data */}
//               <col style={{ width: "15%" }} /> {/* Specs */}
//               <col style={{ width: "13%" }} /> {/* Action */}
//             </colgroup>
//             <thead className="bg-slate-100">
//               <tr className="text-left text-slate-600 font-semibold">
//                 <th className="p-2 border-r">{t("scc.machineNo")}</th>
//                 <th className="p-2 border-r">{t("scc.moNo")}</th>
//                 <th className="p-2 border-r">
//                   {t("sccDailyHTQC.orderDetails")}
//                 </th>
//                 <th className="p-2 border-r">{t("scc.color")}</th>
//                 <th className="p-2 border-r text-center">
//                   {t("scc.operatorData")}
//                 </th>
//                 <th className="p-2 border-r text-center">
//                   {t("sccDailyHTQC.specs")}
//                 </th>
//                 <th className="p-2 text-center">{t("scc.action")}</th>
//               </tr>
//             </thead>
//             <tbody className="align-top">
//               {" "}
//               {/* Ensure vertical alignment for multi-line content */}
//               <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
//                 <td className="p-1.5 border-r">
//                   <select
//                     value={regMachineNo}
//                     onChange={(e) => setRegMachineNo(e.target.value)}
//                     className={`${baseInputClasses} py-1.5`}
//                   >
//                     <option value="">{t("scc.select")}</option>
//                     {htMachineOptions.map((m) => (
//                       <option key={`reg-mach-${m}`} value={m}>
//                         {m}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td
//                   className="p-1.5 border-r relative"
//                   ref={regMoDropdownContainerRef}
//                 >
//                   <div className="relative z-[50]">
//                     {" "}
//                     {/* Ensure dropdown is above other elements */}
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
//                       <ul className="absolute z-50 mt-1 w-max min-w-[200px] bg-white shadow-2xl max-h-52 md:max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-y-auto top-full left-0">
//                         {moDropdownOptions.map((mo, idx) => (
//                           <li
//                             key={idx}
//                             onClick={() => handleMoSelect(mo)}
//                             className="text-slate-900 cursor-pointer select-none relative py-1.5 px-3 hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-normal"
//                           >
//                             {mo.moNo}{" "}
//                             <span className="text-xs text-slate-500">
//                               ({mo.buyerStyle || t("scc.naCap")})
//                             </span>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>
//                 </td>
//                 <td className="p-1.5 border-r text-[11px] break-words">
//                   {" "}
//                   {/* Allow text to wrap */}
//                   <div>
//                     {t("scc.buyer")}:{" "}
//                     <span className="font-medium">
//                       {regBuyer || t("scc.naCap")}
//                     </span>
//                   </div>
//                   <div>
//                     {t("scc.buyerStyle")}:{" "}
//                     <span className="font-medium">
//                       {regBuyerStyle || t("scc.naCap")}
//                     </span>
//                   </div>
//                 </td>
//                 <td className="p-1.5 border-r">
//                   <select
//                     value={regColor}
//                     onChange={(e) => handleColorChange(e.target.value)}
//                     className={`${baseInputClasses} py-1.5`}
//                     disabled={regAvailableColors.length === 0}
//                   >
//                     <option value="">{t("scc.selectColor")}</option>
//                     {regAvailableColors.map((c) => (
//                       <option key={`reg-col-${c}`} value={c}>
//                         {c}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-0 border-r text-center">
//                   {renderOperatorDataCell(regOperatorData)}
//                 </td>
//                 <td className="p-0 border-r text-center">
//                   {renderSpecsCell({
//                     baseReqTemp: regReqTemp,
//                     baseReqTime: regReqTime,
//                     baseReqPressure: regReqPressure
//                   })}
//                 </td>
//                 <td className="p-1.5 text-center">
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

//       {/* Test Results (Stretch, Scratch & Washing) Table */}
//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <h2 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center">
//           <ClipboardCheck size={16} className="mr-2 text-purple-600" />{" "}
//           {t("sccDailyHTQC.testResultsTitle")}
//         </h2>
//         <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
//           <div className="w-full sm:w-auto sm:min-w-[150px]">
//             <label htmlFor="filterTestResultMO" className={labelClasses}>
//               {t("scc.moNo")}
//             </label>
//             <select
//               id="filterTestResultMO"
//               value={filterTestResultMO}
//               onChange={(e) => setFilterTestResultMO(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="All">
//                 {t("sccDailyHTQC.allMoNo", "All MOs")}
//               </option>
//               {uniqueMoNosForDate.map((mo) => (
//                 <option key={`filter-mo-test-${mo}`} value={mo}>
//                   {mo}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="w-full sm:w-auto sm:min-w-[150px]">
//             <label htmlFor="filterTestResultMachineNo" className={labelClasses}>
//               {t("scc.machineNo")}
//             </label>
//             <select
//               id="filterTestResultMachineNo"
//               value={filterTestResultMachineNo}
//               onChange={(e) => setFilterTestResultMachineNo(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="All">{t("scc.allMachines")}</option>
//               {htMachineOptions
//                 .filter((m) =>
//                   registeredMachines.some((rm) => rm.machineNo === m)
//                 )
//                 .map((m) => (
//                   <option key={`test-filter-mach-${m}`} value={m}>
//                     {m}
//                   </option>
//                 ))}
//             </select>
//           </div>
//         </div>
//         <div className="overflow-x-auto pretty-scrollbar">
//           <table className="min-w-full text-xs border-collapse border border-slate-300">
//             <thead className="bg-slate-200 text-slate-700">
//               <tr>
//                 <th className="p-2 border border-slate-300">
//                   {t("scc.machineNo")}
//                 </th>
//                 <th className="p-2 border border-slate-300">
//                   {t("scc.operatorData")}
//                 </th>
//                 <th className="p-2 border border-slate-300">{t("scc.moNo")}</th>
//                 <th className="p-2 border border-slate-300">
//                   {t("scc.color")}
//                 </th>
//                 <th className="p-2 border border-slate-300">
//                   {t("sccDailyHTQC.stretchScratchTest")}
//                 </th>
//                 <th className="p-2 border border-slate-300">
//                   {t("sccDailyHTQC.washingTest")}
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200">
//               {testResultsTableDisplayData.length === 0 && (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="p-4 text-center text-slate-500 italic"
//                   >
//                     {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
//                   </td>
//                 </tr>
//               )}
//               {testResultsTableDisplayData.map((machine) => {
//                 const currentTestVals = testResultsData[machine._id] || {
//                   stretchTestResult: machine.stretchTestResult || "",
//                   stretchTestRejectReasons:
//                     machine.stretchTestRejectReasons || [],
//                   washingTestResult: machine.washingTestResult || ""
//                 };
//                 const isStretchSubmitted =
//                   machine.stretchTestResult &&
//                   machine.stretchTestResult !== "Pending";
//                 const isWashingSubmitted =
//                   machine.washingTestResult &&
//                   machine.washingTestResult !== "Pending";
//                 const stretchCellClass = isStretchSubmitted
//                   ? machine.stretchTestResult === "Pass"
//                     ? "bg-green-100"
//                     : "bg-red-100"
//                   : currentTestVals.stretchTestResult === "Pass"
//                   ? "bg-green-50"
//                   : currentTestVals.stretchTestResult === "Reject"
//                   ? "bg-red-50"
//                   : "";
//                 const washingCellClass = isWashingSubmitted
//                   ? machine.washingTestResult === "Pass"
//                     ? "bg-green-100"
//                     : "bg-red-100"
//                   : currentTestVals.washingTestResult === "Pass"
//                   ? "bg-green-50"
//                   : currentTestVals.washingTestResult === "Reject"
//                   ? "bg-red-50"
//                   : "";

//                 return (
//                   <tr key={`test-${machine._id}`} className="hover:bg-slate-50">
//                     <td className="p-2 border border-slate-300 text-center align-middle font-medium">
//                       {machine.machineNo}
//                     </td>
//                     <td className="p-1 border border-slate-300 align-middle">
//                       {renderOperatorDataCell(machine.operatorData)}
//                     </td>
//                     <td className="p-2 border border-slate-300 text-center align-middle">
//                       {machine.moNo}
//                     </td>
//                     <td className="p-2 border border-slate-300 text-center align-middle">
//                       {machine.color}
//                     </td>
//                     <td
//                       className={`p-2 border border-slate-300 align-top ${stretchCellClass}`}
//                     >
//                       <div className="flex flex-col space-y-1">
//                         <select
//                           value={currentTestVals.stretchTestResult}
//                           onChange={(e) =>
//                             handleTestResultChange(
//                               machine._id,
//                               "stretchTestResult",
//                               e.target.value
//                             )
//                           }
//                           className={`${baseInputClasses} py-1 text-xs`}
//                           disabled={
//                             isStretchSubmitted ||
//                             submittingTestResultId === machine._id + "_stretch"
//                           }
//                         >
//                           <option value="">{t("scc.selectStatus")}</option>
//                           <option value="Pass">{t("scc.pass")}</option>
//                           <option value="Reject">{t("scc.reject")}</option>
//                         </select>
//                         {currentTestVals.stretchTestResult === "Reject" &&
//                           !isStretchSubmitted && (
//                             <div>
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   openRejectReasonModal(machine._id)
//                                 }
//                                 className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
//                               >
//                                 <PlusCircle size={12} className="mr-1" />{" "}
//                                 {t("sccDailyHTQC.selectIssues")} (
//                                 {currentTestVals.stretchTestRejectReasons
//                                   ?.length || 0}
//                                 )
//                               </button>
//                               {currentTestVals.stretchTestRejectReasons &&
//                                 currentTestVals.stretchTestRejectReasons
//                                   .length > 0 && (
//                                   <div className="mt-1 text-[10px] text-slate-600 p-1 bg-slate-100 rounded max-h-16 overflow-y-auto">
//                                     {currentTestVals.stretchTestRejectReasons.join(
//                                       ", "
//                                     )}
//                                   </div>
//                                 )}
//                             </div>
//                           )}
//                         {isStretchSubmitted && (
//                           <div
//                             className={`text-xs mt-1 p-1 rounded ${
//                               machine.stretchTestResult === "Pass"
//                                 ? "text-green-800 bg-green-200"
//                                 : "text-red-800 bg-red-200"
//                             }`}
//                           >
//                             {t("sccDailyHTQC.resultSubmitted")}:{" "}
//                             {t(
//                               `scc.${machine.stretchTestResult.toLowerCase()}`
//                             )}
//                             {machine.stretchTestResult === "Reject" &&
//                               machine.stretchTestRejectReasons?.length > 0 && (
//                                 <div className="text-slate-600 text-[10px] mt-0.5">
//                                   ({t("sccDailyHTQC.reasons")}:{" "}
//                                   {machine.stretchTestRejectReasons.join(", ")})
//                                 </div>
//                               )}
//                           </div>
//                         )}
//                         {!isStretchSubmitted && (
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSubmitTestResult(machine, "stretch")
//                             }
//                             disabled={
//                               !currentTestVals.stretchTestResult ||
//                               submittingTestResultId ===
//                                 machine._id + "_stretch" ||
//                               parentIsSubmitting
//                             }
//                             className="mt-1 px-2 py-1 bg-sky-600 text-white text-[10px] font-medium rounded hover:bg-sky-700 disabled:bg-slate-300 flex items-center justify-center"
//                           >
//                             {submittingTestResultId ===
//                             machine._id + "_stretch" ? (
//                               <Loader2
//                                 size={12}
//                                 className="animate-spin mr-1"
//                               />
//                             ) : (
//                               <Send size={10} className="mr-1" />
//                             )}{" "}
//                             {t("sccDailyHTQC.submitStretchTest")}
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                     <td
//                       className={`p-2 border border-slate-300 align-top ${washingCellClass}`}
//                     >
//                       <div className="flex flex-col space-y-1">
//                         <select
//                           value={currentTestVals.washingTestResult}
//                           onChange={(e) =>
//                             handleTestResultChange(
//                               machine._id,
//                               "washingTestResult",
//                               e.target.value
//                             )
//                           }
//                           className={`${baseInputClasses} py-1 text-xs`}
//                           disabled={
//                             isWashingSubmitted ||
//                             submittingTestResultId === machine._id + "_washing"
//                           }
//                         >
//                           <option value="">{t("scc.selectStatus")}</option>
//                           <option value="Pass">{t("scc.pass")}</option>
//                           <option value="Reject">{t("scc.reject")}</option>
//                         </select>
//                         {isWashingSubmitted && (
//                           <div
//                             className={`text-xs mt-1 p-1 rounded ${
//                               machine.washingTestResult === "Pass"
//                                 ? "text-green-800 bg-green-200"
//                                 : "text-red-800 bg-red-200"
//                             }`}
//                           >
//                             {t("sccDailyHTQC.resultSubmitted")}:{" "}
//                             {t(
//                               `scc.${machine.washingTestResult.toLowerCase()}`
//                             )}
//                           </div>
//                         )}
//                         {!isWashingSubmitted && (
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleSubmitTestResult(machine, "washing")
//                             }
//                             disabled={
//                               !currentTestVals.washingTestResult ||
//                               submittingTestResultId ===
//                                 machine._id + "_washing" ||
//                               parentIsSubmitting
//                             }
//                             className="mt-1 px-2 py-1 bg-teal-600 text-white text-[10px] font-medium rounded hover:bg-teal-700 disabled:bg-slate-300 flex items-center justify-center"
//                           >
//                             {submittingTestResultId ===
//                             machine._id + "_washing" ? (
//                               <Loader2
//                                 size={12}
//                                 className="animate-spin mr-1"
//                               />
//                             ) : (
//                               <Send size={10} className="mr-1" />
//                             )}{" "}
//                             {t("sccDailyHTQC.submitWashingTest")}
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </section>

//       {/* Hourly Inspection Data Entry Table */}
//       <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
//         <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
//           <ListChecks size={18} className="mr-2 text-indigo-600" />{" "}
//           {t("sccDailyHTQC.inspectionDataTitle")}
//         </h2>
//         <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
//           <div className="w-full sm:w-auto sm:min-w-[150px]">
//             <label htmlFor="filterHourlyInspMO" className={labelClasses}>
//               {t("scc.moNo")}
//             </label>
//             <select
//               id="filterHourlyInspMO"
//               value={filterHourlyInspMO}
//               onChange={(e) => setFilterHourlyInspMO(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="All">
//                 {t("sccDailyHTQC.allMoNo", "All MOs")}
//               </option>
//               {uniqueMoNosForDate.map((mo) => (
//                 <option key={`hourly-filter-mo-${mo}`} value={mo}>
//                   {mo}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="w-full sm:w-auto sm:min-w-[150px]">
//             <label htmlFor="filterHourlyInspMachineNo" className={labelClasses}>
//               {t("scc.machineNo")}
//             </label>
//             <select
//               id="filterHourlyInspMachineNo"
//               value={filterHourlyInspMachineNo}
//               onChange={(e) => setFilterHourlyInspMachineNo(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="All">{t("scc.allMachines")}</option>
//               {htMachineOptions
//                 .filter((m) =>
//                   registeredMachines.some((rm) => rm.machineNo === m)
//                 )
//                 .map((m) => (
//                   <option key={`hourly-filter-mach-${m}`} value={m}>
//                     {m}
//                   </option>
//                 ))}
//             </select>
//           </div>
//           <div className="w-full sm:w-auto sm:min-w-[150px]">
//             <label htmlFor="selectedTimeSlotKey" className={labelClasses}>
//               {t("sccDailyHTQC.timeSlot")}
//             </label>
//             <select
//               id="selectedTimeSlotKey"
//               value={selectedTimeSlotKey}
//               onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
//               className={`${baseInputClasses} py-1.5`}
//             >
//               <option value="">{t("sccDailyHTQC.selectTimeSlot")}</option>
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
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.machineNo")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.operatorData")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.moNo")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("scc.color")}
//                   </th>
//                   <th className="p-2 border border-slate-300">
//                     {t("sccDailyHTQC.parameter")}
//                   </th>
//                   <th className="p-2 border border-slate-300 text-center">
//                     {t("sccDailyHTQC.reqValue")}
//                   </th>
//                   <th className="p-2 border border-slate-300 text-center">
//                     {t("sccDailyHTQC.actualValue")}
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
//                       colSpan="8"
//                       className="p-4 text-center text-slate-500 italic"
//                     >
//                       {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
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
//                       name: t("sccDailyHTQC.temperature"),
//                       field: "temp",
//                       unit: "°C",
//                       reqValue: machine.baseReqTemp,
//                       toleranceKey: "temp",
//                       icon: <Thermometer size={12} />
//                     },
//                     {
//                       name: t("sccDailyHTQC.timing"),
//                       field: "time",
//                       unit: "Sec",
//                       reqValue: machine.baseReqTime,
//                       toleranceKey: "time",
//                       icon: <Clock size={12} />
//                     },
//                     {
//                       name: t("sccDailyHTQC.pressure"),
//                       field: "pressure",
//                       unit: "Bar",
//                       reqValue: machine.baseReqPressure,
//                       toleranceKey: "pressure",
//                       icon: <Gauge size={12} />
//                     }
//                   ];
//                   return (
//                     <React.Fragment
//                       key={`${machine._id}_${selectedTimeSlotKey}_frag`}
//                     >
//                       {parameters.map((param, paramIdx) => {
//                         const actualValueForParam =
//                           currentActualsForSlot[`${param.field}_actual`];
//                         const isNAForParam =
//                           currentActualsForSlot[`${param.field}_isNA`];
//                         const cellStatus = getStatusAndBG(
//                           actualValueForParam,
//                           param.reqValue,
//                           param.toleranceKey,
//                           isNAForParam,
//                           true
//                         );
//                         const rowOverallStatus = getStatusAndBG(
//                           actualValueForParam,
//                           param.reqValue,
//                           param.toleranceKey,
//                           isNAForParam,
//                           false
//                         );
//                         return (
//                           <tr
//                             key={`${machine._id}_${selectedTimeSlotKey}_${param.field}`}
//                             className={`transition-colors text-xs ${
//                               !existingInspectionForSlot &&
//                               actualValueForParam !== undefined &&
//                               !isNAForParam
//                                 ? rowOverallStatus.bgColor.replace(
//                                     /text-(red|green|amber)-[0-9]+/,
//                                     "bg-opacity-10"
//                                   )
//                                 : "hover:bg-slate-50"
//                             }`}
//                           >
//                             {paramIdx === 0 && (
//                               <>
//                                 <td
//                                   rowSpan={parameters.length}
//                                   className="p-2 border border-slate-300 text-center align-middle font-medium text-slate-700"
//                                 >
//                                   {machine.machineNo}
//                                 </td>
//                                 <td
//                                   rowSpan={parameters.length}
//                                   className="p-1 border border-slate-300 align-middle"
//                                 >
//                                   {renderOperatorDataCell(machine.operatorData)}
//                                 </td>
//                                 <td
//                                   rowSpan={parameters.length}
//                                   className="p-2 border border-slate-300 text-center align-middle text-slate-600"
//                                 >
//                                   {machine.moNo}
//                                 </td>
//                                 <td
//                                   rowSpan={parameters.length}
//                                   className="p-2 border border-slate-300 text-center align-middle text-slate-600"
//                                 >
//                                   {machine.color}
//                                 </td>
//                               </>
//                             )}
//                             <td className="p-2 border border-slate-300 whitespace-nowrap text-slate-700 flex items-center">
//                               {React.cloneElement(param.icon, {
//                                 className: "mr-1 text-indigo-600"
//                               })}{" "}
//                               {param.name}{" "}
//                               <span className="text-slate-500 ml-0.5">
//                                 ({param.unit})
//                               </span>
//                             </td>
//                             <td className="p-2 border border-slate-300 text-center font-medium text-slate-600">
//                               {param.reqValue ?? t("scc.naCap")}
//                             </td>
//                             <td
//                               className={`p-1 border border-slate-300 text-center ${
//                                 !existingInspectionForSlot
//                                   ? cellStatus.bgColor
//                                   : ""
//                               }`}
//                             >
//                               {existingInspectionForSlot ? (
//                                 <span
//                                   className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold inline-flex items-center ${
//                                     getStatusAndBG(
//                                       existingInspectionForSlot[
//                                         `${param.field}_actual`
//                                       ],
//                                       param.reqValue,
//                                       param.toleranceKey,
//                                       existingInspectionForSlot[
//                                         `${param.field}_isNA`
//                                       ],
//                                       false
//                                     ).bgColor
//                                   }`}
//                                 >
//                                   {React.cloneElement(
//                                     getStatusAndBG(
//                                       existingInspectionForSlot[
//                                         `${param.field}_actual`
//                                       ],
//                                       param.reqValue,
//                                       param.toleranceKey,
//                                       existingInspectionForSlot[
//                                         `${param.field}_isNA`
//                                       ],
//                                       false
//                                     ).icon,
//                                     { size: 10, className: "mr-0.5" }
//                                   )}
//                                   {existingInspectionForSlot[
//                                     `${param.field}_isNA`
//                                   ]
//                                     ? t("scc.naCap")
//                                     : existingInspectionForSlot[
//                                         `${param.field}_actual`
//                                       ] ?? t("scc.naCap")}
//                                 </span>
//                               ) : (
//                                 <div className="flex items-center justify-center space-x-0.5">
//                                   {isNAForParam ? (
//                                     <span className="italic text-slate-500 px-1.5 py-0.5">
//                                       {t("scc.naCap")}
//                                     </span>
//                                   ) : (
//                                     <>
//                                       <button
//                                         type="button"
//                                         onClick={() =>
//                                           handleIncrementDecrement(
//                                             machine._id,
//                                             selectedTimeSlotKey,
//                                             param.field,
//                                             -(param.field === "pressure"
//                                               ? 0.1
//                                               : 1)
//                                           )
//                                         }
//                                         className={`${iconButtonClasses} p-1`}
//                                         title={t("scc.decrement")}
//                                       >
//                                         <Minus size={10} />
//                                       </button>
//                                       <input
//                                         type="number"
//                                         step={
//                                           param.field === "pressure"
//                                             ? "0.1"
//                                             : "1"
//                                         }
//                                         value={actualValueForParam ?? ""}
//                                         onChange={(e) =>
//                                           handleActualValueChange(
//                                             machine._id,
//                                             selectedTimeSlotKey,
//                                             param.field,
//                                             e.target.value
//                                           )
//                                         }
//                                         className="w-12 sm:w-16 text-center p-0.5 border border-slate-300 rounded text-[11px] focus:ring-indigo-500 focus:border-indigo-500"
//                                       />
//                                       <button
//                                         type="button"
//                                         onClick={() =>
//                                           handleIncrementDecrement(
//                                             machine._id,
//                                             selectedTimeSlotKey,
//                                             param.field,
//                                             param.field === "pressure" ? 0.1 : 1
//                                           )
//                                         }
//                                         className={`${iconButtonClasses} p-1`}
//                                         title={t("scc.increment")}
//                                       >
//                                         <Plus size={10} />
//                                       </button>
//                                     </>
//                                   )}
//                                   <button
//                                     type="button"
//                                     onClick={() =>
//                                       toggleActualNA(
//                                         machine._id,
//                                         selectedTimeSlotKey,
//                                         param.field
//                                       )
//                                     }
//                                     className={`${iconButtonClasses} p-1`}
//                                     title={
//                                       isNAForParam
//                                         ? t("scc.markAsApplicable")
//                                         : t("scc.markNA")
//                                     }
//                                   >
//                                     {isNAForParam ? (
//                                       <Eye
//                                         size={10}
//                                         className="text-slate-500"
//                                       />
//                                     ) : (
//                                       <EyeOff size={10} />
//                                     )}
//                                   </button>
//                                 </div>
//                               )}
//                             </td>
//                             {paramIdx === 0 && (
//                               <td
//                                 rowSpan={parameters.length}
//                                 className="p-2 border border-slate-300 text-center align-middle"
//                               >
//                                 {existingInspectionForSlot ? (
//                                   <div className="flex flex-col items-center justify-center text-green-700 ">
//                                     <Check
//                                       size={18}
//                                       className="mb-0.5 text-green-500"
//                                     />
//                                     <span className="text-[11px] font-semibold">
//                                       {t("sccDailyHTQC.submitted")}
//                                     </span>
//                                     <span className="text-[9px] text-slate-500">
//                                       (
//                                       {formatTimestampForDisplay(
//                                         existingInspectionForSlot.inspectionTimestamp
//                                       )}
//                                       )
//                                     </span>
//                                   </div>
//                                 ) : (
//                                   <button
//                                     type="button"
//                                     onClick={() =>
//                                       handleSubmitMachineSlotInspection(machine)
//                                     }
//                                     disabled={
//                                       isCurrentlySubmittingThis ||
//                                       parentIsSubmitting
//                                     }
//                                     className="w-full px-2 py-1.5 bg-blue-600 text-white text-[11px] font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-400 flex items-center justify-center"
//                                   >
//                                     {isCurrentlySubmittingThis ? (
//                                       <Loader2
//                                         size={12}
//                                         className="animate-spin mr-1"
//                                       />
//                                     ) : (
//                                       <Send size={12} className="mr-1" />
//                                     )}{" "}
//                                     {t("scc.submit")}
//                                   </button>
//                                 )}
//                               </td>
//                             )}
//                           </tr>
//                         );
//                       })}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center py-6 text-slate-500 italic">
//             {t("sccDailyHTQC.pleaseSelectTimeSlot")}
//           </div>
//         )}
//       </section>

//       {showRejectReasonModal && currentMachineForRejectReason && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050] p-4">
//           <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 {t("sccDailyHTQC.selectRejectReasons")}
//               </h3>
//               <button
//                 onClick={() => {
//                   setShowRejectReasonModal(false);
//                   setCurrentMachineForRejectReason(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border p-2 rounded-md">
//               {scratchDefectOptions.length > 0 ? (
//                 scratchDefectOptions.map((defect) => (
//                   <label
//                     key={defect._id}
//                     className="flex items-center space-x-3 p-2 hover:bg-slate-100 rounded cursor-pointer"
//                   >
//                     <input
//                       type="checkbox"
//                       className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
//                       value={defect.defectNameEng}
//                       checked={(
//                         testResultsData[currentMachineForRejectReason]
//                           ?.stretchTestRejectReasons || []
//                       ).includes(defect.defectNameEng)}
//                       onChange={(e) => {
//                         const currentReasons =
//                           testResultsData[currentMachineForRejectReason]
//                             ?.stretchTestRejectReasons || [];
//                         let newReasons;
//                         if (e.target.checked) {
//                           newReasons = [
//                             ...currentReasons,
//                             defect.defectNameEng
//                           ];
//                         } else {
//                           newReasons = currentReasons.filter(
//                             (r) => r !== defect.defectNameEng
//                           );
//                         }
//                         handleTestResultChange(
//                           currentMachineForRejectReason,
//                           "stretchTestRejectReasons",
//                           newReasons,
//                           true
//                         );
//                       }}
//                     />
//                     <span className="text-sm text-gray-700 select-none">
//                       {defect.no}. {defect.defectNameEng}{" "}
//                       <span className="text-xs text-gray-500">
//                         ({defect.defectNameKhmer})
//                       </span>
//                     </span>
//                   </label>
//                 ))
//               ) : (
//                 <p className="text-sm text-gray-500 p-2">
//                   {t("sccScratchDefects.loading", "Loading scratch defects...")}
//                 </p>
//               )}
//             </div>
//             <div className="flex justify-end space-x-3 pt-2 border-t">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowRejectReasonModal(false);
//                   setCurrentMachineForRejectReason(null);
//                 }}
//                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
//               >
//                 {t("scc.cancel")}
//               </button>
//               <button
//                 type="button"
//                 onClick={() =>
//                   handleRejectReasonSave(
//                     testResultsData[currentMachineForRejectReason]
//                       ?.stretchTestRejectReasons || []
//                   )
//                 }
//                 className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
//               >
//                 {t("common.save")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
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
  Settings2,
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
  Send,
  ClipboardCheck,
  UserCircle2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  X,
  Edit
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
        "API_BASE_URL is not valid for operator image paths, using path directly:",
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
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
    pressure: 0
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
  const [regOperatorData, setRegOperatorData] = useState(null);
  const [regOperatorLoading, setRegOperatorLoading] = useState(false);
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownContainerRef = useRef(null);

  const [registeredMachines, setRegisteredMachines] = useState([]);
  const [uniqueMoNosForDate, setUniqueMoNosForDate] = useState([]);

  const [filterHourlyInspMO, setFilterHourlyInspMO] = useState("All");
  const [filterHourlyInspMachineNo, setFilterHourlyInspMachineNo] =
    useState("All");
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [actualValues, setActualValues] = useState({});
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  const [filterTestResultMO, setFilterTestResultMO] = useState("All");
  const [filterTestResultMachineNo, setFilterTestResultMachineNo] =
    useState("All");
  const [testResultsData, setTestResultsData] = useState({}); // { [docId]: { stretchTestResult, reasons } }
  const [submittingTestResultId, setSubmittingTestResultId] = useState(null);
  const [scratchDefectOptions, setScratchDefectOptions] = useState([]);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentMachineForRejectReason, setCurrentMachineForRejectReason] =
    useState(null);
  const [tempSelectedRejectReasons, setTempSelectedRejectReasons] = useState(
    []
  );

  const htMachineOptions = useMemo(
    () => Array.from({ length: totalMachines }, (_, i) => String(i + 1)),
    [totalMachines]
  );

  useEffect(() => {
    const fetchScratchDefects = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/scratch-defects`
        );
        setScratchDefectOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching scratch defects:", error);
        Swal.fire(
          t("scc.error"),
          t(
            "sccScratchDefects.failedToFetch",
            "Failed to fetch scratch defects."
          ),
          "error"
        );
      }
    };
    fetchScratchDefects();
  }, [t]);

  useEffect(() => {
    const fetchRegOperator = async () => {
      if (!regMachineNo) {
        setRegOperatorData(null);
        return;
      }
      setRegOperatorLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/ht/${regMachineNo}`
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
      } else if (regMoNoSearch.trim().length === 0) {
        setMoDropdownOptions([]);
        setShowRegMoDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [regMoNoSearch, regMoNo]);

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
        } else {
          setIsRegLoading(false);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching MO colors:",
          error.response?.data || error.message
        );
        setRegAvailableColors([]);
        setIsRegLoading(false);
      });
  };

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
            error.response?.data || error.message
          );
          setRegReqTemp(null);
          setRegReqTime(null);
          setRegReqPressure(null);
          Swal.fire(
            t("scc.error"),
            t("sccDailyHTQC.errorFetchingSpecs"),
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
    setRegOperatorData(null);
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
    if (
      regOperatorData &&
      (!regOperatorData.emp_id || !regOperatorData.emp_reference_id)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.operatorDataIncomplete"),
        "warning"
      );
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
      operatorData: regOperatorData,
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
    const apiDate = formatDateForAPI(inspectionDate);

    axios
      .get(`${API_BASE_URL}/api/scc/daily-htfu/distinct-mos`, {
        params: { inspectionDate: apiDate }
      })
      .then((res) => setUniqueMoNosForDate(res.data || []))
      .catch((err) => {
        console.error("Error fetching distinct MOs:", err);
        setUniqueMoNosForDate([]);
      });

    axios
      .get(`${API_BASE_URL}/api/scc/daily-htfu/by-date`, {
        params: { inspectionDate: apiDate }
      })
      .then((response) => {
        setRegisteredMachines(response.data || []);
        const initialTestResults = {};
        (response.data || []).forEach((machine) => {
          initialTestResults[machine._id] = {
            stretchTestResult: machine.stretchTestResult || "",
            stretchTestRejectReasons: machine.stretchTestRejectReasons || []
            // washingTestResult: machine.washingTestResult || "" // Removed washing test from local state
          };
        });
        setTestResultsData(initialTestResults);
      })
      .catch((error) => {
        console.error("Error fetching registered machines:", error);
        setRegisteredMachines([]);
      })
      .finally(() => setIsInspectionDataLoading(false));
  }, [inspectionDate]);

  useEffect(() => {
    fetchRegisteredMachinesForDate();
  }, [fetchRegisteredMachinesForDate]);

  useEffect(() => {
    const newActuals = {};
    if (selectedTimeSlotKey && registeredMachines.length > 0) {
      registeredMachines.forEach((machine) => {
        const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
        const existingInspection = machine.inspections.find(
          (insp) => insp.timeSlotKey === selectedTimeSlotKey
        );
        if (existingInspection) {
          newActuals[docSlotKey] = {
            temp_actual: existingInspection.temp_actual,
            temp_isNA: existingInspection.temp_isNA,
            temp_isUserModified: true,
            time_actual: existingInspection.time_actual,
            time_isNA: existingInspection.time_isNA,
            time_isUserModified: true,
            pressure_actual: existingInspection.pressure_actual,
            pressure_isNA: existingInspection.pressure_isNA,
            pressure_isUserModified: true
          };
        } else {
          if (
            !actualValues[docSlotKey] ||
            !actualValues[docSlotKey].temp_isUserModified
          ) {
            newActuals[docSlotKey] = {
              temp_actual: null,
              temp_isNA: false,
              temp_isUserModified: false,
              time_actual: null,
              time_isNA: false,
              time_isUserModified: false,
              pressure_actual: null,
              pressure_isNA: false,
              pressure_isUserModified: false
            };
          } else {
            newActuals[docSlotKey] = actualValues[docSlotKey];
          }
        }
      });
      if (JSON.stringify(newActuals) !== JSON.stringify(actualValues)) {
        setActualValues(newActuals);
      }
    } else if (!selectedTimeSlotKey && Object.keys(actualValues).length > 0) {
      setActualValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlotKey, registeredMachines]);

  const handleActualValueChange = (docId, timeSlotKey, paramField, value) => {
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;
    setActualValues((prev) => {
      const currentSlotData = prev[key] || {
        temp_isNA: false,
        time_isNA: false,
        pressure_isNA: false,
        temp_isUserModified: false,
        time_isUserModified: false,
        pressure_isUserModified: false
      };
      return {
        ...prev,
        [key]: {
          ...currentSlotData,
          [actualFieldKey]: value === "" ? null : Number(value),
          [userModifiedFlagKey]: true
        }
      };
    });
  };

  const toggleActualNA = (docId, timeSlotKey, paramField) => {
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const isNAFlagKey = `${paramField}_isNA`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {
        temp_isNA: false,
        time_isNA: false,
        pressure_isNA: false,
        temp_isUserModified: false,
        time_isUserModified: false,
        pressure_isUserModified: false
      };
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
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const userModifiedFlagKey = `${paramField}_isUserModified`;
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {
        temp_isNA: false,
        time_isNA: false,
        pressure_isNA: false,
        temp_isUserModified: false,
        time_isUserModified: false,
        pressure_isUserModified: false
      };
      let currentActualNum = Number(currentSlotActuals[actualFieldKey]);
      if (isNaN(currentActualNum)) {
        const machineDoc = registeredMachines.find((m) => m._id === docId);
        currentActualNum =
          (paramField === "temp"
            ? machineDoc?.baseReqTemp
            : paramField === "time"
            ? machineDoc?.baseReqTime
            : machineDoc?.baseReqPressure) || 0;
      }
      let newValue = currentActualNum + increment;
      if (paramField === "pressure") newValue = parseFloat(newValue.toFixed(1));
      else newValue = Math.max(0, newValue);
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

  const getFilteredTableData = (baseData, filterMO, filterMachine) => {
    let filtered = baseData;
    if (filterMO !== "All") {
      filtered = filtered.filter((m) => m.moNo === filterMO);
    }
    if (filterMachine !== "All") {
      filtered = filtered.filter((m) => m.machineNo === filterMachine);
    }
    return filtered.sort((a, b) => {
      const moComp = a.moNo.localeCompare(b.moNo);
      if (moComp !== 0) return moComp;
      const numA = parseInt(a.machineNo, 10);
      const numB = parseInt(b.machineNo, 10);
      return !isNaN(numA) && !isNaN(numB)
        ? numA - numB
        : a.machineNo.localeCompare(b.machineNo);
    });
  };

  const inspectionTableDisplayData = useMemo(
    () =>
      getFilteredTableData(
        registeredMachines,
        filterHourlyInspMO,
        filterHourlyInspMachineNo
      ),
    [registeredMachines, filterHourlyInspMO, filterHourlyInspMachineNo]
  );

  const testResultsTableDisplayData = useMemo(
    () =>
      getFilteredTableData(
        registeredMachines,
        filterTestResultMO,
        filterTestResultMachineNo
      ),
    [registeredMachines, filterTestResultMO, filterTestResultMachineNo]
  );

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
    const tempActualToSubmit = currentActuals.temp_isNA
      ? null
      : currentActuals.temp_actual ?? null;
    const timeActualToSubmit = currentActuals.time_isNA
      ? null
      : currentActuals.time_actual ?? null;
    const pressureActualToSubmit = currentActuals.pressure_isNA
      ? null
      : currentActuals.pressure_actual ?? null;

    if (
      (!currentActuals.temp_isNA && tempActualToSubmit === null) ||
      (!currentActuals.time_isNA && timeActualToSubmit === null) ||
      (!currentActuals.pressure_isNA && pressureActualToSubmit === null)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.fillAllActualsOrNA"),
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
    if (success) fetchRegisteredMachinesForDate();
  };

  const handleTestResultChange = (
    docId,
    field,
    valueOrReasons,
    isReasons = false
  ) => {
    setTestResultsData((prev) => {
      const newDocData = {
        ...(prev[docId] || {
          stretchTestResult: "",
          stretchTestRejectReasons: []
        })
      }; // Removed washingTestResult
      if (isReasons) {
        newDocData.stretchTestRejectReasons = valueOrReasons;
      } else {
        newDocData[field] = valueOrReasons;
      }
      if (field === "stretchTestResult" && valueOrReasons === "Pass") {
        newDocData.stretchTestRejectReasons = [];
      }
      return { ...prev, [docId]: newDocData };
    });
  };

  const openRejectReasonModal = (machineId) => {
    const currentDocTestResults = testResultsData[machineId];
    setTempSelectedRejectReasons(
      currentDocTestResults?.stretchTestRejectReasons || []
    );
    setCurrentMachineForRejectReason(machineId);
    setShowRejectReasonModal(true);
  };

  const handleRejectReasonModalCheckboxChange = (defectNameEng) => {
    setTempSelectedRejectReasons((prev) =>
      prev.includes(defectNameEng)
        ? prev.filter((r) => r !== defectNameEng)
        : [...prev, defectNameEng]
    );
  };

  const handleRejectReasonSave = () => {
    if (currentMachineForRejectReason) {
      handleTestResultChange(
        currentMachineForRejectReason,
        "stretchTestRejectReasons",
        tempSelectedRejectReasons,
        true
      );
    }
    setShowRejectReasonModal(false);
    setCurrentMachineForRejectReason(null);
    setTempSelectedRejectReasons([]);
  };

  const handleSubmitTestResult = async (machineDoc) => {
    // Removed testTypeToSubmit, only stretch/scratch now
    const docId = machineDoc._id;
    const currentTestValues = testResultsData[docId];
    if (!currentTestValues) return;
    let payload = { dailyTestingDocId: docId, emp_id: user.emp_id };
    let successMessage = "";

    // Only handling stretch test
    if (!currentTestValues.stretchTestResult) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.selectStretchResult"),
        "warning"
      );
      return;
    }
    if (
      currentTestValues.stretchTestResult === "Reject" &&
      (!currentTestValues.stretchTestRejectReasons ||
        currentTestValues.stretchTestRejectReasons.length === 0)
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyHTQC.validation.selectStretchRejectReason"),
        "warning"
      );
      return;
    }

    payload.stretchTestResult = currentTestValues.stretchTestResult;
    payload.stretchTestRejectReasons =
      currentTestValues.stretchTestResult === "Reject"
        ? currentTestValues.stretchTestRejectReasons
        : [];
    // Washing test result needs to be preserved if it was already set, or sent as null/pending if not touched
    payload.washingTestResult = machineDoc.washingTestResult || "Pending"; // Send existing or Pending

    successMessage = t("sccDailyHTQC.stretchTestSubmittedSuccess");

    setSubmittingTestResultId(docId + "_stretch"); // Only one type of submit now per row effectively
    const success = await onFormSubmit("updateDailyHTFUTestResult", payload);
    setSubmittingTestResultId(null);
    if (success) {
      Swal.fire(t("scc.success"), successMessage, "success");
      fetchRegisteredMachinesForDate();
    }
  };

  const getStatusAndBG = useCallback(
    (actual, req, toleranceKey, isNA, forCellBackground = false) => {
      const currentTolerance = tolerances[toleranceKey];
      if (isNA)
        return {
          statusText: "N/A",
          bgColor: forCellBackground
            ? "bg-slate-100"
            : "bg-slate-200 text-slate-600",
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
      let diff = numActual - numReq;
      if (
        toleranceKey === "pressure" ||
        (typeof req === "number" && req.toString().includes("."))
      ) {
        diff = parseFloat(diff.toFixed(1));
      } else {
        diff = Math.round(diff);
      }
      if (Math.abs(diff) <= currentTolerance)
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
    },
    [t, tolerances]
  );

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
      if (
        machineNoDropdownRef.current &&
        !machineNoDropdownRef.current.contains(event.target) &&
        machineNoInputRef.current &&
        !machineNoInputRef.current.contains(event.target)
      ) {
        setShowMachineNoDropdown(false);
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
    !!submittingMachineSlot ||
    !!submittingTestResultId ||
    regOperatorLoading;

  const renderOperatorDataCell = (operatorData, context = "table") => {
    // Added context
    if (context === "registration" && regOperatorLoading && !operatorData)
      return (
        <Loader2 size={16} className="animate-spin mx-auto text-indigo-500" />
      );
    if (!operatorData || !operatorData.emp_id) {
      return (
        <span className="text-xs text-slate-400 italic px-1">
          {t("scc.naCap")}
        </span>
      );
    }
    const imageUrl = operatorData.emp_face_photo
      ? getFacePhotoUrl(operatorData.emp_face_photo)
      : null;
    return (
      <div className="flex flex-col items-center justify-center text-center p-0.5 min-w-[90px] max-w-[120px] mx-auto">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={operatorData.emp_eng_name || "Operator"}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 mb-0.5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <UserCircle2 className="w-8 h-8 text-slate-300 mb-0.5" />
        )}
        <span
          className="text-[10px] font-medium text-slate-700 truncate block w-full"
          title={operatorData.emp_id}
        >
          {operatorData.emp_id}
        </span>
        <span
          className="text-[9px] text-slate-500 truncate block w-full"
          title={operatorData.emp_eng_name}
        >
          {operatorData.emp_eng_name || t("scc.naCap")}
        </span>
      </div>
    );
  };

  const renderSpecsCell = (machine) => {
    return (
      <div className="text-[10px] p-1 space-y-0.5 min-w-[100px] text-left">
        <div className="flex items-center">
          <Thermometer size={10} className="mr-1 text-red-500 flex-shrink-0" />{" "}
          {t("sccDailyHTQC.tempShort")}: {machine.baseReqTemp ?? t("scc.naCap")}
          °C
        </div>
        <div className="flex items-center">
          <Clock size={10} className="mr-1 text-blue-500 flex-shrink-0" />{" "}
          {t("sccDailyHTQC.timeShort")}: {machine.baseReqTime ?? t("scc.naCap")}
          s
        </div>
        <div className="flex items-center">
          <Gauge size={10} className="mr-1 text-green-500 flex-shrink-0" />{" "}
          {t("sccDailyHTQC.pressureShort")}:{" "}
          {machine.baseReqPressure ?? t("scc.naCap")}Bar
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
      {overallIsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
          <Loader2 className="animate-spin h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
        </div>
      )}
      <header className="text-center mb-6">
        <h1 className="text-sm md:text-xl font-bold text-slate-800">
          {t("sccDailyHTQC.mainTitle")}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("sccDailyHTQC.mainSubtitle")}
        </p>
      </header>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-slate-700">
            <Settings2 size={18} className="mr-2 text-indigo-600" />
            <h2 className="text-md md:text-lg font-semibold">
              {t("sccDailyHTQC.settingsTitle")}
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
            {settingsEnabled ? <Power size={16} /> : <PowerOff size={16} />}{" "}
            <span className="ml-1.5 text-xs md:text-sm font-medium">
              {settingsEnabled ? t("scc.onUpper") : t("scc.offUpper")}
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4 items-end">
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
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
          <div>
            <label htmlFor="tempTolerance" className={labelClasses}>
              <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
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
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
          <div>
            <label htmlFor="timeTolerance" className={labelClasses}>
              <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
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
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
          <div>
            <label htmlFor="pressureTolerance" className={labelClasses}>
              <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
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
              className={`${baseInputClasses} py-1.5`}
            />
          </div>
        </div>
      </section>

      <div className="max-w-xs mx-auto my-4 md:my-5">
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
            className={`${baseInputClasses} py-1.5 text-center`}
            id="htqcInspectionDate"
            popperPlacement="bottom"
            wrapperClassName="w-full"
          />
          <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <BookUser size={18} className="mr-2 text-indigo-600" />{" "}
          {t("sccDailyHTQC.registerMachineTitle")}
        </h2>
        <div className="overflow-x-auto pretty-scrollbar">
          <table
            className="w-full text-xs sm:text-sm whitespace-nowrap"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600 font-semibold">
                <th className="p-2 border-r">{t("scc.machineNo")}</th>
                <th className="p-2 border-r">{t("scc.moNo")}</th>
                <th className="p-2 border-r">
                  {t("sccDailyHTQC.orderDetails")}
                </th>
                <th className="p-2 border-r">{t("scc.color")}</th>
                <th className="p-2 border-r text-center">
                  {t("scc.operatorData")}
                </th>
                <th className="p-2 border-r text-center">
                  {t("sccDailyHTQC.specs")}
                </th>
                <th className="p-2 text-center">{t("scc.action")}</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="p-1.5 border-r">
                  <select
                    value={regMachineNo}
                    onChange={(e) => setRegMachineNo(e.target.value)}
                    className={`${baseInputClasses} py-1.5`}
                  >
                    <option value="">{t("scc.select")}</option>
                    {htMachineOptions.map((m) => (
                      <option key={`reg-mach-${m}`} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className="p-1.5 border-r relative"
                  ref={regMoDropdownContainerRef}
                >
                  <div className="relative z-[50]">
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
                      <ul className="absolute z-50 mt-1 w-max min-w-[200px] bg-white shadow-2xl max-h-52 md:max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-y-auto top-full left-0">
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
                <td className="p-1.5 border-r text-[11px] break-words">
                  <div>
                    {t("scc.buyer")}:{" "}
                    <span className="font-medium">
                      {regBuyer || t("scc.naCap")}
                    </span>
                  </div>
                  <div>
                    {t("scc.buyerStyle")}:{" "}
                    <span className="font-medium">
                      {regBuyerStyle || t("scc.naCap")}
                    </span>
                  </div>
                </td>
                <td className="p-1.5 border-r">
                  <select
                    value={regColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className={`${baseInputClasses} py-1.5`}
                    disabled={regAvailableColors.length === 0}
                  >
                    <option value="">{t("scc.selectColor")}</option>
                    {regAvailableColors.map((c) => (
                      <option key={`reg-col-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-0 border-r text-center">
                  {renderOperatorDataCell(regOperatorData, "registration")}
                </td>
                <td className="p-0 border-r text-center">
                  {isRegLoading &&
                  !regReqTemp &&
                  !regReqTime &&
                  !regReqPressure &&
                  regMoNoSearch &&
                  regColor ? (
                    <Loader2
                      size={16}
                      className="animate-spin mx-auto text-indigo-500"
                    />
                  ) : (
                    renderSpecsCell({
                      baseReqTemp: regReqTemp,
                      baseReqTime: regReqTime,
                      baseReqPressure: regReqPressure
                    })
                  )}
                </td>
                <td className="p-1.5 text-center">
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
                    {t("sccDailyHTQC.register")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center">
          <ClipboardCheck size={16} className="mr-2 text-purple-600" />{" "}
          {t("sccDailyHTQC.testResultsTitleStretchScratchOnly")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="filterTestResultMO" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <select
              id="filterTestResultMO"
              value={filterTestResultMO}
              onChange={(e) => setFilterTestResultMO(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("sccDailyHTQC.allMoNo")}</option>
              {uniqueMoNosForDate.map((mo) => (
                <option key={`filter-mo-test-${mo}`} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="filterTestResultMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="filterTestResultMachineNo"
              value={filterTestResultMachineNo}
              onChange={(e) => setFilterTestResultMachineNo(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("scc.allMachines")}</option>
              {htMachineOptions
                .filter((m) =>
                  registeredMachines.some((rm) => rm.machineNo === m)
                )
                .map((m) => (
                  <option key={`test-filter-mach-${m}`} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto pretty-scrollbar">
          <table className="min-w-full text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-200 text-slate-700">
              <tr>
                <th className="p-2 border border-slate-300">
                  {t("scc.machineNo")}
                </th>
                <th className="p-2 border border-slate-300">
                  {t("scc.operatorData")}
                </th>
                <th className="p-2 border border-slate-300">{t("scc.moNo")}</th>
                <th className="p-2 border border-slate-300">
                  {t("scc.color")}
                </th>
                <th className="p-2 border border-slate-300">
                  {t("sccDailyHTQC.stretchScratchTest")}
                </th>
                {/* Washing Test Column Removed */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {testResultsTableDisplayData.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-4 text-center text-slate-500 italic"
                  >
                    {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
                  </td>
                </tr>
              ) : (
                testResultsTableDisplayData.map((machine) => {
                  const currentTestVals = testResultsData[machine._id] || {
                    stretchTestResult: machine.stretchTestResult || "",
                    stretchTestRejectReasons:
                      machine.stretchTestRejectReasons || []
                  };
                  const isStretchSubmitted =
                    machine.stretchTestResult &&
                    machine.stretchTestResult !== "Pending";
                  const stretchCellClass = isStretchSubmitted
                    ? machine.stretchTestResult === "Pass"
                      ? "bg-green-100"
                      : "bg-red-100"
                    : currentTestVals.stretchTestResult === "Pass"
                    ? "bg-green-50"
                    : currentTestVals.stretchTestResult === "Reject"
                    ? "bg-red-50"
                    : "";

                  return (
                    <tr
                      key={`test-${machine._id}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="p-2 border border-slate-300 text-center align-middle font-medium">
                        {machine.machineNo}
                      </td>
                      <td className="p-1 border border-slate-300 align-middle">
                        {renderOperatorDataCell(machine.operatorData)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {machine.moNo}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {machine.color}
                      </td>
                      <td
                        className={`p-2 border border-slate-300 align-top ${stretchCellClass}`}
                      >
                        <div className="flex flex-col space-y-1">
                          <select
                            value={currentTestVals.stretchTestResult}
                            onChange={(e) =>
                              handleTestResultChange(
                                machine._id,
                                "stretchTestResult",
                                e.target.value
                              )
                            }
                            className={`${baseInputClasses} py-1 text-xs`}
                            disabled={
                              isStretchSubmitted ||
                              submittingTestResultId ===
                                machine._id + "_stretch"
                            }
                          >
                            <option value="">{t("scc.selectStatus")}</option>
                            <option value="Pass">{t("scc.pass")}</option>
                            <option value="Reject">{t("scc.reject")}</option>
                          </select>
                          {currentTestVals.stretchTestResult === "Reject" &&
                            !isStretchSubmitted && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRejectReasonModal(machine._id)
                                  }
                                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline flex items-center"
                                >
                                  <PlusCircle size={12} className="mr-1" />{" "}
                                  {t("sccDailyHTQC.selectIssues")} (
                                  {currentTestVals.stretchTestRejectReasons
                                    ?.length || 0}
                                  )
                                </button>
                                {currentTestVals.stretchTestRejectReasons &&
                                  currentTestVals.stretchTestRejectReasons
                                    .length > 0 && (
                                    <div className="mt-1 text-[10px] text-slate-600 p-1 bg-slate-100 rounded max-h-16 overflow-y-auto">
                                      {currentTestVals.stretchTestRejectReasons.join(
                                        ", "
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}
                          {isStretchSubmitted && (
                            <div
                              className={`text-xs mt-1 p-1 rounded ${
                                machine.stretchTestResult === "Pass"
                                  ? "text-green-800 bg-green-200"
                                  : "text-red-800 bg-red-200"
                              }`}
                            >
                              {t("sccDailyHTQC.resultSubmitted")}:{" "}
                              {t(
                                `scc.${machine.stretchTestResult.toLowerCase()}`
                              )}
                              {machine.stretchTestResult === "Reject" &&
                                machine.stretchTestRejectReasons?.length >
                                  0 && (
                                  <div className="text-slate-600 text-[10px] mt-0.5">
                                    ({t("sccDailyHTQC.reasons")}:{" "}
                                    {machine.stretchTestRejectReasons.join(
                                      ", "
                                    )}
                                    )
                                  </div>
                                )}
                            </div>
                          )}
                          {!isStretchSubmitted && (
                            <button
                              type="button"
                              onClick={() => handleSubmitTestResult(machine)}
                              disabled={
                                !currentTestVals.stretchTestResult ||
                                submittingTestResultId ===
                                  machine._id + "_stretch" ||
                                parentIsSubmitting
                              }
                              className="mt-1 px-2 py-1 bg-sky-600 text-white text-[10px] font-medium rounded hover:bg-sky-700 disabled:bg-slate-300 flex items-center justify-center"
                            >
                              {submittingTestResultId ===
                              machine._id + "_stretch" ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin mr-1"
                                />
                              ) : (
                                <Send size={10} className="mr-1" />
                              )}{" "}
                              {t("sccDailyHTQC.submitStretchTest")}
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Washing Test Column Removed */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <ListChecks size={18} className="mr-2 text-indigo-600" />{" "}
          {t("sccDailyHTQC.inspectionDataTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="filterHourlyInspMO" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <select
              id="filterHourlyInspMO"
              value={filterHourlyInspMO}
              onChange={(e) => setFilterHourlyInspMO(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("sccDailyHTQC.allMoNo")}</option>
              {uniqueMoNosForDate.map((mo) => (
                <option key={`hourly-filter-mo-${mo}`} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="filterHourlyInspMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="filterHourlyInspMachineNo"
              value={filterHourlyInspMachineNo}
              onChange={(e) => setFilterHourlyInspMachineNo(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("scc.allMachines")}</option>
              {htMachineOptions
                .filter((m) =>
                  registeredMachines.some((rm) => rm.machineNo === m)
                )
                .map((m) => (
                  <option key={`hourly-filter-mach-${m}`} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="selectedTimeSlotKey" className={labelClasses}>
              {t("sccDailyHTQC.timeSlot")}
            </label>
            <select
              id="selectedTimeSlotKey"
              value={selectedTimeSlotKey}
              onChange={(e) => setSelectedTimeSlotKey(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
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
                  <th className="p-2 border border-slate-300">
                    {t("scc.machineNo")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.operatorData")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.moNo")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.color")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccDailyHTQC.parameter")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyHTQC.reqValue")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyHTQC.actualValue")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("scc.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspectionTableDisplayData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
                    </td>
                  </tr>
                ) : (
                  inspectionTableDisplayData.map((machine) => {
                    const existingInspectionForSlot = machine.inspections.find(
                      (insp) => insp.timeSlotKey === selectedTimeSlotKey
                    );
                    const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
                    const currentActualsForSlot =
                      actualValues[docSlotKey] || {};
                    const isCurrentlySubmittingThis =
                      submittingMachineSlot === docSlotKey;
                    const parameters = [
                      {
                        name: t("sccDailyHTQC.temperature"),
                        field: "temp",
                        unit: "°C",
                        reqValue: machine.baseReqTemp,
                        toleranceKey: "temp",
                        icon: <Thermometer size={12} />
                      },
                      {
                        name: t("sccDailyHTQC.timing"),
                        field: "time",
                        unit: "Sec",
                        reqValue: machine.baseReqTime,
                        toleranceKey: "time",
                        icon: <Clock size={12} />
                      },
                      {
                        name: t("sccDailyHTQC.pressure"),
                        field: "pressure",
                        unit: "Bar",
                        reqValue: machine.baseReqPressure,
                        toleranceKey: "pressure",
                        icon: <Gauge size={12} />
                      }
                    ];
                    return (
                      <React.Fragment
                        key={`${machine._id}_${selectedTimeSlotKey}_frag`}
                      >
                        {parameters.map((param, paramIdx) => {
                          const actualValueForParam =
                            currentActualsForSlot[`${param.field}_actual`];
                          const isNAForParam =
                            currentActualsForSlot[`${param.field}_isNA`];
                          const cellStatus = getStatusAndBG(
                            actualValueForParam,
                            param.reqValue,
                            param.toleranceKey,
                            isNAForParam,
                            true
                          );
                          const rowOverallStatus = getStatusAndBG(
                            actualValueForParam,
                            param.reqValue,
                            param.toleranceKey,
                            isNAForParam,
                            false
                          );
                          return (
                            <tr
                              key={`${machine._id}_${selectedTimeSlotKey}_${param.field}`}
                              className={`transition-colors text-xs ${
                                !existingInspectionForSlot &&
                                actualValueForParam !== undefined &&
                                actualValueForParam !== null &&
                                !isNAForParam
                                  ? rowOverallStatus.bgColor.replace(
                                      /text-(red|green|amber)-[0-9]+/,
                                      "bg-opacity-10"
                                    )
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              {paramIdx === 0 && (
                                <>
                                  <td
                                    rowSpan={parameters.length}
                                    className="p-2 border border-slate-300 text-center align-middle font-medium text-slate-700"
                                  >
                                    {machine.machineNo}
                                  </td>
                                  <td
                                    rowSpan={parameters.length}
                                    className="p-1 border border-slate-300 align-middle"
                                  >
                                    {renderOperatorDataCell(
                                      machine.operatorData
                                    )}
                                  </td>
                                  <td
                                    rowSpan={parameters.length}
                                    className="p-2 border border-slate-300 text-center align-middle text-slate-600"
                                  >
                                    {machine.moNo}
                                  </td>
                                  <td
                                    rowSpan={parameters.length}
                                    className="p-2 border border-slate-300 text-center align-middle text-slate-600"
                                  >
                                    {machine.color}
                                  </td>
                                </>
                              )}
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
                                  !existingInspectionForSlot
                                    ? cellStatus.bgColor
                                    : ""
                                }`}
                              >
                                {existingInspectionForSlot ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold inline-flex items-center ${
                                      getStatusAndBG(
                                        existingInspectionForSlot[
                                          `${param.field}_actual`
                                        ],
                                        param.reqValue,
                                        param.toleranceKey,
                                        existingInspectionForSlot[
                                          `${param.field}_isNA`
                                        ],
                                        false
                                      ).bgColor
                                    }`}
                                  >
                                    {React.cloneElement(
                                      getStatusAndBG(
                                        existingInspectionForSlot[
                                          `${param.field}_actual`
                                        ],
                                        param.reqValue,
                                        param.toleranceKey,
                                        existingInspectionForSlot[
                                          `${param.field}_isNA`
                                        ],
                                        false
                                      ).icon,
                                      { size: 10, className: "mr-0.5" }
                                    )}
                                    {existingInspectionForSlot[
                                      `${param.field}_isNA`
                                    ]
                                      ? t("scc.naCap")
                                      : existingInspectionForSlot[
                                          `${param.field}_actual`
                                        ] ?? t("scc.naCap")}
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
                                              -(param.field === "pressure"
                                                ? 0.1
                                                : 1)
                                            )
                                          }
                                          className={`${iconButtonClasses} p-1`}
                                          title={t("scc.decrement")}
                                        >
                                          <Minus size={10} />
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
                                          className="w-12 sm:w-16 text-center p-0.5 border border-slate-300 rounded text-[11px] focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleIncrementDecrement(
                                              machine._id,
                                              selectedTimeSlotKey,
                                              param.field,
                                              param.field === "pressure"
                                                ? 0.1
                                                : 1
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
                                        <Eye
                                          size={10}
                                          className="text-slate-500"
                                        />
                                      ) : (
                                        <EyeOff size={10} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </td>
                              {paramIdx === 0 && (
                                <td
                                  rowSpan={parameters.length}
                                  className="p-2 border border-slate-300 text-center align-middle"
                                >
                                  {existingInspectionForSlot ? (
                                    <div className="flex flex-col items-center justify-center text-green-700 ">
                                      <Check
                                        size={18}
                                        className="mb-0.5 text-green-500"
                                      />
                                      <span className="text-[11px] font-semibold">
                                        {t("sccDailyHTQC.submitted")}
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
                                        handleSubmitMachineSlotInspection(
                                          machine
                                        )
                                      }
                                      disabled={
                                        isCurrentlySubmittingThis ||
                                        parentIsSubmitting
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
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 italic">
            {t("sccDailyHTQC.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>

      {showRejectReasonModal && currentMachineForRejectReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1050] p-4">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {t("sccDailyHTQC.selectRejectReasons")}
              </h3>
              <button
                onClick={() => {
                  setShowRejectReasonModal(false);
                  setCurrentMachineForRejectReason(null);
                  setTempSelectedRejectReasons([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 border p-2 rounded-md">
              {scratchDefectOptions.length > 0 ? (
                scratchDefectOptions.map((defect) => (
                  <label
                    key={defect._id}
                    className="flex items-center space-x-3 p-2 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      value={defect.defectNameEng} // Storing English name as the reason
                      checked={tempSelectedRejectReasons.includes(
                        defect.defectNameEng
                      )}
                      onChange={() =>
                        handleRejectReasonModalCheckboxChange(
                          defect.defectNameEng
                        )
                      }
                    />
                    <span className="text-sm text-gray-700 select-none">
                      {defect.no}. {defect.defectNameEng}{" "}
                      <span className="text-xs text-gray-500">
                        ({defect.defectNameKhmer})
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">
                  {t("sccScratchDefects.loading")}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowRejectReasonModal(false);
                  setCurrentMachineForRejectReason(null);
                  setTempSelectedRejectReasons([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
              >
                {t("scc.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRejectReasonSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyHTQC;
