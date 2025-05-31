import axios from "axios";
import {
  Activity,
  BookUser,
  CalendarDays,
  Check,
  ListChecks,
  Loader2,
  Search,
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
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

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
  const [regMachineNo, setRegMachineNo] = useState("");
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

  const [registeredMachinesForElastic, setRegisteredMachinesForElastic] =
    useState([]);
  const [filterMachineNo, setFilterMachineNo] = useState("All");
  const [selectedTimeSlotKey, setSelectedTimeSlotKey] = useState("");

  // This state is the source of truth for the input values
  const [slotInspectionValues, setSlotInspectionValues] = useState({});

  // Ref for submission handlers to get latest values if setState is async
  const slotInspectionValuesRef = useRef(slotInspectionValues);

  const [isInspectionDataLoading, setIsInspectionDataLoading] = useState(false);
  const [submittingMachineSlot, setSubmittingMachineSlot] = useState(null);

  const machineOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(i + 1)),
    []
  );

  useEffect(() => {
    slotInspectionValuesRef.current = slotInspectionValues;
  }, [slotInspectionValues]);

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
        console.error("Error fetching MO details for Elastic Report:", error);
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

    const updateSlotsOnFetch = (fetchedMachines, currentSlotKey) => {
      setSlotInspectionValues((prevSlotValues) => {
        const newSlotValues = { ...prevSlotValues };
        let changed = false;
        fetchedMachines.forEach((machine) => {
          const docSlotKey = `${machine._id}_${currentSlotKey}`;
          const existingInspection = machine.inspections?.find(
            (insp) => insp.timeSlotKey === currentSlotKey
          );

          if (existingInspection) {
            // If there's a saved inspection, ensure local state matches it
            // This is crucial if data was submitted and then fetched again
            if (
              JSON.stringify(newSlotValues[docSlotKey] || {}) !==
              JSON.stringify(existingInspection)
            ) {
              newSlotValues[docSlotKey] = {
                ...existingInspection,
                isUserModified: true
              }; // Mark as modified if it has data
              changed = true;
            }
          } else if (
            !newSlotValues[docSlotKey] ||
            !newSlotValues[docSlotKey].isUserModified
          ) {
            // If no saved inspection and local state is not user-modified, set to default
            newSlotValues[docSlotKey] = {
              checkedQty: 20,
              qualityIssue: "Pass",
              measurement: "Pass",
              defects: "Pass",
              result: "Pass",
              remarks: "",
              isUserModified: false
            };
            changed = true;
          }
        });
        return changed ? newSlotValues : prevSlotValues;
      });
    };

    axios
      .get(`${API_BASE_URL}/api/scc/elastic-report/by-date`, {
        params: { inspectionDate: formatDateForAPI(inspectionDate) }
      })
      .then((response) => {
        const fetchedMachines = response.data || [];
        setRegisteredMachinesForElastic(fetchedMachines);
        if (selectedTimeSlotKey && fetchedMachines.length > 0) {
          updateSlotsOnFetch(fetchedMachines, selectedTimeSlotKey);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching registered machines for Elastic Report:",
          error
        );
        setRegisteredMachinesForElastic([]);
      })
      .finally(() => setIsInspectionDataLoading(false));
  }, [inspectionDate, selectedTimeSlotKey]);

  useEffect(() => {
    fetchRegisteredMachinesForElasticReport();
  }, [fetchRegisteredMachinesForElasticReport]);

  const handleSlotInputChange = (docId, timeSlotKey, field, value) => {
    const key = `${docId}_${timeSlotKey}`;
    setSlotInspectionValues((prev) => {
      const currentSlotData = prev[key] || {
        checkedQty: 20,
        qualityIssue: "Pass",
        measurement: "Pass",
        defects: "Pass",
        result: "Pass",
        remarks: "",
        isUserModified: false
      };
      const processedValue =
        field === "checkedQty" ? (value === "" ? "" : Number(value)) : value;
      const newSlotData = {
        ...currentSlotData,
        [field]: processedValue,
        isUserModified: true
      };

      if (
        ["qualityIssue", "measurement", "defects"].includes(field) ||
        field === "checkedQty"
      ) {
        newSlotData.result =
          newSlotData.qualityIssue === "Pass" &&
          newSlotData.measurement === "Pass" &&
          newSlotData.defects === "Pass" &&
          Number(newSlotData.checkedQty) > 0
            ? "Pass"
            : "Reject";
      }
      return { ...prev, [key]: newSlotData };
    });
  };

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
    if (!currentSlotConfig) return;

    const docSlotKey = `${machineDoc._id}_${selectedTimeSlotKey}`;
    const currentSlotData = slotInspectionValuesRef.current[docSlotKey];

    if (
      !currentSlotData ||
      currentSlotData.checkedQty === undefined ||
      currentSlotData.checkedQty === null ||
      Number(currentSlotData.checkedQty) <= 0
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccElasticReport.validation.fillCheckedQty"),
        "warning"
      );
      return;
    }

    const payload = {
      inspectionDate: formatDateForAPI(inspectionDate),
      timeSlotKey: selectedTimeSlotKey,
      inspectionNo: currentSlotConfig.inspectionNo,
      elasticReportDocId: machineDoc._id,
      checkedQty: Number(currentSlotData.checkedQty),
      qualityIssue: currentSlotData.qualityIssue,
      measurement: currentSlotData.measurement,
      defects: currentSlotData.defects,
      result: currentSlotData.result,
      remarks: currentSlotData.remarks?.trim() || "",
      emp_id: user.emp_id,
      isUserModified: true
    };

    setSubmittingMachineSlot(docSlotKey);
    const success = await onFormSubmit("submitElasticSlotInspection", payload);
    setSubmittingMachineSlot(null);
    if (success) {
      fetchRegisteredMachinesForElasticReport();
    }
  };

  const inspectionTableDisplayData = useMemo(() => {
    let filtered = registeredMachinesForElastic;
    if (filterMachineNo !== "All") {
      filtered = registeredMachinesForElastic.filter(
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
  }, [registeredMachinesForElastic, filterMachineNo]);

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

  return (
    <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">
      {overallIsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
          <Loader2 className="animate-spin h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
        </div>
      )}
      <header className="text-center mb-6">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          {t("sccElasticReport.mainTitle", "Daily Elastic Checking Report")}
        </h1>
      </header>

      <div className="max-w-xs mx-auto my-4 md:my-5">
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

      <section className="p-3 md:p-4 bg-white border border-slate-200 rounded-lg shadow">
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <BookUser size={18} className="mr-2 text-indigo-600" />
          {t("sccElasticReport.registerMachineTitle")}
        </h2>
        <div className="relative">
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
                <td className="p-1.5 whitespace-nowrap text-center">
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
        <h2 className="text-md md:text-lg font-semibold text-slate-700 mb-3 flex items-center">
          <ListChecks size={18} className="mr-2 text-indigo-600" />
          {t("sccElasticReport.inspectionDataTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
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
                  registeredMachinesForElastic.some((rm) => rm.machineNo === m)
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
              onChange={(e) => {
                const newSlotKey = e.target.value;
                setSelectedTimeSlotKey(newSlotKey);
                if (newSlotKey) {
                  setSlotInspectionValues((prevSlotValues) => {
                    // Use functional update
                    const newValues = { ...prevSlotValues };
                    let changed = false;
                    // Use registeredMachinesForElastic directly as inspectionTableDisplayData might not be updated yet
                    registeredMachinesForElastic.forEach((machine) => {
                      const docSlotKey = `${machine._id}_${newSlotKey}`;
                      const existingInspection = machine.inspections?.find(
                        (insp) => insp.timeSlotKey === newSlotKey
                      );
                      if (existingInspection) {
                        if (
                          !newValues[docSlotKey] ||
                          JSON.stringify(newValues[docSlotKey]) !==
                            JSON.stringify(existingInspection)
                        ) {
                          newValues[docSlotKey] = {
                            ...existingInspection,
                            isUserModified: true
                          };
                          changed = true;
                        }
                      } else if (
                        !newValues[docSlotKey] ||
                        !newValues[docSlotKey].isUserModified
                      ) {
                        newValues[docSlotKey] = {
                          checkedQty: 20,
                          qualityIssue: "Pass",
                          measurement: "Pass",
                          defects: "Pass",
                          result: "Pass",
                          remarks: "",
                          isUserModified: false
                        };
                        changed = true;
                      }
                    });
                    return changed ? newValues : prevSlotValues;
                  });
                }
              }}
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
                    {t("sccElasticReport.checkedQty")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccElasticReport.qualityIssue")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccElasticReport.measurement")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("sccElasticReport.defects")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.result")}
                  </th>
                  <th className="p-2 border border-slate-300">
                    {t("scc.remarks")}
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
                      colSpan="10"
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {t("sccElasticReport.noMachinesRegisteredOrFiltered")}
                    </td>
                  </tr>
                )}
                {inspectionTableDisplayData.map((machine) => {
                  const docSlotKey = `${machine._id}_${selectedTimeSlotKey}`;
                  // *** FIX: Read directly from slotInspectionValues state for rendering ***
                  const currentData = slotInspectionValues[docSlotKey] || {
                    checkedQty: 20,
                    qualityIssue: "Pass",
                    measurement: "Pass",
                    defects: "Pass",
                    result: "Pass",
                    remarks: "",
                    isUserModified: false
                  };
                  const existingInspectionForSlot = machine.inspections?.find(
                    (insp) => insp.timeSlotKey === selectedTimeSlotKey
                  );
                  const isCurrentlySubmittingThis =
                    submittingMachineSlot === docSlotKey;
                  const isSubmitted = !!existingInspectionForSlot;

                  return (
                    <tr
                      key={docSlotKey}
                      className={`transition-colors text-xs hover:bg-slate-50 ${
                        isSubmitted ? "bg-green-50" : ""
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
                      <td className="p-1 border border-slate-300 text-center">
                        {isSubmitted ? (
                          <span className="px-1.5 py-0.5 rounded text-xs font-semibold">
                            {existingInspectionForSlot.checkedQty}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={currentData.checkedQty} // Value from state
                            onChange={(e) =>
                              handleSlotInputChange(
                                machine._id,
                                selectedTimeSlotKey,
                                "checkedQty",
                                e.target.value
                              )
                            }
                            className="w-16 text-center p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        )}
                      </td>
                      {["qualityIssue", "measurement", "defects"].map(
                        (field) => (
                          <td
                            key={field}
                            className="p-1 border border-slate-300 text-center"
                          >
                            {isSubmitted ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                  existingInspectionForSlot[field] === "Pass"
                                    ? "text-green-700 bg-green-100"
                                    : "text-red-700 bg-red-100"
                                }`}
                              >
                                {t(
                                  `scc.${existingInspectionForSlot[
                                    field
                                  ]?.toLowerCase()}`,
                                  existingInspectionForSlot[field]
                                )}
                              </span>
                            ) : (
                              <select
                                value={currentData[field]} // Value from state
                                onChange={(e) =>
                                  handleSlotInputChange(
                                    machine._id,
                                    selectedTimeSlotKey,
                                    field,
                                    e.target.value
                                  )
                                }
                                className={`${baseInputClasses} py-1 text-xs`}
                              >
                                <option value="Pass">{t("scc.pass")}</option>
                                <option value="Reject">
                                  {t("scc.reject")}
                                </option>
                              </select>
                            )}
                          </td>
                        )
                      )}
                      <td className="p-1 border border-slate-300 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                            (isSubmitted
                              ? existingInspectionForSlot.result
                              : currentData.result) === "Pass"
                              ? "text-green-700 bg-green-100"
                              : "text-red-700 bg-red-100"
                          }`}
                        >
                          {t(
                            `scc.${(isSubmitted
                              ? existingInspectionForSlot.result
                              : currentData.result
                            )?.toLowerCase()}`,
                            isSubmitted
                              ? existingInspectionForSlot.result
                              : currentData.result
                          )}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-center">
                        {isSubmitted ? (
                          <span className="text-xs">
                            {existingInspectionForSlot.remarks || "-"}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={currentData.remarks} // Value from state
                            onChange={(e) =>
                              handleSlotInputChange(
                                machine._id,
                                selectedTimeSlotKey,
                                "remarks",
                                e.target.value
                              )
                            }
                            className="w-full p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={t("scc.remarksPlaceholderShort")}
                          />
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center align-middle">
                        {isSubmitted ? (
                          <div className="flex flex-col items-center justify-center text-green-700">
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
                              handleSubmitElasticSlotInspection(machine)
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
                            )}
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
    </div>
  );
};

export default ElasticReport;
