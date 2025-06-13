import axios from "axios";
import {
  ChevronDown,
  Info,
  Loader2,
  Minus,
  Plus,
  Search,
  UserCircle2
} from "lucide-react";
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
        "API_BASE_URL is not valid for operator image paths, using path directly:",
        facePhotoPath
      );
      return facePhotoPath;
    }
  }
  console.warn("Unhandled operator face_photo path format:", facePhotoPath);
  return facePhotoPath;
};

const inputBaseClasses =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
const inputFieldTableClasses =
  "w-full p-1.5 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500";
const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";

const SCCDailyTesting = ({
  formData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [provideAdjustmentData, setProvideAdjustmentData] = useState(
    (formData.parameterAdjustmentRecords &&
      formData.parameterAdjustmentRecords.length > 0) ||
      formData.numberOfRejections > 0
  );

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  const [machineNoSearch, setMachineNoSearch] = useState(
    formData.machineNo || ""
  );
  const [machineNoOptionsInternal, setMachineNoOptionsInternal] = useState([]); // For the dropdown suggestions
  const [showMachineNoDropdown, setShowMachineNoDropdown] = useState(false);

  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [existingRecordLoading, setExistingRecordLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState("");

  const [operatorDisplayData, setOperatorDisplayData] = useState(
    formData.operatorData || null
  );
  const [operatorLoading, setOperatorLoading] = useState(false);

  const moNoInputRef = useRef(null);
  const machineNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const machineNoDropdownRef = useRef(null);

  // Machine numbers for Daily Testing (HT only: 1-15)
  const htMachineOptions = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => String(i + 1));
  }, []);

  useEffect(() => {
    setMachineNoOptionsInternal(htMachineOptions);
  }, [htMachineOptions]);

  const filteredMachineOptions = machineNoOptionsInternal.filter((machine) =>
    machine.toLowerCase().includes(String(machineNoSearch).toLowerCase())
  );

  // Fetch Operator Data - Simplified for HT only
  useEffect(() => {
    const fetchOperator = async () => {
      if (!formData.machineNo) {
        setOperatorDisplayData(null);
        if (formData.operatorData !== null) {
          onFormDataChange({ ...formData, operatorData: null });
        }
        return;
      }

      const operatorTypeForAPI = "ht"; // Always HT for Daily Testing as per new requirement

      setOperatorLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/${operatorTypeForAPI}/${formData.machineNo}`
        );
        const fetchedOpData = response.data?.data || null;
        setOperatorDisplayData(fetchedOpData);
        if (
          JSON.stringify(formData.operatorData) !==
          JSON.stringify(fetchedOpData)
        ) {
          onFormDataChange({ ...formData, operatorData: fetchedOpData });
        }
      } catch (error) {
        setOperatorDisplayData(null);
        if (formData.operatorData !== null) {
          onFormDataChange({ ...formData, operatorData: null });
        }
        if (
          !(
            error.response?.status === 404 &&
            error.response?.data?.message === "OPERATOR_NOT_FOUND"
          )
        ) {
          console.error(
            `Error fetching ${operatorTypeForAPI} operator data for machine ${formData.machineNo}:`,
            error
          );
        }
      } finally {
        setOperatorLoading(false);
      }
    };

    fetchOperator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.machineNo]); // Only depends on machineNo now

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
      setShowMoNoDropdown(response.data?.length > 0);
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
    onFormDataChange((prevFormData) => ({
      ...prevFormData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      _id: null,
      standardSpecifications: { tempC: "", timeSec: "", pressure: "" },
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending",
      afterWashImageFile: null,
      afterWashImageUrl: null,
      remarks: ""
    }));
    setShowMoNoDropdown(false);
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  const handleMachineSelect = (selectedMachine) => {
    setMachineNoSearch(selectedMachine);
    onFormDataChange((prevFormData) => ({
      ...prevFormData,
      machineNo: selectedMachine,
      _id: null,
      operatorData: null,
      standardSpecifications: { tempC: "", timeSec: "", pressure: "" },
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending",
      afterWashImageFile: null,
      afterWashImageUrl: null
    }));
    setShowMachineNoDropdown(false);
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

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
  }, [formData.moNo]);

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
            inspectionDate: new Date(formData.inspectionDate).toISOString()
          }
        }
      );
      const specs = response.data?.data;
      onFormDataChange((prev) => ({
        ...prev,
        standardSpecifications: {
          tempC: specs?.tempC || "",
          timeSec: specs?.timeSec || "",
          pressure: specs?.pressure || ""
        }
      }));
      if (!specs) console.log(t("sccdaily.specsNotFoundLog"));
    } catch (error) {
      console.error(t("sccdaily.errorFetchingSpecsLog"), error);
      onFormDataChange((prev) => ({
        ...prev,
        standardSpecifications: { tempC: "", timeSec: "", pressure: "" }
      }));
    } finally {
      setSpecsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moNo, formData.color, formData.inspectionDate, t]); // Removed onFormDataChange

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
              inspectionDate: new Date(formData.inspectionDate).toISOString()
            }
          }
        );
        const recordData = response.data;
        const actualRecord = recordData.data
          ? recordData.data
          : recordData.message
          ? null
          : recordData;

        if (
          !actualRecord ||
          recordData.message === "DAILY_TESTING_RECORD_NOT_FOUND"
        ) {
          setRecordStatusMessage(t("sccdaily.newRecordMessage"));
          onFormDataChange((prev) => ({
            ...prev,
            _id: null,
            numberOfRejections: 0,
            parameterAdjustmentRecords: [],
            finalResult: "Pending",
            afterWashImageUrl: null,
            afterWashImageFile: null,
            remarks: prev.remarks || ""
            // operatorData is handled by its own effect
          }));
          setProvideAdjustmentData(true);
          fetchStandardSpecs();
        } else {
          setRecordStatusMessage(t("sccdaily.existingRecordLoadedShort"));
          onFormDataChange((prev) => ({
            ...prev,
            _id: actualRecord._id,
            standardSpecifications: actualRecord.standardSpecifications || {
              tempC: "",
              timeSec: "",
              pressure: ""
            },
            numberOfRejections: actualRecord.numberOfRejections || 0,
            parameterAdjustmentRecords: (
              actualRecord.parameterAdjustmentRecords || []
            ).map((rec) => ({
              ...rec,
              adjustedTempC:
                rec.adjustedTempC != null ? String(rec.adjustedTempC) : "",
              adjustedTimeSec:
                rec.adjustedTimeSec != null ? String(rec.adjustedTimeSec) : "",
              adjustedPressure:
                rec.adjustedPressure != null ? String(rec.adjustedPressure) : ""
            })),
            finalResult: actualRecord.finalResult || "Pending",
            afterWashImageUrl: actualRecord.afterWashImage,
            remarks:
              actualRecord.remarks === "NA" ? "" : actualRecord.remarks || "",
            operatorData: actualRecord.operatorData || prev.operatorData || null
          }));
          setProvideAdjustmentData(
            (actualRecord.parameterAdjustmentRecords || []).length > 0
          );
          if (actualRecord.operatorData) {
            setOperatorDisplayData(actualRecord.operatorData);
          }
          if (
            !actualRecord.standardSpecifications?.tempC &&
            actualRecord.moNo &&
            actualRecord.color &&
            actualRecord.inspectionDate
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
      fetchStandardSpecs();
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
    fetchStandardSpecs
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValues = { [name]: value };
    if (name === "moNo" || name === "machineNo" || name === "color") {
      newValues._id = null;
      setRecordStatusMessage("");
      if (name === "moNo") {
        setMoNoSearch(value);
        newValues.color = "";
        newValues.buyer = "";
        newValues.buyerStyle = "";
        setAvailableColors([]);
      }
      newValues.numberOfRejections = 0;
      newValues.parameterAdjustmentRecords = [];
      setProvideAdjustmentData(true);
      newValues.finalResult = "Pending";
    }
    onFormDataChange({ ...formData, ...newValues });
  };

  const handleDateChange = (date) => {
    onFormDataChange({
      ...formData,
      inspectionDate: date,
      _id: null,
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending"
    });
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  const handleColorChange = (e) => {
    onFormDataChange({
      ...formData,
      color: e.target.value,
      _id: null,
      numberOfRejections: 0,
      parameterAdjustmentRecords: [],
      finalResult: "Pending"
    });
    setRecordStatusMessage("");
    setProvideAdjustmentData(true);
  };

  const handleSpecChange = (field, value) => {
    onFormDataChange((prev) => ({
      ...prev,
      standardSpecifications: { ...prev.standardSpecifications, [field]: value }
    }));
  };

  const handleNumberOfRejectionsChange = (e) => {
    let numRejections = parseInt(e.target.value, 10);
    if (isNaN(numRejections) || numRejections < 0) numRejections = 0;
    if (numRejections > 5) numRejections = 5;

    const newAdjustmentRecords = [];
    if (provideAdjustmentData) {
      for (let i = 1; i <= numRejections; i++) {
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
      finalResult: numRejections > 0 ? "Reject" : "Pass"
    });
  };

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
        const standardField = field.replace("adjusted", "").toLowerCase();
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
      if (action === "decrement") currentValue = Math.max(0, currentValue - 1);
      updatedRecords[index][field] = String(currentValue);
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

  useEffect(() => {
    if (!provideAdjustmentData) {
      if (formData.parameterAdjustmentRecords?.length > 0) {
        onFormDataChange((prev) => ({
          ...prev,
          parameterAdjustmentRecords: []
        }));
      }
    } else {
      const numRejections = formData.numberOfRejections || 0;
      if (
        numRejections > 0 &&
        (!formData.parameterAdjustmentRecords ||
          formData.parameterAdjustmentRecords.length !== numRejections)
      ) {
        const newAdjustmentRecords = [];
        for (let i = 1; i <= numRejections; i++) {
          const existingRec = (formData.parameterAdjustmentRecords || [])[
            i - 1
          ];
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
        onFormDataChange((prev) => ({
          ...prev,
          parameterAdjustmentRecords: newAdjustmentRecords
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    provideAdjustmentData,
    formData.numberOfRejections,
    formData.standardSpecifications
  ]);

  const handleActualSubmit = () => {
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
    // The formData prop passed to onFormSubmit will now include operatorData if it was set
    onFormSubmit("DailyTesting", formData);
  };

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-xl font-semibold text-gray-800">
        {t("sccdaily.formTitle")}
      </h2>

      {(orderDetailsLoading ||
        existingRecordLoading ||
        specsLoading ||
        operatorLoading) && (
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-6 gap-y-4 items-start">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
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
              className={`${inputFieldClasses} py-1.5`}
              required
              popperPlacement="bottom-start"
              id="dailyTestInspectionDate"
            />
          </div>
          <div className="relative">
            <label htmlFor="dailyTestMoNoSearch" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <div className="relative mt-0.5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="dailyTestMoNoSearch"
                ref={moNoInputRef}
                value={moNoSearch}
                onChange={(e) => setMoNoSearch(e.target.value)}
                onFocus={() => setShowMoNoDropdown(moNoOptions.length > 0)}
                placeholder={t("scc.searchMoNo")}
                className={`${inputFieldClasses} pl-9 py-1.5`}
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
            <div className="relative mt-0.5">
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
                className={`${inputFieldClasses} py-1.5`}
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
          <div>
            <label className={labelClasses}>{t("scc.buyer")}</label>
            <input
              type="text"
              value={formData.buyer || ""}
              readOnly
              className={`${inputFieldReadonlyClasses} py-1.5`}
            />
          </div>
          <div>
            <label className={labelClasses}>{t("scc.buyerStyle")}</label>
            <input
              type="text"
              value={formData.buyerStyle || ""}
              readOnly
              className={`${inputFieldReadonlyClasses} py-1.5`}
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
              className={`${inputFieldClasses} py-1.5`}
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

        <div className="xl:col-span-1 lg:max-w-[220px] md:max-w-xs w-full">
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
                  {t("sccdaily.temperature")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-gray-200"
                >
                  {t("sccdaily.time")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                >
                  {t("sccdaily.pressure")}
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

      <div className="mt-8">
        <label htmlFor="numberOfRejections" className={labelClasses}>
          {t("sccdaily.numberOfRejections")}
        </label>
        <input
          type="number"
          id="numberOfRejections"
          name="numberOfRejections"
          inputMode="numeric"
          value={formData.numberOfRejections || 0}
          onChange={handleNumberOfRejectionsChange}
          className={`${inputFieldClasses} w-full sm:w-1/3 md:w-1/4 py-1.5`}
          min="0"
          max="5"
        />
      </div>

      {formData.numberOfRejections > 0 && (
        <div className="mt-6">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              {t("sccdaily.parameterAdjustmentTitle")}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {t("sccdaily.provideAdjustmentDataPrompt")}
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
                {t("scc.yes")}
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
                {t("scc.no")}
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
                          {t("sccdaily.rejectionNo")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r"
                        >
                          {t("sccdaily.adjustedTemp")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-r"
                        >
                          {t("sccdaily.adjustedTime")}
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                        >
                          {t("sccdaily.adjustedPressure")}
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
              {t("sccdaily.adjustmentDataSkipped")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start mt-8">
        <div>
          <label htmlFor="finalResult" className={labelClasses}>
            {t("sccdaily.finalResult")}
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
            } py-1.5`}
          >
            <option value="Pending">{t("sccdaily.pending")}</option>
            <option value="Pass">{t("scc.pass")}</option>
            <option value="Reject">{t("scc.reject")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="dailyTestRemarks" className={labelClasses}>
            {t("sccdaily.remarks")}
          </label>
          <textarea
            id="dailyTestRemarks"
            name="remarks"
            rows="2"
            maxLength="150"
            value={formData.remarks || ""}
            onChange={handleInputChange}
            className={`${inputFieldClasses} py-1.5`}
            placeholder={t("sccdaily.remarksPlaceholder")}
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 text-right">
            {(formData.remarks || "").length} / 150 {t("scc.characters")}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <SCCImageUpload
          label={t("sccdaily.afterWashImage")}
          onImageChange={(file, url) =>
            handleImageChange("afterWashDaily", file, url)
          }
          onImageRemove={handleImageRemove}
          initialImageUrl={formData.afterWashImageUrl}
          imageType="afterWashDaily"
        />
      </div>

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
