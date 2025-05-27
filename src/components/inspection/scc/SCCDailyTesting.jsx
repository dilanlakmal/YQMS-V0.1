import axios from "axios";
import {
  ChevronDown,
  Info,
  Loader2,
  Minus,
  Plus, // Might remove if cycles are gone
  Search
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import SCCImageUpload from "./SCCImageUpload";

// Define common input field styling
const inputBaseClasses =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
const inputFieldTableClasses = // For table inputs
  "w-full p-1.5 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500";

const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";

// New: Initial state for parameter adjustment record
const initialAdjustmentRecordState = {
  rejectionNo: 1, // Will correspond to the rejection count
  adjustedTempC: null,
  adjustedTimeSec: null,
  adjustedPressure: null
};

const SCCDailyTesting = ({
  formData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting,
  formType // Should be "DailyTesting"
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Local state for managing parameter adjustment records and user preference
  const [provideAdjustmentData, setProvideAdjustmentData] = useState(true); // Default to Yes

  // --- State Hooks (copied from your provided code, then modified) ---
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

  const moNoInputRef = useRef(null);
  const machineNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const machineNoDropdownRef = useRef(null);

  // Initialize machine options for 1-15
  useEffect(() => {
    const machines = [];
    for (let i = 1; i <= 15; i++) {
      machines.push(String(i)); // Just the numbers 1 to 15
    }
    setMachineNoOptionsInternal(machines);
  }, []); // Empty dependency array, runs once on mount

  // // Initialize machine options (same as before)
  // useEffect(() => {
  //   const machines = [];
  //   for (let i = 1; i <= 15; i++) machines.push(String(i));
  //   for (let i = 1; i <= 5; i++) machines.push(String(i).padStart(3, "0"));
  //   setMachineNoOptionsInternal(machines);
  // }, []);

  const filteredMachineOptions = machineNoOptionsInternal.filter((machine) =>
    machine.toLowerCase().includes(machineNoSearch.toLowerCase())
  );

  // Fetch MO Numbers (same as before)
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
      console.error(t("sccdaily.errorFetchingMoLog"), error);
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
      ...formData, // Preserve date, machineNo
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      _id: null,
      standardSpecifications: { tempC: "", timeSec: "", pressure: "" },
      // cycleWashingResults: [], // Removed
      numberOfRejections: 0, // Reset rejections
      parameterAdjustmentRecords: [], // New: Reset adjustment records
      finalResult: "Pending",
      afterWashImageFile: null,
      afterWashImageUrl: null,
      remarks: ""
    });
    setShowMoNoDropdown(false);
    setRecordStatusMessage("");
    setProvideAdjustmentData(true); // Reset preference
  };

  const handleMachineSelect = (selectedMachine) => {
    setMachineNoSearch(selectedMachine);
    onFormDataChange({
      ...formData, // Preserve date, moNo, color etc. if already set
      machineNo: selectedMachine,
      _id: null, // Reset _id as machineNo change might mean a different record
      // Reset fields that might depend on machine + MO + color combination
      standardSpecifications: { tempC: "", timeSec: "", pressure: "" },
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending",
      afterWashImageFile: null,
      afterWashImageUrl: null
      // remarks: "" // Optionally reset remarks or keep them
    });
    setShowMachineNoDropdown(false);
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  // Fetch Order Details (same as before)
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
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
        console.error(t("sccdaily.errorFetchingOrderDetailsLog"), error);
        Swal.fire(
          t("scc.error"),
          t("sccdaily.errorFetchingOrderDetails"),
          "error"
        );
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
    if (formData.moNo) fetchOrderDetails();
    else {
      if (formData.buyer || formData.buyerStyle || formData.color) {
        onFormDataChange((prev) => ({
          ...prev,
          buyer: "",
          buyerStyle: "",
          color: ""
        }));
      }
      setAvailableColors([]);
    }
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
        // Specs not found
        onFormDataChange((prev) => ({
          ...prev,
          standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
        }));
        console.log(t("sccdaily.specsNotFoundLog"));
      }
    } catch (error) {
      console.error(t("sccdaily.errorFetchingSpecsLog"), error);
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

  // Fetch Existing Daily Testing Record or Standard Specs
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
        const recordData = response.data; // Full response object

        if (
          recordData.message === "DAILY_TESTING_RECORD_NOT_FOUND" ||
          !recordData.data
        ) {
          setRecordStatusMessage(t("sccdaily.newRecordMessage"));
          onFormDataChange((prev) => ({
            ...prev, // Keep current MO, color, machine, date
            _id: null,
            // standardSpecifications will be fetched by fetchStandardSpecs
            numberOfRejections: 0,
            parameterAdjustmentRecords: [], // Initialize as empty
            finalResult: "Pending",
            afterWashImageUrl: null,
            remarks: prev.remarks || "" // Preserve remarks if any
          }));
          setProvideAdjustmentData(true); // Default to yes for new records
          fetchStandardSpecs(); // Fetch specs for the new record context
        } else {
          // Existing record found
          const loadedRecord = recordData.data || recordData; // Handle direct or nested data
          setRecordStatusMessage(t("sccdaily.existingRecordLoadedShort"));
          onFormDataChange((prev) => ({
            ...prev, // Keep current date, machineNo, moNo, color
            _id: loadedRecord._id,
            standardSpecifications: loadedRecord.standardSpecifications || {
              tempC: "",
              timeSec: "",
              pressure: ""
            },
            numberOfRejections: loadedRecord.numberOfRejections || 0,
            parameterAdjustmentRecords: (
              loadedRecord.parameterAdjustmentRecords || []
            ).map((rec) => ({
              ...rec, // Ensure all fields are present, convert to string for input if necessary
              adjustedTempC:
                rec.adjustedTempC !== null ? String(rec.adjustedTempC) : "",
              adjustedTimeSec:
                rec.adjustedTimeSec !== null ? String(rec.adjustedTimeSec) : "",
              adjustedPressure:
                rec.adjustedPressure !== null
                  ? String(rec.adjustedPressure)
                  : ""
            })),
            finalResult: loadedRecord.finalResult || "Pending",
            afterWashImageUrl: loadedRecord.afterWashImage,
            remarks:
              loadedRecord.remarks === "NA" ? "" : loadedRecord.remarks || ""
          }));
          // Determine if user provided adjustment data for existing record
          setProvideAdjustmentData(
            (loadedRecord.parameterAdjustmentRecords || []).length > 0
          );
          // If standard specs are missing in loaded record but MO/Color/Date known, try fetching them
          if (
            !loadedRecord.standardSpecifications?.tempC &&
            loadedRecord.moNo &&
            loadedRecord.color &&
            loadedRecord.inspectionDate
          ) {
            fetchStandardSpecs();
          }
        }
      } catch (error) {
        console.error(t("sccdaily.errorFetchingDailyRecordLog"), error);
        Swal.fire(
          t("scc.error"),
          t("sccdaily.errorFetchingDailyRecord"),
          "error"
        );
        onFormDataChange((prev) => ({
          ...prev,
          _id: null,
          numberOfRejections: 0,
          parameterAdjustmentRecords: [],
          finalResult: "Pending",
          standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
        }));
        setProvideAdjustmentData(true);
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
      // If machineNo is missing but others are present, try to fetch standard specs
      fetchStandardSpecs();
      // And reset parts of the form that depend on machineNo
      onFormDataChange((prev) => ({
        ...prev,
        _id: null,
        numberOfRejections: 0,
        parameterAdjustmentRecords: [],
        finalResult: "Pending",
        afterWashImageFile: null,
        afterWashImageUrl: null
      }));
      setProvideAdjustmentData(true);
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
  // onFormDataChange removed from deps as it's called inside

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    // If key identifiers change, reset _id
    if (
      name === "moNo" ||
      name === "machineNo" ||
      name === "color" ||
      name === "inspectionDate"
    ) {
      newFormData._id = null;
      setRecordStatusMessage("");
      if (name === "moNo") {
        setMoNoSearch(value);
        newFormData.color = "";
        newFormData.buyer = "";
        newFormData.buyerStyle = "";
        setAvailableColors([]);
      }
      // Reset rejections and adjustments when identifiers change
      newFormData.numberOfRejections = 0;
      newFormData.parameterAdjustmentRecords = [];
      setProvideAdjustmentData(true);
    }
    onFormDataChange(newFormData);
  };

  const handleDateChange = (date) => {
    onFormDataChange({
      ...formData,
      inspectionDate: date,
      _id: null, // Reset ID
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending"
      // Standard specs will be re-fetched or cleared by useEffect
    });
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  const handleColorChange = (e) => {
    onFormDataChange({
      ...formData,
      color: e.target.value,
      _id: null, // Reset ID
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending"
      // Standard specs will be re-fetched or cleared by useEffect
    });
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  const handleSpecChange = (field, value) => {
    onFormDataChange((prev) => ({
      ...prev,
      standardSpecifications: {
        ...prev.standardSpecifications,
        [field]: value
      }
    }));
  };

  // Handle Number of Rejections Change
  const handleNumberOfRejectionsChange = (e) => {
    let numRejections = parseInt(e.target.value, 10);
    if (isNaN(numRejections) || numRejections < 0) {
      numRejections = 0;
    }
    if (numRejections > 5) numRejections = 5; // Max 5 rejections for this example

    const newAdjustmentRecords = [];
    if (provideAdjustmentData) {
      for (let i = 1; i <= numRejections; i++) {
        // Try to get existing or default to standard specs
        const existingRec = (formData.parameterAdjustmentRecords || [])[i - 1];
        newAdjustmentRecords.push({
          rejectionNo: i,
          adjustedTempC:
            existingRec?.adjustedTempC ??
            (formData.standardSpecifications?.tempC || ""),
          adjustedTimeSec:
            existingRec?.adjustedTimeSec ??
            (formData.standardSpecifications?.timeSec || ""),
          adjustedPressure:
            existingRec?.adjustedPressure ??
            (formData.standardSpecifications?.pressure || "")
        });
      }
    }

    onFormDataChange({
      ...formData,
      numberOfRejections: numRejections,
      parameterAdjustmentRecords: newAdjustmentRecords,
      finalResult:
        numRejections > 0
          ? "Reject"
          : formData.finalResult === "Reject"
          ? "Reject"
          : "Pass" // Auto set final result
    });
  };

  // Handle Parameter Adjustment Input Change
  const handleAdjustmentRecordChange = (index, field, value) => {
    const updatedRecords = [...(formData.parameterAdjustmentRecords || [])];
    if (updatedRecords[index]) {
      updatedRecords[index] = { ...updatedRecords[index], [field]: value };
      onFormDataChange({
        ...formData,
        parameterAdjustmentRecords: updatedRecords
      });
    }
  };

  const handleAdjustmentIncrementDecrement = (index, field, action) => {
    const updatedRecords = [...(formData.parameterAdjustmentRecords || [])];
    if (updatedRecords[index]) {
      let currentValue = parseFloat(updatedRecords[index][field]);
      if (isNaN(currentValue)) {
        // Default to standard spec if current is not a number
        const standardField = field.replace("adjusted", "").toLowerCase(); // e.g. adjustedTempC -> tempc
        let standardVal;
        if (standardField === "tempc")
          standardVal = formData.standardSpecifications?.tempC;
        else if (standardField === "timesec")
          standardVal = formData.standardSpecifications?.timeSec;
        else if (standardField === "pressure")
          standardVal = formData.standardSpecifications?.pressure;
        currentValue = parseFloat(standardVal) || 0;
      }

      if (action === "increment") currentValue += 1;
      if (action === "decrement") currentValue = Math.max(0, currentValue - 1); // Prevent negative for time/temp/pressure

      updatedRecords[index][field] = String(currentValue); // Store as string for input
      onFormDataChange({
        ...formData,
        parameterAdjustmentRecords: updatedRecords
      });
    }
  };

  const handleFinalResultChange = (e) => {
    onFormDataChange({ ...formData, finalResult: e.target.value });
  };

  const handleImageChange = (imageTypeIdentifier, file, previewUrl) => {
    // Renamed imageType to imageTypeIdentifier
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

  // Click outside handlers (same as before)
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

  // Handle "Provide Adjustment Data" toggle
  useEffect(() => {
    if (!provideAdjustmentData) {
      onFormDataChange((prev) => ({ ...prev, parameterAdjustmentRecords: [] }));
    } else {
      // If toggling back to Yes, and rejections exist, repopulate based on standard specs
      const numRejections = formData.numberOfRejections || 0;
      if (
        numRejections > 0 &&
        (!formData.parameterAdjustmentRecords ||
          formData.parameterAdjustmentRecords.length === 0)
      ) {
        const newAdjustmentRecords = [];
        for (let i = 1; i <= numRejections; i++) {
          newAdjustmentRecords.push({
            rejectionNo: i,
            adjustedTempC: formData.standardSpecifications?.tempC || "",
            adjustedTimeSec: formData.standardSpecifications?.timeSec || "",
            adjustedPressure: formData.standardSpecifications?.pressure || ""
          });
        }
        onFormDataChange((prev) => ({
          ...prev,
          parameterAdjustmentRecords: newAdjustmentRecords
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provideAdjustmentData, formData.numberOfRejections]); // Rerun if provideAdjustmentData or numberOfRejections changes

  const handleActualSubmit = () => {
    // Basic validation before calling parent submit
    if (
      !formData.moNo ||
      !formData.color ||
      !formData.machineNo ||
      !formData.inspectionDate
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("scc.validationErrorBasicMachine"),
        "warning"
      );
      return;
    }
    // Add any other crucial client-side validation here
    onFormSubmit("DailyTesting"); // Pass the formType
  };

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

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

      {/* Row 1: Date, MO No, Machine No */}
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
            id="dailyTestInspectionDate"
          />
        </div>
        <div className="relative">
          <label htmlFor="dailyTestMoNoSearch" className={labelClasses}>
            {t("scc.moNo")}
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="dailyTestMoNoSearch"
              ref={moNoInputRef}
              value={moNoSearch}
              onChange={(e) => setMoNoSearch(e.target.value)}
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
          <label htmlFor="dailyTestMachineNo" className={labelClasses}>
            {t("sccdaily.machineNo")}
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              id="dailyTestMachineNo"
              ref={machineNoInputRef}
              value={machineNoSearch}
              onChange={(e) => {
                setMachineNoSearch(e.target.value);
                setShowMachineNoDropdown(true);
              }}
              onFocus={() => setShowMachineNoDropdown(true)}
              placeholder={t("sccdaily.selectOrTypeMachine")}
              className={inputFieldClasses}
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
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
                    {t("sccdaily.noMachineMatch")}
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
                    inputMode="numeric"
                    value={formData.standardSpecifications?.tempC || ""}
                    onChange={(e) => handleSpecChange("tempC", e.target.value)}
                    className={inputFieldTableClasses}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.standardSpecifications?.timeSec || ""}
                    onChange={(e) =>
                      handleSpecChange("timeSec", e.target.value)
                    }
                    className={inputFieldTableClasses}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    inputMode="numeric"
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

      {/* Number of Rejections Input */}
      <div className="mt-8">
        <label htmlFor="numberOfRejections" className={labelClasses}>
          {t("sccdaily.numberOfRejections", "Number of Rejections")}
        </label>
        <input
          type="number"
          id="numberOfRejections"
          name="numberOfRejections"
          inputMode="numeric" // For number pad on mobile
          value={formData.numberOfRejections || 0}
          onChange={handleNumberOfRejectionsChange}
          className={`${inputFieldClasses} w-full sm:w-1/3 md:w-1/4`}
          min="0"
          max="5" // Example max
        />
      </div>

      {/* Parameter Adjustment Section */}
      {formData.numberOfRejections > 0 && (
        <div className="mt-6">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              {t(
                "sccdaily.parameterAdjustmentTitle",
                "Parameter Adjustment Records"
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {t(
                  "sccdaily.provideAdjustmentDataPrompt",
                  "Provide adjustment data?"
                )}
              </span>
              <button
                type="button"
                onClick={() => setProvideAdjustmentData(true)}
                className={`px-3 py-1 text-xs rounded-md ${
                  provideAdjustmentData
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {t("scc.yes", "Yes")}
              </button>
              <button
                type="button"
                onClick={() => setProvideAdjustmentData(false)}
                className={`px-3 py-1 text-xs rounded-md ${
                  !provideAdjustmentData
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {t("scc.no", "No")}
              </button>
            </div>
          </div>

          {provideAdjustmentData &&
            (formData.parameterAdjustmentRecords || []).length > 0 && (
              <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r"
                        >
                          {t("sccdaily.rejectionNo", "Rej. No")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r"
                        >
                          {t("sccdaily.adjustedTemp", "Adj. Temp (°C)")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r"
                        >
                          {t("sccdaily.adjustedTime", "Adj. Time (sec)")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                        >
                          {t("sccdaily.adjustedPressure", "Adj. Pressure")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(formData.parameterAdjustmentRecords || []).map(
                        (record, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-center border-r text-sm">
                              {record.rejectionNo}
                            </td>
                            <td className="px-2 py-1 border-r">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedTempC",
                                      "decrement"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={record.adjustedTempC || ""}
                                  onChange={(e) =>
                                    handleAdjustmentRecordChange(
                                      index,
                                      "adjustedTempC",
                                      e.target.value
                                    )
                                  }
                                  className={`${inputFieldTableClasses} w-20 text-center`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedTempC",
                                      "increment"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 py-1 border-r">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedTimeSec",
                                      "decrement"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={record.adjustedTimeSec || ""}
                                  onChange={(e) =>
                                    handleAdjustmentRecordChange(
                                      index,
                                      "adjustedTimeSec",
                                      e.target.value
                                    )
                                  }
                                  className={`${inputFieldTableClasses} w-20 text-center`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedTimeSec",
                                      "increment"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 py-1">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedPressure",
                                      "decrement"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={record.adjustedPressure || ""}
                                  onChange={(e) =>
                                    handleAdjustmentRecordChange(
                                      index,
                                      "adjustedPressure",
                                      e.target.value
                                    )
                                  }
                                  className={`${inputFieldTableClasses} w-20 text-center`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdjustmentIncrementDecrement(
                                      index,
                                      "adjustedPressure",
                                      "increment"
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          {!provideAdjustmentData && (
            <p className="text-sm text-gray-500 italic py-2">
              {t(
                "sccdaily.adjustmentDataSkipped",
                "Parameter adjustment data will not be saved."
              )}
            </p>
          )}
        </div>
      )}

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
            placeholder={t("sccdaily.remarksPlaceholder")}
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
          imageType="afterWashDaily" // Pass a unique identifier if needed by SCCImageUpload
        />
      </div>

      {/* Submit Button */}
      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleActualSubmit}
          disabled={
            isSubmitting ||
            !formData.moNo ||
            !formData.color ||
            !formData.machineNo
          }
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
