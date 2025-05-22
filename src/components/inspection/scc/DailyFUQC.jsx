import axios from "axios";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Minus,
  Plus,
  Search,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  { key: "14:00", label: "2.00", inspectionNo: 4 },
  { key: "16:00", label: "4.00", inspectionNo: 5 },
  { key: "18:00", label: "6.00", inspectionNo: 6 }
];

const MACHINE_NUMBERS = ["001", "002", "003", "004", "005"];

const initialSlotData = {
  inspectionNo: 0,
  timeSlotKey: "",
  temp_req: null,
  temp_actual: null,
  temp_isNA: false,
  result: "Pending" // "Pending", "Pass", "Reject"
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
      remarks: formData.remarks || ""
    };
  });

  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableMachineRecords, setAvailableMachineRecords] = useState([]);

  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [baseTempLoading, setBaseTempLoading] = useState(false);
  const [existingQCRecordLoading, setExistingQCRecordLoading] = useState(false);
  const [recordStatusMessage, setRecordStatusMessage] = useState("");
  const [currentActiveSlotKey, setCurrentActiveSlotKey] = useState(null);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);

  useEffect(() => {
    setMoNoSearch(formData.moNo || "");
    const newSlotsDetailed = TIME_SLOTS_CONFIG.reduce((acc, slotConf) => {
      const existingInsp = formData.inspections?.find(
        (i) => i.timeSlotKey === slotConf.key
      );
      if (existingInsp) {
        acc[slotConf.key] = {
          ...initialSlotData, // Start with initialSlotData defaults
          ...existingInsp, // Overlay with existing inspection data
          temp_req:
            existingInsp.temp_req !== null
              ? Number(existingInsp.temp_req)
              : null,
          // Ensure temp_actual is also handled
          temp_actual:
            existingInsp.temp_actual !== null
              ? Number(existingInsp.temp_actual)
              : null
        };
      } else {
        acc[slotConf.key] = {
          ...initialSlotData,
          inspectionNo: slotConf.inspectionNo,
          timeSlotKey: slotConf.key
        };
      }
      return acc;
    }, {});

    setLocalFormData((prev) => ({
      ...prev,
      ...formData,
      slotsDetailed: newSlotsDetailed,
      remarks: formData.remarks || ""
    }));
  }, [formData]);

  const updateParentFormData = useCallback(
    (updatedLocalData) => {
      const inspectionsArray = Object.values(updatedLocalData.slotsDetailed)
        .filter(
          (slot) =>
            slot.result !== "Pending" ||
            slot.temp_isNA ||
            slot.temp_actual !== null || // Include if actual temp is recorded
            slot.temp_req !== null
        )
        .map((slot) => ({
          inspectionNo: slot.inspectionNo,
          timeSlotKey: slot.timeSlotKey,
          temp_req: slot.temp_req !== null ? Number(slot.temp_req) : null,
          temp_actual:
            slot.temp_actual !== null ? Number(slot.temp_actual) : null,
          temp_isNA: slot.temp_isNA,
          result: slot.result
        }));

      onFormDataChange({
        _id: updatedLocalData._id,
        inspectionDate: updatedLocalData.inspectionDate,
        machineNo: updatedLocalData.machineNo,
        moNo: updatedLocalData.moNo,
        buyer: updatedLocalData.buyer,
        buyerStyle: updatedLocalData.buyerStyle,
        color: updatedLocalData.color,
        // This is the overall baseReqTemp for the form
        baseReqTemp:
          updatedLocalData.baseReqTemp !== null
            ? Number(updatedLocalData.baseReqTemp)
            : null,
        inspections: inspectionsArray,
        remarks: updatedLocalData.remarks
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
        timeSlotKey: slot.key,
        // When resetting, if baseReqTemp is available, apply it
        temp_req: currentLocalData.baseReqTemp,
        temp_actual: currentLocalData.baseReqTemp // Also default actual to req
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
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData); // This will use newLocalData.baseReqTemp (which is null)
      setMoNoSearch("");
      setAvailableColors([]);
      setAvailableMachineRecords([]);
      setCurrentActiveSlotKey(null);
      setRecordStatusMessage("");
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
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setMoNoSearch("");
      setAvailableColors([]);
      setAvailableMachineRecords([]);
      setCurrentActiveSlotKey(null);
      setRecordStatusMessage("");
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
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setRecordStatusMessage("");
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
    if (localFormData.moNo) fetchOrderDetails();
    else {
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
        remarks: "",
        inspections: []
      };
      newLocalData = resetLocalDetailedSlots(newLocalData);
      setRecordStatusMessage("");
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const handleRemarksChange = (e) => {
    const newRemarks = e.target.value;
    setLocalFormData((prev) => {
      const newLocalData = { ...prev, remarks: newRemarks };
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
          const slotKeyToUpdate =
            activeSlotKeyForUpdate ||
            (TIME_SLOTS_CONFIG[0] ? TIME_SLOTS_CONFIG[0].key : null);

          if (slotKeyToUpdate && updatedSlotsDetailed[slotKeyToUpdate]) {
            const slot = updatedSlotsDetailed[slotKeyToUpdate];
            slot.temp_req = newBaseReqTemp;
            if (!slot.temp_isNA && slot.temp_actual === null) {
              // Auto-fill actual if not NA and not yet set
              slot.temp_actual = newBaseReqTemp;
            }
          }
          // Also update all other non-submitted slots if this is the first fetch
          TIME_SLOTS_CONFIG.forEach((config) => {
            if (
              updatedSlotsDetailed[config.key] &&
              updatedSlotsDetailed[config.key].result === "Pending"
            ) {
              // only for pending slots
              updatedSlotsDetailed[config.key].temp_req = newBaseReqTemp;
              if (
                !updatedSlotsDetailed[config.key].temp_isNA &&
                updatedSlotsDetailed[config.key].temp_actual === null
              ) {
                updatedSlotsDetailed[config.key].temp_actual = newBaseReqTemp;
              }
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
          const newLocalData = { ...prevLocalData, baseReqTemp: null };
          // Potentially clear temp_req from slots or handle as error display
          updateParentFormData(newLocalData);
          return newLocalData;
        });
      } finally {
        setBaseTempLoading(false);
      }
    },
    [t, updateParentFormData]
  );

  useEffect(() => {
    // Auto-fetch base temp when MO/Color/Date are ready, for the current active slot
    if (
      currentActiveSlotKey &&
      localFormData.slotsDetailed &&
      localFormData.slotsDetailed[currentActiveSlotKey] &&
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
    currentActiveSlotKey,
    localFormData.moNo,
    localFormData.color,
    localFormData.inspectionDate,
    fetchBaseTemperature
  ]);

  useEffect(() => {
    // Apply baseReqTemp to current active slot's temp_req and temp_actual (if applicable)
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
        // If actual is null and not N/A, default it to req temp
        if (slotToUpdate.temp_actual === null && !slotToUpdate.temp_isNA) {
          slotToUpdate.temp_actual = prevLocalData.baseReqTemp;
          hasChanged = true;
        }

        if (hasChanged) {
          const newSlotsDetailedState = {
            ...currentSlotsDetailed,
            [currentActiveSlotKey]: slotToUpdate
          };
          // No updateParentFormData here to prevent loops, parent is updated on explicit actions or submit
          return { ...prevLocalData, slotsDetailed: newSlotsDetailedState };
        }
        return prevLocalData;
      });
    }
  }, [currentActiveSlotKey, localFormData.baseReqTemp]); // Removed slotsDetailed from deps

  const fetchDailyFUQCData = useCallback(
    async (
      currentMoNo,
      currentColor,
      currentInspectionDate,
      currentMachineNo
    ) => {
      if (!currentInspectionDate || !currentMachineNo) return;
      setExistingQCRecordLoading(true);
      setRecordStatusMessage("");
      let baseTempShouldBeFetched = false;
      let moForBaseTemp = currentMoNo;
      let colorForBaseTemp = currentColor;
      let dateForBaseTemp = currentInspectionDate;
      let activeSlotForBaseTempUpdate = null; // Determine after fetching

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
          `${API_BASE_URL}/api/scc/daily-fuqc-test`,
          { params }
        );
        const { message, data } = response.data;

        if (
          message === "DAILY_FUQC_RECORD_NOT_FOUND" ||
          (message === "NO_RECORDS_FOR_DATE_MACHINE" && !params.moNo)
        ) {
          setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
          const firstSlotKey = TIME_SLOTS_CONFIG[0]
            ? TIME_SLOTS_CONFIG[0].key
            : null;
          activeSlotForBaseTempUpdate = firstSlotKey;
          setCurrentActiveSlotKey(firstSlotKey);

          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              _id: null,
              inspections: [],
              baseReqTemp: prev.baseReqTemp, // Keep current baseReqTemp if already fetched
              remarks: ""
            };
            // Reset slots, but try to preserve/apply existing baseReqTemp
            const tempForReset = newLocalState.baseReqTemp;
            newLocalState = resetLocalDetailedSlots(newLocalState); // This will apply current baseReqTemp if available
            if (tempForReset !== null) {
              // re-apply if resetLocalDetailedSlots didn't catch it due to prev state
              Object.keys(newLocalState.slotsDetailed).forEach((key) => {
                newLocalState.slotsDetailed[key].temp_req = tempForReset;
                if (
                  !newLocalState.slotsDetailed[key].temp_isNA &&
                  newLocalState.slotsDetailed[key].temp_actual === null
                ) {
                  newLocalState.slotsDetailed[key].temp_actual = tempForReset;
                }
              });
            }
            return newLocalState;
          });
          if (params.moNo && params.color) baseTempShouldBeFetched = true; // Fetch if this is a specific new record
        } else if (message === "RECORD_FOUND" && data) {
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
                      : null
                }
              : {
                  ...initialSlotData,
                  inspectionNo: slotConf.inspectionNo,
                  timeSlotKey: slotConf.key,
                  temp_req: data.baseReqTemp,
                  temp_actual: data.baseReqTemp
                }; // Default new slots with baseReqTemp
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
          const newActiveSlotKey = activeSlotConfig
            ? activeSlotConfig.key
            : null;
          activeSlotForBaseTempUpdate = newActiveSlotKey;
          setCurrentActiveSlotKey(newActiveSlotKey);

          setLocalFormData((prev) => ({
            ...prev,
            _id: data._id,
            moNo: data.moNo,
            buyer: data.buyer,
            buyerStyle: data.buyerStyle,
            color: data.color,
            baseReqTemp:
              data.baseReqTemp !== null ? Number(data.baseReqTemp) : null,
            remarks: data.remarks || "",
            inspections: data.inspections || [],
            slotsDetailed: populatedSlots
          }));
          setMoNoSearch(data.moNo || "");
          moForBaseTemp = data.moNo;
          colorForBaseTemp = data.color;
          if (data.baseReqTemp === null && data.moNo && data.color)
            baseTempShouldBeFetched = true;
        } else if (message === "MULTIPLE_MO_COLOR_FOUND" && data.length > 0) {
          setRecordStatusMessage(t("sccDailyFUQC.selectMoColor"));
          setAvailableMachineRecords(data);
          setCurrentActiveSlotKey(null);
          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              moNo: "",
              color: "",
              buyer: "",
              buyerStyle: "",
              _id: null,
              baseReqTemp: null,
              remarks: "",
              inspections: []
            };
            newLocalState = resetLocalDetailedSlots(newLocalState);
            updateParentFormData(newLocalState); // Update parent since these fields are cleared
            return newLocalState;
          });
          setMoNoSearch("");
        } else {
          // Fallback for other messages or unexpected structure
          setRecordStatusMessage(t("sccDailyFUQC.newRecord"));
          const firstSlotKey = TIME_SLOTS_CONFIG[0]
            ? TIME_SLOTS_CONFIG[0].key
            : null;
          activeSlotForBaseTempUpdate = firstSlotKey;
          setCurrentActiveSlotKey(firstSlotKey);
          setLocalFormData((prev) => {
            let newLocalState = {
              ...prev,
              _id: null,
              inspections: [],
              remarks: "",
              baseReqTemp: prev.baseReqTemp
            };
            const tempForReset = newLocalState.baseReqTemp;
            newLocalState = resetLocalDetailedSlots(newLocalState);
            if (tempForReset !== null) {
              Object.keys(newLocalState.slotsDetailed).forEach((key) => {
                newLocalState.slotsDetailed[key].temp_req = tempForReset;
                if (
                  !newLocalState.slotsDetailed[key].temp_isNA &&
                  newLocalState.slotsDetailed[key].temp_actual === null
                ) {
                  newLocalState.slotsDetailed[key].temp_actual = tempForReset;
                }
              });
            }
            return newLocalState;
          });
          if (params.moNo && params.color) baseTempShouldBeFetched = true;
        }

        if (
          baseTempShouldBeFetched &&
          moForBaseTemp &&
          colorForBaseTemp &&
          dateForBaseTemp
        ) {
          fetchBaseTemperature(
            moForBaseTemp,
            colorForBaseTemp,
            dateForBaseTemp,
            activeSlotForBaseTempUpdate
          );
        }
      } catch (error) {
        console.error(t("sccDailyFUQC.errorLoadingRecord"), error);
        Swal.fire(
          t("scc.error"),
          t("sccDailyFUQC.errorLoadingRecordMsg"),
          "error"
        );
      } finally {
        setExistingQCRecordLoading(false);
      }
    },
    [t, fetchBaseTemperature, updateParentFormData]
  ); // Removed currentActiveSlotKey from deps, it's set inside

  useEffect(() => {
    if (localFormData.inspectionDate && localFormData.machineNo) {
      // If moNo and color are also set, fetch specifically for them
      // Otherwise, fetchDailyFUQCData will handle the case of fetching available MOs or a new record for date/machine
      fetchDailyFUQCData(
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
    fetchDailyFUQCData
  ]);

  const handleSlotActualTempChange = (slotKey, value) => {
    setLocalFormData((prev) => {
      const newSlotsDetailed = { ...prev.slotsDetailed };
      const slot = { ...newSlotsDetailed[slotKey] };
      if (!slot || slot.temp_isNA) return prev;

      slot.temp_actual = value === "" || value === null ? null : Number(value);
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
        slot.result = "Pending"; // Reset result if temp is N/A
      } else {
        // If un-marking N/A, restore actual to req if actual is null
        slot.temp_actual =
          slot.temp_actual === null ? slot.temp_req : slot.temp_actual;
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
      if (!slot || slot.temp_isNA) return prev; // Cannot set result if temp is N/A

      slot.result = resultValue;
      newSlotsDetailed[slotKey] = slot;
      const newLocalData = { ...prev, slotsDetailed: newSlotsDetailed };
      updateParentFormData(newLocalData);
      return newLocalData;
    });
  };

  const getCellBGFromResult = (result) => {
    if (result === "Pass") return "bg-green-100 text-green-700";
    if (result === "Reject") return "bg-red-100 text-red-700";
    return "bg-white";
  };
  const getCellBGForNA = (isNA) => {
    return isNA ? "bg-gray-200 text-gray-500" : "";
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
      // Check if req temp is loaded
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
      // Only require result if not N/A
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
        result: activeSlotData.temp_isNA ? "N/A" : activeSlotData.result // If NA, result is N/A conceptually
      }
    };
    onFormSubmit(formType, payloadForParent);
  };

  const loading =
    orderDetailsLoading || baseTempLoading || existingQCRecordLoading;

  const renderCurrentSlotTable = () => {
    if (!currentActiveSlotKey) return null;
    const currentSlot = localFormData.slotsDetailed[currentActiveSlotKey];
    if (!currentSlot) return null;

    const slotConfig = TIME_SLOTS_CONFIG.find(
      (s) => s.key === currentActiveSlotKey
    );

    return (
      <div className="border border-gray-300 rounded-md shadow-sm bg-white">
        <h3 className="text-md font-semibold text-gray-700 px-3 py-2 bg-gray-100">
          {t("sccDailyFUQC.currentInspectionSlot")}: {slotConfig.label} (#
          {slotConfig.inspectionNo})
        </h3>
        <table className="min-w-full divide-y divide-gray-300 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-300 w-1/3">
                {t("sccDailyFUQC.reqTemp")} (°C)
              </th>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-300 w-1/3">
                {slotConfig.label} ({t("sccDailyFUQC.actualTemp")}, °C)
              </th>
              <th className="px-3 py-2.5 text-center font-semibold text-gray-800 w-1/3">
                {t("sccDailyFUQC.result")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2.5 border border-gray-300 text-center">
                {currentSlot.temp_req !== null ? (
                  currentSlot.temp_req
                ) : baseTempLoading ? (
                  <Loader2 size={14} className="animate-spin inline-block" />
                ) : (
                  "N/A"
                )}
              </td>
              <td
                className={`px-1 py-2 border border-gray-300 text-center ${getCellBGForNA(
                  currentSlot.temp_isNA
                )}`}
              >
                {currentSlot.temp_isNA ? (
                  <span className="italic text-gray-500">
                    {t("scc.na", "N/A")}
                  </span>
                ) : (
                  <input
                    type="number"
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
                          onClick={() =>
                            handleSlotTempIncrementDecrement(
                              currentActiveSlotKey,
                              "decrement"
                            )
                          }
                          className="p-1 hover:bg-gray-300 rounded disabled:opacity-50"
                          type="button"
                          disabled={
                            currentSlot.temp_isNA ||
                            (currentSlot.temp_req === null && !baseTempLoading)
                          }
                        >
                          {" "}
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleSlotTempIncrementDecrement(
                              currentActiveSlotKey,
                              "increment"
                            )
                          }
                          className="p-1 hover:bg-gray-300 rounded disabled:opacity-50"
                          type="button"
                          disabled={
                            currentSlot.temp_isNA ||
                            (currentSlot.temp_req === null && !baseTempLoading)
                          }
                        >
                          {" "}
                          <Plus size={14} />
                        </button>
                      </>
                    )}
                  <button
                    onClick={() => toggleSlotTempNA(currentActiveSlotKey)}
                    className="p-1 hover:bg-gray-300 rounded disabled:opacity-50"
                    type="button"
                    disabled={
                      currentSlot.temp_req === null &&
                      !baseTempLoading &&
                      !currentSlot.temp_isNA
                    } // Disable if no req temp unless already NA
                  >
                    {currentSlot.temp_isNA ? (
                      <EyeOff size={14} className="text-gray-500" />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </div>
              </td>
              <td
                className={`px-1 py-2 border border-gray-300 text-center ${getCellBGFromResult(
                  currentSlot.result
                )}`}
              >
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
    const submittedInspections = (formData.inspections || [])
      .filter(
        (insp) =>
          insp.result !== "Pending" ||
          insp.temp_isNA ||
          insp.temp_actual !== null
      ) // Show if it has a result OR isNA OR has actual_temp
      .sort((a, b) => a.inspectionNo - b.inspectionNo);

    if (submittedInspections.length === 0) return null;

    return (
      <div className="border border-gray-300 rounded-md shadow-sm bg-white mt-5">
        <h3 className="text-md font-semibold text-gray-700 px-3 py-2 bg-gray-100">
          {t("sccDailyFUQC.previousRecords")}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-800 border-r border-gray-300 sticky left-0 bg-gray-100 z-10 min-w-[150px]">
                  {t("sccDailyFUQC.parameter")}
                </th>
                {submittedInspections.map((insp) => (
                  <th
                    key={insp.timeSlotKey}
                    className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-300 min-w-[80px]"
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
                <td className="px-3 py-2.5 border border-gray-300 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.reqTemp")} (°C)
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-req`}
                    className="px-3 py-2.5 border border-gray-300 text-center"
                  >
                    {insp.temp_req !== null ? insp.temp_req : "N/A"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2.5 border border-gray-300 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.actualTemp")} (°C)
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-actual`}
                    className={`px-3 py-2.5 border border-gray-300 text-center ${
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
                <td className="px-3 py-2.5 border border-gray-300 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {t("sccDailyFUQC.result")}
                </td>
                {submittedInspections.map((insp) => (
                  <td
                    key={`${insp.timeSlotKey}-result`}
                    className={`px-3 py-2.5 border border-gray-300 text-center ${
                      insp.temp_isNA
                        ? "bg-gray-100 text-gray-500 italic"
                        : getCellBGFromResult(insp.result)
                    }`}
                  >
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
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">
        {t("sccDailyFUQC.title")}
      </h2>
      <p className="text-xs text-gray-600 -mt-3">
        {t("sccDailyFUQC.subtitle")}
      </p>

      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
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
            )
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          <Info size={18} className="mr-2 flex-shrink-0" />{" "}
          {recordStatusMessage}
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
          <div className="relative mt-1">
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
                htmlFor="selectExistingMoFuqc"
                className={`${labelClasses} text-xs`}
              >
                {t("sccDailyFUQC.selectExisting")}
              </label>
              <select
                id="selectExistingMoFuqc"
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  if (selectedVal) {
                    const [selectedMo, selectedColor] = selectedVal.split("|");
                    setLocalFormData((prev) => {
                      let newLocalData = {
                        ...prev,
                        moNo: selectedMo,
                        color: selectedColor,
                        _id: null,
                        baseReqTemp: null,
                        remarks: "",
                        inspections: []
                      };
                      newLocalData = resetLocalDetailedSlots(newLocalData); // This should use the new baseReqTemp which is null here
                      setMoNoSearch(selectedMo);
                      // fetchDailyFUQCData will be triggered by moNo/color change from useEffect
                      return newLocalData;
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
                    {rec.buyerStyle || t("scc.naCap", "N/A")})
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

      {localFormData.moNo && localFormData.color && (
        <div className="mt-4 space-y-5">
          {currentActiveSlotKey ? (
            renderCurrentSlotTable()
          ) : (
            <div className="text-center py-4 text-gray-500">
              {t("sccDailyFUQC.allInspectionsCompleted")}
            </div>
          )}
          {renderPreviousRecordsTable()}
          <div className="pt-3">
            <label htmlFor="fuqcRemarks" className={labelClasses}>
              {t("sccDailyFUQC.remarks")} ({t("scc.optional")})
            </label>
            <textarea
              id="fuqcRemarks"
              name="remarks"
              rows="3"
              value={localFormData.remarks || ""}
              onChange={handleRemarksChange}
              className={inputFieldClasses}
              placeholder={t("sccDailyFUQC.remarksPlaceholder")}
            ></textarea>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={handleFormActualSubmit}
          disabled={isSubmitting || !currentActiveSlotKey || loading}
          className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
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
