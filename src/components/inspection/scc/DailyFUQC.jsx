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
  Send,
  UserCircle2,
  ChevronDown,
  ChevronUp
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
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatTimestampForDisplay = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const formatMachineNumber = (num, length = 3) =>
  String(num).padStart(length, "0");

const DailyFUQC = ({ onFormSubmit, isSubmitting: parentIsSubmitting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [totalMachines, setTotalMachines] = useState(5);
  const [tempTolerance, setTempTolerance] = useState(5);
  const [timeTolerance, setTimeTolerance] = useState(0); // New: Time tolerance for FUQC

  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [regMachineNo, setRegMachineNo] = useState("");
  const [regMoNoSearch, setRegMoNoSearch] = useState("");
  const [regMoNo, setRegMoNo] = useState("");
  const [regBuyer, setRegBuyer] = useState("");
  const [regBuyerStyle, setRegBuyerStyle] = useState("");
  const [regColor, setRegColor] = useState("");
  const [regAvailableColors, setRegAvailableColors] = useState([]);
  const [regReqTemp, setRegReqTemp] = useState(null);
  const [regReqTime, setRegReqTime] = useState(null); // New for FUQC registration specs
  const [regOperatorData, setRegOperatorData] = useState(null);
  const [regOperatorLoading, setRegOperatorLoading] = useState(false);
  const [moDropdownOptions, setMoDropdownOptions] = useState([]);
  const [showRegMoDropdown, setShowRegMoDropdown] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  const regMoSearchInputRef = useRef(null);
  const regMoDropdownContainerRef = useRef(null);

  const [registeredMachines, setRegisteredMachines] = useState([]);
  const [uniqueMoNosForDate, setUniqueMoNosForDate] = useState([]); // For MO filter

  const [filterMoNo, setFilterMoNo] = useState("All"); // New MO filter for inspection table
  const [filterMachineNo, setFilterMachineNo] = useState("All");
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");
  const [actualValues, setActualValues] = useState({});
  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  const fuMachineOptions = useMemo(
    () =>
      Array.from({ length: totalMachines }, (_, i) =>
        formatMachineNumber(i + 1)
      ),
    [totalMachines]
  );

  useEffect(() => {
    const fetchRegOperator = async () => {
      if (!regMachineNo) {
        setRegOperatorData(null);
        return;
      }
      setRegOperatorLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/fu/${regMachineNo}`
        ); // Type "fu"
        setRegOperatorData(response.data?.data || null);
      } catch (error) {
        setRegOperatorData(null);
        if (
          !(
            error.response?.status === 404 &&
            error.response?.data?.message === "OPERATOR_NOT_FOUND"
          )
        ) {
          console.error("Error fetching FU operator for registration:", error);
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
          .get(`${API_BASE_URL}/api/scc/fu-first-output/search-active-mos`, {
            params: { term: regMoNoSearch }
          })
          .then((response) => {
            setMoDropdownOptions(response.data || []);
            setShowRegMoDropdown(response.data.length > 0);
          })
          .catch((error) => {
            console.error("Error searching FU MOs:", error);
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
    setRegReqTime(null); // Reset time too
    setIsRegLoading(true);
    axios
      .get(
        `${API_BASE_URL}/api/scc/fu-first-output/mo-details-for-registration`,
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
          "Error fetching FU MO colors:",
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
        .get(`${API_BASE_URL}/api/scc/fu-first-output/specs-for-registration`, {
          params: { moNo: moToUse, color: newColor }
        })
        .then((response) => {
          const specs = response.data;
          setRegReqTemp(specs?.reqTemp !== undefined ? specs.reqTemp : null);
          setRegReqTime(specs?.reqTime !== undefined ? specs.reqTime : null); // Set reqTime
        })
        .catch((error) => {
          console.error(
            "Error fetching FU specs:",
            error.response?.data || error.message
          );
          setRegReqTemp(null);
          setRegReqTime(null);
          Swal.fire(
            t("scc.error"),
            t("sccDailyFUQC.errorFetchingSpecs"),
            "error"
          );
        })
        .finally(() => setIsRegLoading(false));
    } else {
      setRegReqTemp(null);
      setRegReqTime(null);
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
    setRegOperatorData(null);
  };

  const handleRegisterMachine = async () => {
    if (!regMachineNo || !regMoNo || !regColor) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.fillMachineMoColor"),
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
      baseReqTime: regReqTime, // Add baseReqTime
      operatorData: regOperatorData,
      emp_id: user.emp_id,
      emp_kh_name: user.kh_name,
      emp_eng_name: user.eng_name,
      emp_dept_name: user.dept_name,
      emp_sect_name: user.sect_name,
      emp_job_title: user.job_title
    };
    const success = await onFormSubmit("registerFUQCMachine", payload);
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
      .get(`${API_BASE_URL}/api/scc/daily-fuqc/distinct-mos`, {
        params: { inspectionDate: apiDate }
      })
      .then((res) => setUniqueMoNosForDate(res.data || []))
      .catch((err) => {
        console.error("Error fetching distinct FU MOs:", err);
        setUniqueMoNosForDate([]);
      });

    axios
      .get(`${API_BASE_URL}/api/scc/daily-fuqc/by-date`, {
        params: { inspectionDate: apiDate }
      })
      .then((response) => {
        setRegisteredMachines(response.data || []);
      })
      .catch((error) => {
        console.error("Error fetching registered FUQC machines:", error);
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
            time_actual: existingInspection.time_actual,
            time_isNA_time: existingInspection.time_isNA, // Use distinct NA flag for time
            isUserModified: true // Assume data from DB is "final" for the slot
          };
        } else {
          if (
            !actualValues[docSlotKey] ||
            !actualValues[docSlotKey].isUserModified
          ) {
            newActuals[docSlotKey] = {
              temp_actual: null,
              temp_isNA: false,
              time_actual: null,
              time_isNA_time: false,
              isUserModified: false
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
    // paramField is 'temp' or 'time'
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    setActualValues((prev) => {
      const currentSlotData = prev[key] || {
        temp_isNA: false,
        time_isNA_time: false,
        isUserModified: false
      };
      return {
        ...prev,
        [key]: {
          ...currentSlotData,
          [actualFieldKey]: value === "" ? null : Number(value),
          isUserModified: true
        }
      };
    });
  };

  const toggleActualNA = (docId, timeSlotKey, paramField) => {
    // paramField is 'temp' or 'time'
    const key = `${docId}_${timeSlotKey}`;
    const actualFieldKey = `${paramField}_actual`;
    const isNAFlagKey = paramField === "temp" ? "temp_isNA" : "time_isNA_time";
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {
        temp_isNA: false,
        time_isNA_time: false,
        isUserModified: false
      };
      const newIsNA = !currentSlotActuals[isNAFlagKey];
      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [actualFieldKey]: newIsNA ? null : currentSlotActuals[actualFieldKey],
          [isNAFlagKey]: newIsNA,
          isUserModified: true
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
    setActualValues((prev) => {
      const currentSlotActuals = prev[key] || {
        temp_isNA: false,
        time_isNA_time: false,
        isUserModified: false
      };
      let currentActualNum = Number(currentSlotActuals[actualFieldKey]);
      if (isNaN(currentActualNum)) {
        const machineDoc = registeredMachines.find((m) => m._id === docId);
        currentActualNum =
          (paramField === "temp"
            ? machineDoc?.baseReqTemp
            : machineDoc?.baseReqTime) || 0;
      }
      let newValue = currentActualNum + increment;
      newValue = Math.max(0, newValue); // Ensure not negative
      return {
        ...prev,
        [key]: {
          ...currentSlotActuals,
          [actualFieldKey]: newValue,
          isUserModified: true
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
    return filtered.sort((a, b) =>
      a.machineNo.localeCompare(b.machineNo, undefined, { numeric: true })
    );
  };

  const inspectionTableDisplayData = useMemo(
    () => getFilteredTableData(registeredMachines, filterMoNo, filterMachineNo), // Use filterMoNo here
    [registeredMachines, filterMoNo, filterMachineNo]
  );

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
    const timeActualToSubmit = currentActuals.time_isNA_time
      ? null
      : currentActuals.time_actual ?? null;

    if (!currentActuals.temp_isNA && tempActualToSubmit === null) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.fillActualTempOrNA"),
        "warning"
      );
      return;
    }
    if (!currentActuals.time_isNA_time && timeActualToSubmit === null) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccDailyFUQC.validation.fillActualTimeOrNA"),
        "warning"
      );
      return;
    }

    const payload = {
      inspectionDate: formatDateForAPI(inspectionDate),
      timeSlotKey: selectedTimeSlotKey,
      inspectionNo: currentSlotConfig.inspectionNo,
      dailyFUQCDocId: machineDoc._id,
      temp_req: machineDoc.baseReqTemp ?? null,
      temp_actual: tempActualToSubmit,
      temp_isNA: !!currentActuals.temp_isNA,
      time_req: machineDoc.baseReqTime ?? null,
      time_actual: timeActualToSubmit,
      time_isNA: !!currentActuals.time_isNA_time, // Use time_isNA_time
      // temp_isUserModified and time_isUserModified are not in FUQC slot schema based on previous definition
      emp_id: user.emp_id
    };
    setSubmittingMachineSlot(docSlotKey);
    const success = await onFormSubmit("submitFUQCSlotInspection", payload);
    setSubmittingMachineSlot(null);
    if (success) fetchRegisteredMachinesForDate();
  };

  const getStatusAndBG = useCallback(
    (
      actual,
      req,
      tolerance,
      isNA,
      forCellBackground = false,
      isTime = false
    ) => {
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
      let isPass;
      if (isTime) {
        // For Time, tolerance is 0 (exact match)
        isPass = diff === 0;
      } else {
        // For Temperature
        isPass = Math.abs(diff) <= tolerance;
      }

      if (isPass)
        return {
          statusText: `OK`,
          valueText: `(${numActual})`,
          bgColor: "bg-green-100 text-green-700",
          icon: <Check size={14} className="mr-1" />
        };

      const deviationText = diff < 0 ? `Low` : `High`;
      const valueText = `(${numActual}, ${diff < 0 ? "" : "+"}${
        isTime ? Math.round(diff) : diff.toFixed(0)
      })`; // Show integer diff for time
      return {
        statusText: deviationText,
        valueText,
        bgColor: "bg-red-100 text-red-700",
        icon: <AlertTriangle size={14} className="mr-1" />
      };
    },
    [t]
  ); // Removed tempTolerance, as it's now passed as 'tolerance'

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
    regOperatorLoading;

  const renderOperatorDataCell = (operatorData, context = "table") => {
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
    // For FUQC, includes Temp and Time
    return (
      <div className="text-[10px] p-1 space-y-0.5 min-w-[100px] text-left">
        <div className="flex items-center">
          <Thermometer size={10} className="mr-1 text-red-500 flex-shrink-0" />{" "}
          {t("sccDailyFUQC.tempShort", "T")}:{" "}
          {machine.baseReqTemp ?? t("scc.naCap")}°C
        </div>
        <div className="flex items-center">
          <Clock size={10} className="mr-1 text-blue-500 flex-shrink-0" />{" "}
          {t("sccDailyFUQC.timeShort", "t")}:{" "}
          {machine.baseReqTime ?? t("scc.naCap")}s
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
          {t("sccDailyFUQC.mainTitle")}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("sccDailyFUQC.mainSubtitle")}
        </p>
      </header>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-slate-700">
            <Settings2 size={18} className="mr-2 text-indigo-600" />
            <h2 className="text-md md:text-lg font-semibold">
              {t("sccDailyFUQC.settingsTitle")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4 items-end">
          <div>
            <label htmlFor="fuqcTotalMachines" className={labelClasses}>
              {t("sccDailyFUQC.totalMachines")}
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
              {t("sccDailyFUQC.tempTolerance")}
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
          <div>
            <label htmlFor="fuqcTimeTolerance" className={labelClasses}>
              <AlertTriangle size={12} className="inline mr-1 text-slate-500" />
              {t("sccDailyFUQC.timeToleranceFU")}
            </label>
            <input
              id="fuqcTimeTolerance"
              type="number"
              value={timeTolerance}
              onChange={(e) =>
                setTimeTolerance(Math.max(0, Number(e.target.value)))
              }
              disabled={!settingsEnabled}
              className={`${baseInputClasses} py-1.5`}
              placeholder="Default: 0 (Exact Match)"
            />
          </div>
        </div>
      </section>

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

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <BookUser size={18} className="mr-2 text-indigo-600" />{" "}
          {t("sccDailyFUQC.registerMachineTitle")}
        </h2>
        <div
          className={`pretty-scrollbar ${
            showRegMoDropdown ? "overflow-visible" : "overflow-x-auto"
          }`}
        >
          <table
            className="w-full text-xs sm:text-sm whitespace-nowrap"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "8%" }} /> {/* Machine No */}
              <col style={{ width: "15%" }} /> {/* MO No */}
              <col style={{ width: "20%" }} /> {/* Order Details */}
              <col style={{ width: "12%" }} /> {/* Color */}
              <col style={{ width: "15%" }} /> {/* Operator Data */}
              <col style={{ width: "15%" }} /> {/* Specs */}
              <col style={{ width: "15%" }} /> {/* Action */}
            </colgroup>
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600 font-semibold">
                <th className="p-2 border-r">{t("scc.machineNo")}</th>
                <th className="p-2 border-r">{t("scc.moNo")}</th>
                <th className="p-2 border-r">
                  {t("sccDailyFUQC.orderDetails")}
                </th>
                <th className="p-2 border-r">{t("scc.color")}</th>
                <th className="p-2 border-r text-center">
                  {t("scc.operatorData")}
                </th>
                <th className="p-2 border-r text-center">
                  {t("sccDailyFUQC.specs")}
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
                    {fuMachineOptions.map((m) => (
                      <option key={`reg-fu-mach-${m}`} value={m}>
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
                      <option key={`reg-fu-col-${c}`} value={c}>
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
                  regMoNoSearch &&
                  regColor ? (
                    <Loader2
                      size={16}
                      className="animate-spin mx-auto text-indigo-500"
                    />
                  ) : (
                    renderSpecsCell({
                      baseReqTemp: regReqTemp,
                      baseReqTime: regReqTime
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
                    {t("sccDailyFUQC.register")}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <ListChecks size={18} className="mr-2 text-indigo-600" />{" "}
          {t("sccDailyFUQC.inspectionDataTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <label htmlFor="fuqcFilterMoNo" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <select
              id="fuqcFilterMoNo"
              value={filterMoNo}
              onChange={(e) => setFilterMoNo(e.target.value)}
              className={`${baseInputClasses} py-1.5`}
            >
              <option value="All">{t("sccDailyFUQC.allMoNo")}</option>
              {uniqueMoNosForDate.map((mo) => (
                <option key={`fuqc-filter-mo-${mo}`} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
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
              {fuMachineOptions
                .filter((m) =>
                  registeredMachines.some((rm) => rm.machineNo === m)
                )
                .map((m) => (
                  <option key={`fuqc-filter-mach-${m}`} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
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
                    {t("scc.operatorData")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.moNo")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.color")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccDailyFUQC.parameter")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyFUQC.reqValue")}
                  </th>
                  <th className="p-2 border border-slate-300 text-center">
                    {t("sccDailyFUQC.actualValue")}
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
                      {t("sccDailyFUQC.noMachinesRegisteredOrFiltered")}
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
                        name: t("sccDailyFUQC.temperature"),
                        field: "temp",
                        unit: "°C",
                        reqValue: machine.baseReqTemp,
                        tolerance: tempTolerance,
                        icon: <Thermometer size={12} />
                      },
                      {
                        name: t("sccDailyFUQC.timing"),
                        field: "time",
                        unit: "Sec",
                        reqValue: machine.baseReqTime,
                        tolerance: timeTolerance,
                        icon: <Clock size={12} />
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
                            param.field === "temp"
                              ? currentActualsForSlot.temp_isNA
                              : currentActualsForSlot.time_isNA_time; // Use correct NA flag
                          const cellStatus = getStatusAndBG(
                            actualValueForParam,
                            param.reqValue,
                            param.tolerance,
                            isNAForParam,
                            true,
                            param.field === "time"
                          );
                          const rowOverallStatus = getStatusAndBG(
                            actualValueForParam,
                            param.reqValue,
                            param.tolerance,
                            isNAForParam,
                            false,
                            param.field === "time"
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
                                        param.tolerance,
                                        existingInspectionForSlot[
                                          `${param.field}_isNA`
                                        ],
                                        false,
                                        param.field === "time"
                                      ).bgColor
                                    }`}
                                  >
                                    {React.cloneElement(
                                      getStatusAndBG(
                                        existingInspectionForSlot[
                                          `${param.field}_actual`
                                        ],
                                        param.reqValue,
                                        param.tolerance,
                                        existingInspectionForSlot[
                                          `${param.field}_isNA`
                                        ],
                                        false,
                                        param.field === "time"
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
                                        {t("sccDailyFUQC.submitted")}
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
            {t("sccDailyFUQC.pleaseSelectTimeSlot")}
          </div>
        )}
      </section>
    </div>
  );
};

export default DailyFUQC;
