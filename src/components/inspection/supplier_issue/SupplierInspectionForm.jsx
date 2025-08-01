import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useReducer // Import useReducer
} from "react";
import axios from "axios";
import Select from "react-select";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import InspectionTimer from "./InspectionTimer";
import DefectBox from "./DefectBox";
import DefectRow from "./DefectRow";
import HourlyQtyTable from "./HourlyQtyTable";
import ClaimSummary from "./ClaimSummary";
import { Loader2, Save, LayoutGrid, List } from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- CONSTANTS ---
const SECONDS_PER_BUCKET = 3600;

// --- HELPER FUNCTIONS ---
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// --- REDUCER LOGIC ---

// 1. Define the initial state structure
const initialState = {
  defectCounts: {},
  hourlyQtys: {}
};

// 2. Define the reducer function
function inspectionReducer(state, action) {
  switch (action.type) {
    case "UPDATE_QUANTITIES": {
      const { defectId, change, totalTime } = action.payload;

      if (change === 0) return state;

      const newState = {
        defectCounts: { ...state.defectCounts },
        hourlyQtys: { ...state.hourlyQtys }
      };

      const oldTotalQty = newState.defectCounts[defectId] || 0;
      newState.defectCounts[defectId] = Math.max(0, oldTotalQty + change);

      const currentHourBucket = Math.min(
        8,
        Math.floor(totalTime / SECONDS_PER_BUCKET) + 1
      );

      if (currentHourBucket > 0) {
        const hourDefects = {
          ...(newState.hourlyQtys[currentHourBucket] || {})
        };
        const oldHourlyQty = hourDefects[defectId] || 0;
        hourDefects[defectId] = Math.max(0, oldHourlyQty + change);
        newState.hourlyQtys[currentHourBucket] = hourDefects;
      }

      return newState;
    }

    case "SET_QUANTITY": {
      const { defectId, newCount, totalTime } = action.payload;
      const oldCount = state.defectCounts[defectId] || 0;
      const difference = newCount - oldCount;

      if (difference === 0) return state;

      return inspectionReducer(state, {
        type: "UPDATE_QUANTITIES",
        payload: { defectId, change: difference, totalTime }
      });
    }

    case "LOAD_EXISTING_DATA": {
      return {
        defectCounts: action.payload.defectCounts || {},
        hourlyQtys: action.payload.hourlyQtys || {}
      };
    }

    case "RESET": {
      return initialState;
    }

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- MAIN COMPONENT ---
const SupplierInspectionForm = () => {
  const { user } = useAuth();
  const [defectView, setDefectView] = useState("grid");
  const [reportDate, setReportDate] = useState(new Date());
  const [moNo, setMoNo] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [factoryType, setFactoryType] = useState("");
  const [factoryName, setFactoryName] = useState(null);
  const [factoryOptions, setFactoryOptions] = useState([]);
  const [defectList, setDefectList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // --- USE REDUCER ---
  const [inspectionState, dispatch] = useReducer(
    inspectionReducer,
    initialState
  );
  const { defectCounts, hourlyQtys } = inspectionState;

  // Use a ref to pass the current time to the reducer without causing re-renders
  const totalTimeRef = useRef(totalTime);
  useEffect(() => {
    totalTimeRef.current = totalTime;
  }, [totalTime]);

  const debounce = useCallback((func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedMoSearch = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.length < 2) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term: searchTerm }
        });
        setMoNoOptions(res.data.map((m) => ({ value: m, label: m })));
      } catch (error) {
        console.error("Error searching MO:", error);
      }
    }, 300),
    [API_BASE_URL, debounce]
  );

  useEffect(() => {
    debouncedMoSearch(moNoSearch);
  }, [moNoSearch, debouncedMoSearch]);

  useEffect(() => {
    const fetchColors = async () => {
      if (!moNo?.value) {
        setColorOptions([]);
        setSelectedColors([]);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({
            value: c.original,
            label: `${c.original} (${c.chn || "N/A"})`
          }))
        );
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, [moNo, API_BASE_URL]);

  useEffect(() => {
    if (factoryType) {
      setIsLoading(true);
      axios
        .get(`${API_BASE_URL}/api/supplier-issues/defects/${factoryType}`)
        .then((res) => {
          setFactoryOptions(
            res.data.factoryList.map((f) => ({ value: f, label: f }))
          );
          setDefectList(res.data.defectList);
          setFactoryName(null);
          dispatch({ type: "RESET" }); // Reset using reducer
        })
        .catch((err) => {
          console.error(`Error fetching data for ${factoryType}`, err);
          Swal.fire(
            "Error",
            `Could not load data for ${factoryType}.`,
            "error"
          );
        })
        .finally(() => setIsLoading(false));
    } else {
      setFactoryOptions([]);
      setDefectList([]);
      setFactoryName(null);
      dispatch({ type: "RESET" }); // Reset using reducer
    }
  }, [factoryType]);

  // --- useEffect to fetch EXISTING report data when keys change ---
  const keyFieldsReady = useMemo(() => {
    return (
      reportDate &&
      user?.emp_id &&
      factoryType &&
      factoryName?.value &&
      moNo?.value &&
      selectedColors.length > 0 &&
      defectList.length > 0
    );
  }, [
    reportDate,
    user,
    factoryType,
    factoryName,
    moNo,
    selectedColors,
    defectList
  ]);

  useEffect(() => {
    const fetchExistingData = async () => {
      if (!keyFieldsReady) {
        // Reset if keys are not ready, unless we are just loading the defect list
        if (!factoryType) {
          dispatch({ type: "RESET" });
          setTotalTime(0);
        }
        return;
      }

      setIsLoadingExisting(true);
      try {
        const params = {
          reportDate: reportDate.toISOString().split("T")[0],
          inspectorId: user.emp_id,
          factoryType: factoryType,
          factoryName: factoryName.value,
          moNo: moNo.value,
          colors: selectedColors.map((c) => c.value).join(",")
        };
        const res = await axios.get(
          `${API_BASE_URL}/api/supplier-issues/reports/find-existing`,
          { params }
        );
        const report = res.data;

        // --- DATA FOUND: Populate state ---
        // 1. Transform DB defectCounts to frontend state format { defectId: qty }
        const loadedDefectCounts = {};
        report.defectCounts.forEach((dbDefect) => {
          const localDefect = defectList.find((d) => d.no === dbDefect.no);
          if (localDefect) {
            loadedDefectCounts[localDefect._id] = dbDefect.qty;
          }
        });

        // 2. Transform DB defectCountByHr to frontend hourlyQtys format
        const loadedHourlyQtys = {};
        report.defectCountByHr.forEach((hrData) => {
          loadedHourlyQtys[hrData.hour] = {};
          hrData.defects.forEach((dbDefect) => {
            const localDefect = defectList.find((d) => d.no === dbDefect.no);
            if (localDefect) {
              loadedHourlyQtys[hrData.hour][localDefect._id] = dbDefect.qty;
            }
          });
        });

        dispatch({
          type: "LOAD_EXISTING_DATA",
          payload: {
            defectCounts: loadedDefectCounts,
            hourlyQtys: loadedHourlyQtys
          }
        });

        // 3. Set timer
        setTotalTime(report.totalInspectionTimeSeconds || 0);
      } catch (error) {
        if (error.response?.status === 404) {
          dispatch({ type: "RESET" });
          setTotalTime(0);
        } else {
          console.error("Error fetching existing data:", error);
        }
      } finally {
        setIsLoadingExisting(false);
      }
    };
    fetchExistingData();
  }, [
    keyFieldsReady,
    reportDate,
    user,
    factoryType,
    factoryName,
    moNo,
    selectedColors,
    defectList
  ]);

  // --- UPDATED HANDLERS USING DISPATCH ---
  const handleIncrementDefect = useCallback((defectId) => {
    dispatch({
      type: "UPDATE_QUANTITIES",
      payload: { defectId, change: 1, totalTime: totalTimeRef.current }
    });
  }, []);

  const handleDecrementDefect = useCallback((defectId) => {
    dispatch({
      type: "UPDATE_QUANTITIES",
      payload: { defectId, change: -1, totalTime: totalTimeRef.current }
    });
  }, []);

  const handleSetDefectCount = useCallback((defectId, newCount) => {
    dispatch({
      type: "SET_QUANTITY",
      payload: {
        defectId,
        newCount: Number(newCount) || 0,
        totalTime: totalTimeRef.current
      }
    });
  }, []);

  const isFormInvalid = useMemo(() => {
    return !moNo || selectedColors.length === 0 || !factoryType || !factoryName;
  }, [moNo, selectedColors, factoryType, factoryName]);

  // --- HandleSave function with new payload structure ---
  const handleSave = async () => {
    // --- PAUSE THE TIMER ---
    setIsTimerActive(false);

    if (isFormInvalid) {
      Swal.fire("Incomplete Form", "Please fill all fields.", "warning");
      return;
    }
    setIsSubmitting(true);

    // Payload creation logic remains the same
    const defectCountsPayload = Object.entries(defectCounts)
      .map(([defectId, qty]) => {
        const defect = defectList.find((d) => d._id === defectId);
        if (!defect || qty === 0) return null;
        return { no: defect.no, defectNameEng: defect.defectNameEng, qty };
      })
      .filter(Boolean);

    const defectCountByHrPayload = Object.entries(hourlyQtys)
      .map(([hour, defectsInHour]) => {
        const defectsPayload = Object.entries(defectsInHour)
          .map(([defectId, qty]) => {
            const defect = defectList.find((d) => d._id === defectId);
            if (!defect || qty === 0) return null;
            return { no: defect.no, defectNameEng: defect.defectNameEng, qty };
          })
          .filter(Boolean);

        return defectsPayload.length > 0
          ? { hour: Number(hour), defects: defectsPayload }
          : null;
      })
      .filter(Boolean);

    const totalCheckedQty = defectCountsPayload.reduce(
      (sum, d) => sum + d.qty,
      0
    );
    const totalUSD = (totalTime / 3600) * 4.38;

    const payload = {
      reportDate: reportDate.toISOString().split("T")[0],
      inspectorId: user.emp_id,
      moNo: moNo.value,
      colors: selectedColors.map((c) => c.value),
      factoryType,
      factoryName: factoryName.value,
      totalInspectionTimeSeconds: totalTime,
      totalInspectionTimeString: formatTime(totalTime),
      defectCounts: defectCountsPayload,
      defectCountByHr: defectCountByHrPayload,
      totalCheckedQty,
      totalClaimAmountUSD: totalUSD,
      totalClaimAmountKHR: totalUSD * 4000
    };

    try {
      await axios.post(`${API_BASE_URL}/api/supplier-issues/reports`, payload);
      Swal.fire(
        "Success!",
        "Inspection report has been saved/updated.",
        "success"
      );
    } catch (error) {
      console.error("Error saving report:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to save the report.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // selectStyles
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--color-border-hover)" }
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-accent)"
    }),
    multiValueLabel: (base) => ({ ...base, color: "var(--color-text-accent)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "var(--color-bg-accent-active)"
        : isFocused
        ? "var(--color-bg-accent)"
        : "var(--color-bg-secondary)",
      color: "var(--color-text-primary)",
      ":active": { backgroundColor: "var(--color-bg-accent-active)" }
    })
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Inspection Date</label>
            <DatePicker
              selected={reportDate}
              onChange={(date) => setReportDate(date)}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              dateFormat="MM/dd/yyyy"
            />
          </div>
          <div>
            <label className="text-sm font-medium">MO No</label>
            <Select
              options={moNoOptions}
              value={moNo}
              onInputChange={setMoNoSearch}
              onChange={setMoNo}
              styles={selectStyles}
              placeholder="Search MO..."
              isClearable
            />
          </div>
          <div>
            <label className="text-sm font-medium">Color</label>
            <Select
              options={colorOptions}
              value={selectedColors}
              onChange={setSelectedColors}
              isDisabled={!moNo}
              isMulti
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Factory Type</label>
            <Select
              options={[
                { value: "Embellishment", label: "Embellishment" },
                { value: "Washing", label: "Washing" }
              ]}
              onChange={(e) => setFactoryType(e ? e.value : "")}
              styles={selectStyles}
              isClearable
            />
          </div>
          <div>
            <label className="text-sm font-medium">Factory Name</label>
            <Select
              options={factoryOptions}
              value={factoryName}
              onChange={setFactoryName}
              isDisabled={!factoryType || isLoading}
              isLoading={isLoading}
              styles={selectStyles}
            />
          </div>
        </div>
      </div>

      <InspectionTimer
        initialSeconds={totalTime}
        onTimeUpdate={setTotalTime}
        isActive={isTimerActive}
        onToggle={() => setIsTimerActive((prev) => !prev)}
      />

      {/* --- DEFECT ENTRY CARD --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative">
        {isLoadingExisting && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Defect Entry
          </h3>
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setDefectView("grid")}
              className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition ${
                defectView === "grid"
                  ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <LayoutGrid size={16} /> Grid View
            </button>
            <button
              onClick={() => setDefectView("list")}
              className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition ${
                defectView === "list"
                  ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <List size={16} /> List View
            </button>
          </div>
        </div>

        {/* Conditional Rendering based on view */}
        {defectView === "grid" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {defectList.map((defect) => (
              <DefectBox
                key={defect._id}
                defect={defect}
                count={defectCounts[defect._id] || 0}
                onIncrement={() => handleIncrementDefect(defect._id)}
                onDecrement={() => handleDecrementDefect(defect._id)}
              />
            ))}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/50">
                  <th className="p-2 text-center">No.</th>
                  <th className="p-2 text-left">Defect Name</th>
                  <th className="p-2 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {defectList.map((defect) => (
                  <DefectRow
                    key={defect._id}
                    defect={defect}
                    count={defectCounts[defect._id] || 0}
                    onIncrement={() => handleIncrementDefect(defect._id)}
                    onDecrement={() => handleDecrementDefect(defect._id)}
                    onSetCount={(newCount) =>
                      handleSetDefectCount(defect._id, newCount)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* total hourly qty for display */}
      <HourlyQtyTable
        hourlyQtys={Object.entries(hourlyQtys).reduce(
          (acc, [hour, defects]) => ({
            ...acc,
            [hour]: Object.values(defects).reduce((sum, qty) => sum + qty, 0)
          }),
          {}
        )}
      />

      <ClaimSummary totalSeconds={totalTime} />

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting || isFormInvalid}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          Save Inspection
        </button>
      </div>
    </div>
  );
};

export default SupplierInspectionForm;
