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
  ClipboardCheck // New icon for Test Results
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

// Stretch/Scratch Test Reject Reasons
const STRETCH_REJECT_REASONS = ["NA1", "NA2", "NA3", "NA4", "NA5"];

const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  // Format to MM/DD/YYYY for consistency with existing API
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
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownContainerRef = useRef(null);

  const [registeredMachines, setRegisteredMachines] = useState([]);
  const [filterMachineNo, setFilterMachineNo] = useState("All"); // For parameter inspection table
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [actualValues, setActualValues] = useState({});
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  // ** NEW STATES FOR TEST RESULTS SECTION **
  const [filterTestResultMachineNo, setFilterTestResultMachineNo] =
    useState("All"); // For Test Results table
  const [testResultsData, setTestResultsData] = useState({}); // { [docId]: { stretchTestResult: 'Pass', stretchTestRejectReasons: [], washingTestResult: 'Pending' } }
  const [submittingTestResultId, setSubmittingTestResultId] = useState(null); // To show loader on specific submit button

  const machineOptions = useMemo(
    () => Array.from({ length: totalMachines }, (_, i) => String(i + 1)),
    [totalMachines]
  );

  // Effect to initialize or update actualValues when slot or machines change
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
          // If existing inspection data is different from current local state, update local state
          if (
            !newActuals[docSlotKey] ||
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
              temp_isUserModified: true,
              time_isUserModified: true,
              pressure_isUserModified: true
            };
            changed = true;
          }
        } else if (
          !newActuals[docSlotKey] ||
          !newActuals[docSlotKey].temp_isUserModified
        ) {
          // Check if not already user-modified default
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
          changed = true;
        }
      });
      if (changed) setActualValues(newActuals);
    } else if (!selectedTimeSlotKey && Object.keys(actualValues).length > 0) {
      setActualValues({}); // Clear actuals if no slot is selected
    }
  }, [selectedTimeSlotKey, registeredMachines, actualValues]); // actualValues added to re-evaluate defaults correctly

  // Effect to initialize testResultsData when registeredMachines change
  useEffect(() => {
    const newTestResultsData = {};
    registeredMachines.forEach((machine) => {
      newTestResultsData[machine._id] = {
        stretchTestResult: machine.stretchTestResult || "", // Default to empty string for dropdown
        stretchTestRejectReasons: machine.stretchTestRejectReasons || [],
        washingTestResult: machine.washingTestResult || "" // Default to empty string
      };
    });
    setTestResultsData(newTestResultsData);
  }, [registeredMachines]);

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
      .then((response) => {
        setRegisteredMachines(response.data || []);
        // Initialize testResultsData based on fetched machines
        const initialTestResults = {};
        (response.data || []).forEach((machine) => {
          initialTestResults[machine._id] = {
            stretchTestResult: machine.stretchTestResult || "",
            stretchTestRejectReasons: machine.stretchTestRejectReasons || [],
            washingTestResult: machine.washingTestResult || ""
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
      if (isNaN(currentActualNum))
        currentActualNum =
          paramField === "pressure" && increment < 0
            ? currentSlotActuals.baseReqPressure || 0
            : 0; // Default to req or 0

      let newValue = currentActualNum + increment;
      if (paramField === "pressure") newValue = parseFloat(newValue.toFixed(1));
      else newValue = Math.max(0, newValue); // Ensure temp/time don't go below 0

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

  // ** NEW: Data for Test Results Table **
  const testResultsTableDisplayData = useMemo(() => {
    let filtered = registeredMachines;
    if (filterTestResultMachineNo !== "All") {
      filtered = registeredMachines.filter(
        (m) => m.machineNo === filterTestResultMachineNo
      );
    }
    return filtered.sort((a, b) => {
      const numA = parseInt(a.machineNo, 10);
      const numB = parseInt(b.machineNo, 10);
      return !isNaN(numA) && !isNaN(numB)
        ? numA - numB
        : a.machineNo.localeCompare(b.machineNo);
    });
  }, [registeredMachines, filterTestResultMachineNo]);

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

  // ** NEW: Handler for Test Result Input Change **
  const handleTestResultChange = (docId, field, value) => {
    setTestResultsData((prev) => {
      const newDocData = { ...(prev[docId] || {}) };
      newDocData[field] = value;
      // If stretch test is 'Pass', clear reject reasons
      if (field === "stretchTestResult" && value === "Pass") {
        newDocData.stretchTestRejectReasons = [];
      }
      return { ...prev, [docId]: newDocData };
    });
  };

  const handleStretchRejectReasonChange = (docId, reasons) => {
    setTestResultsData((prev) => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        stretchTestRejectReasons: reasons
      }
    }));
  };

  // ** NEW: Handler for Submitting Test Results **
  const handleSubmitTestResult = async (machineDoc, testTypeToSubmit) => {
    const docId = machineDoc._id;
    const currentTestValues = testResultsData[docId];
    if (!currentTestValues) return;

    let payload = { dailyTestingDocId: docId, emp_id: user.emp_id };
    let successMessage = "";

    if (testTypeToSubmit === "stretch") {
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
      successMessage = t("sccDailyHTQC.stretchTestSubmittedSuccess");
    } else if (testTypeToSubmit === "washing") {
      if (!currentTestValues.washingTestResult) {
        Swal.fire(
          t("scc.validationErrorTitle"),
          t("sccDailyHTQC.validation.selectWashingResult"),
          "warning"
        );
        return;
      }
      payload.washingTestResult = currentTestValues.washingTestResult;
      successMessage = t("sccDailyHTQC.washingTestSubmittedSuccess");
    } else {
      return; // Unknown test type
    }

    setSubmittingTestResultId(docId + "_" + testTypeToSubmit); // Mark this specific test as submitting
    // The onFormSubmit prop is expected to be provided by SCCPage.jsx
    // We need a new formType for this in SCCPage.jsx, e.g., "updateDailyHTFUTestResult"
    const success = await onFormSubmit("updateDailyHTFUTestResult", payload);
    setSubmittingTestResultId(null);
    if (success) {
      Swal.fire(t("scc.success"), successMessage, "success");
      fetchRegisteredMachinesForDate(); // Refresh to show updated status
    }
  };

  const getStatusAndBG = useCallback(
    (actual, req, toleranceKey, isNA, forCellBackground = false) => {
      const currentTolerance = tolerances[toleranceKey];
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
    !!submittingTestResultId;

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
            {settingsEnabled ? <Power size={16} /> : <PowerOff size={16} />}
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
              {t("sccDailyHTQC.tempTolerance", "Temp. Tolerance (°C)")}
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
              {t("sccDailyHTQC.timeTolerance", "Time Tolerance (Sec)")}
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
              {t("sccDailyHTQC.pressureTolerance", "Pressure Tolerance (Bar)")}
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
          <BookUser size={18} className="mr-2 text-indigo-600" />
          {t("sccDailyHTQC.registerMachineTitle")}
        </h2>
        <div className="relative">
          <div>
            <table
              className="w-full text-xs sm:text-sm"
              style={{ tableLayout: "auto" }}
            >
              <thead className="bg-slate-100">
                <tr className="text-left text-slate-600 font-semibold">
                  <th className="p-2">{t("scc.machineNo")}</th>
                  <th className="p-2">{t("scc.moNo")}</th>
                  <th className="p-2">{t("scc.buyer")}</th>
                  <th className="p-2">{t("scc.buyerStyle")}</th>
                  <th className="p-2">{t("scc.color")}</th>
                  <th className="p-2 text-center">
                    {t("sccDailyHTQC.reqTempShort")}
                  </th>
                  <th className="p-2 text-center">
                    {t("sccDailyHTQC.reqTimeShort")}
                  </th>
                  <th className="p-2 text-center">
                    {t("sccDailyHTQC.reqPressureShort")}
                  </th>
                  <th className="p-2 text-center">{t("scc.action")}</th>
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
                    className="p-1.5 whitespace-nowrap relative"
                    ref={regMoDropdownContainerRef}
                  >
                    <div className="relative z-[1000]">
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
                        <ul className="absolute z-[1010] mt-1 w-max min-w-[200px] bg-white shadow-2xl max-h-52 md:max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-y-auto top-full left-0">
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
                  <td className="p-1.5 whitespace-nowrap">
                    <input
                      type="number"
                      value={regReqTime ?? ""}
                      readOnly
                      className={`${baseInputClasses} text-center bg-slate-100 py-1.5`}
                    />
                  </td>
                  <td className="p-1.5 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.1"
                      value={regReqPressure ?? ""}
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
                      {t("sccDailyHTQC.register")}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ** NEW: Test Results Section ** */}
      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-sm md:text-base font-semibold text-slate-700 mb-3 flex items-center">
          <ClipboardCheck size={16} className="mr-2 text-purple-600" />
          {t("sccDailyHTQC.testResultsTitle", "Test Results")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:flex-1">
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
              {machineOptions
                .filter((m) =>
                  registeredMachines.some((rm) => rm.machineNo === m)
                )
                .map((m) => (
                  <option key={`test-filter-${m}`} value={m}>
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
                <th className="p-2 border border-slate-300">{t("scc.moNo")}</th>
                <th className="p-2 border border-slate-300">
                  {t("scc.color")}
                </th>
                <th className="p-2 border border-slate-300">
                  {t("sccDailyHTQC.stretchScratchTest")}
                </th>
                <th className="p-2 border border-slate-300">
                  {t("sccDailyHTQC.washingTest")}
                </th>
                {/* No general submit button per row; submit per test type */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {testResultsTableDisplayData.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-4 text-center text-slate-500 italic"
                  >
                    {t("sccDailyHTQC.noMachinesRegisteredOrFiltered")}
                  </td>
                </tr>
              )}
              {testResultsTableDisplayData.map((machine) => {
                const currentTestResult = testResultsData[machine._id] || {
                  stretchTestResult: "",
                  stretchTestRejectReasons: [],
                  washingTestResult: ""
                };
                const isStretchSubmitted =
                  machine.stretchTestResult &&
                  machine.stretchTestResult !== "Pending";
                const isWashingSubmitted =
                  machine.washingTestResult &&
                  machine.washingTestResult !== "Pending";

                return (
                  <tr key={`test-${machine._id}`} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 text-center align-middle font-medium">
                      {machine.machineNo}
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle">
                      {machine.moNo}
                    </td>
                    <td className="p-2 border border-slate-300 text-center align-middle">
                      {machine.color}
                    </td>
                    <td className="p-2 border border-slate-300 align-top">
                      <div className="flex flex-col space-y-1">
                        <select
                          value={currentTestResult.stretchTestResult}
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
                            submittingTestResultId === machine._id + "_stretch"
                          }
                        >
                          <option value="">{t("scc.selectStatus")}</option>
                          <option value="Pass">{t("scc.pass")}</option>
                          <option value="Reject">{t("scc.reject")}</option>
                        </select>
                        {currentTestResult.stretchTestResult === "Reject" &&
                          !isStretchSubmitted && (
                            <select
                              multiple
                              value={currentTestResult.stretchTestRejectReasons}
                              onChange={(e) =>
                                handleStretchRejectReasonChange(
                                  machine._id,
                                  Array.from(
                                    e.target.selectedOptions,
                                    (option) => option.value
                                  )
                                )
                              }
                              className={`${baseInputClasses} py-1 text-xs h-20`} // Multiple select needs height
                              disabled={
                                submittingTestResultId ===
                                machine._id + "_stretch"
                              }
                            >
                              {STRETCH_REJECT_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                          )}
                        {isStretchSubmitted && (
                          <div className="text-xs mt-1 p-1 bg-green-50 text-green-700 rounded">
                            {t("sccDailyHTQC.resultSubmitted")}:{" "}
                            {t(
                              `scc.${machine.stretchTestResult.toLowerCase()}`
                            )}
                            {machine.stretchTestResult === "Reject" &&
                              machine.stretchTestRejectReasons?.length > 0 && (
                                <div className="text-slate-600 text-[10px] mt-0.5">
                                  ({t("sccDailyHTQC.reasons")}:{" "}
                                  {machine.stretchTestRejectReasons.join(", ")})
                                </div>
                              )}
                          </div>
                        )}
                        {!isStretchSubmitted && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitTestResult(machine, "stretch")
                            }
                            disabled={
                              !currentTestResult.stretchTestResult ||
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
                            )}
                            {t("sccDailyHTQC.submitStretchTest")}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 align-top">
                      <div className="flex flex-col space-y-1">
                        <select
                          value={currentTestResult.washingTestResult}
                          onChange={(e) =>
                            handleTestResultChange(
                              machine._id,
                              "washingTestResult",
                              e.target.value
                            )
                          }
                          className={`${baseInputClasses} py-1 text-xs`}
                          disabled={
                            isWashingSubmitted ||
                            submittingTestResultId === machine._id + "_washing"
                          }
                        >
                          <option value="">{t("scc.selectStatus")}</option>
                          <option value="Pass">{t("scc.pass")}</option>
                          <option value="Reject">{t("scc.reject")}</option>
                        </select>
                        {isWashingSubmitted && (
                          <div className="text-xs mt-1 p-1 bg-green-50 text-green-700 rounded">
                            {t("sccDailyHTQC.resultSubmitted")}:{" "}
                            {t(
                              `scc.${machine.washingTestResult.toLowerCase()}`
                            )}
                          </div>
                        )}
                        {!isWashingSubmitted && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitTestResult(machine, "washing")
                            }
                            disabled={
                              !currentTestResult.washingTestResult ||
                              submittingTestResultId ===
                                machine._id + "_washing" ||
                              parentIsSubmitting
                            }
                            className="mt-1 px-2 py-1 bg-teal-600 text-white text-[10px] font-medium rounded hover:bg-teal-700 disabled:bg-slate-300 flex items-center justify-center"
                          >
                            {submittingTestResultId ===
                            machine._id + "_washing" ? (
                              <Loader2
                                size={12}
                                className="animate-spin mr-1"
                              />
                            ) : (
                              <Send size={10} className="mr-1" />
                            )}
                            {t("sccDailyHTQC.submitWashingTest")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filterMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="filterMachineNo"
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
                {inspectionTableDisplayData.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-4 text-center text-slate-500 italic"
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
                    pressure_isNA: false,
                    temp_isUserModified: false,
                    time_isUserModified: false,
                    pressure_isUserModified: false
                  };
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
                      key={`${machine._id}_${selectedTimeSlotKey}`}
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
                                            param.field === "pressure" ? 0.1 : 1
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
                                      handleSubmitMachineSlotInspection(machine)
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
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 italic">
            {t("sccDailyHTQC.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>
    </div>
  );
};

export default DailyHTQC;
