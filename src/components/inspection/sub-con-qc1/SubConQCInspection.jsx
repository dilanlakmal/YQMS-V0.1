import axios from "axios";
import {
  AlertTriangle,
  Calendar,
  Check,
  Eye,
  Factory,
  Hash,
  List,
  Palette,
  Percent,
  Save,
  Search,
  User,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import SubConQCInspectionPreview from "./SubConQCInspectionPreview";

// --- A dedicated card for the Checked Qty input---
const CheckedQtyCard = ({ checkedQty, onChange, isLocked, onLockToggle }) => (
  <div className="p-4 rounded-lg shadow-md flex flex-col bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
        Checked Qty
      </h4>
      <button
        onClick={onLockToggle}
        title={isLocked ? "Unlock to edit" : "Lock quantity"}
        className={`p-1 rounded-md ${
          isLocked
            ? "bg-blue-500 text-white"
            : "bg-blue-200 dark:bg-gray-700 text-blue-600 dark:text-gray-300"
        }`}
      >
        <Check size={16} />
      </button>
    </div>
    <input
      type="text"
      inputMode="numeric"
      value={checkedQty}
      onChange={onChange}
      disabled={isLocked}
      className="w-full bg-white dark:bg-gray-900/50 border-2 border-blue-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-md text-4xl font-bold p-2 text-blue-600 dark:text-blue-300 disabled:opacity-70 disabled:cursor-not-allowed"
      placeholder="0"
    />
  </div>
);

// --- Compact, vertical summary card for the left column ---
const VerticalSummaryCard = ({
  icon,
  title,
  value,
  colorClass,
  bgColorClass
}) => (
  <div
    className={`p-3 rounded-lg shadow-sm flex flex-col h-full ${bgColorClass}`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">
        {title}
      </h4>
      <div className={`text-opacity-80 ${colorClass}`}>{icon}</div>
    </div>
    <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
  </div>
);

// --- Defect Card component ---
const DefectCard = ({
  defect,
  checkedQty,
  onQtyChange,
  getDefectRateCellColor,
  isLocked
}) => {
  const defectRate =
    checkedQty > 0 ? (Number(defect.qty || 0) / checkedQty) * 100 : null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="p-3 flex-grow">
        <div className="flex justify-between items-start">
          <div className="text-center pr-3 border-r border-gray-200 dark:border-gray-600">
            <div className="text-xl font-bold text-indigo-500 dark:text-indigo-400">
              {defect.DisplayCode}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {defect.DefectCode}
            </div>
          </div>
          <div className="flex-grow pl-3">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {defect.DefectNameEng}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {defect.DefectNameKhmer} | {defect.DefectNameChi}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg`}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={defect.qty}
          onChange={(e) => onQtyChange(defect.DefectCode, e.target.value)}
          disabled={isLocked}
          className="w-20 h-9 text-center text-lg font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          placeholder="0"
        />
        <div
          className={`px-2 py-1 rounded-md text-sm font-bold ${
            defectRate !== null ? getDefectRateCellColor(defectRate) : ""
          }`}
        >
          {defectRate !== null ? `${defectRate.toFixed(2)}%` : "-"}
        </div>
      </div>
    </div>
  );
};

const SubConQCInspection = ({ inspectionState, setInspectionState }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("defectName");
  const [moNoSearchTerm, setMoNoSearchTerm] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [allFactories, setAllFactories] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQtyLocked, setIsQtyLocked] = useState(false); // State for locking inputs
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- DEBOUNCE HELPER ---
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }, []);

  // --- MO SEARCH LOGIC ---
  const debouncedMoSearch = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.length < 3) {
        setMoNoOptions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term: searchTerm }
        });
        setMoNoOptions(res.data.map((mo) => ({ value: mo, label: mo })));
      } catch (error) {
        console.error("Error searching MO:", error);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedMoSearch(moNoSearchTerm);
  }, [moNoSearchTerm, debouncedMoSearch]);

  // API CALL Factories
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        // Ensure the response data is an array before setting state.
        if (Array.isArray(res.data)) {
          setAllFactories(res.data);
        } else {
          console.warn("API response for factories is not an array:", res.data);
          setAllFactories([]); // Set to empty array to prevent crash
        }
      } catch (error) {
        console.error("Failed to fetch factories", error);
        setAllFactories([]); // Also set to empty array on catastrophic failure
      }
    };
    fetchFactories();
  }, []);

  // Fetch defects from the backend
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/subcon-defects`);
        const defectsWithQty = res.data.map((d) => ({ ...d, qty: "" }));
        // Only set defects if the state is currently empty to avoid overwriting user input
        if (inspectionState.defects.length === 0) {
          setInspectionState((prevState) => ({
            ...prevState,
            defects: defectsWithQty
          }));
        }
      } catch (error) {
        console.error("Failed to fetch defects", error);
      }
    };
    fetchDefects();
  }, [setInspectionState, inspectionState.defects.length]);

  // Fetch colors when MO No changes
  useEffect(() => {
    const fetchColors = async () => {
      if (!inspectionState.moNo) {
        setColorOptions([]);
        setInspectionState((prev) => ({ ...prev, color: null }));
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${inspectionState.moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({ value: c.original, label: c.original }))
        );
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, [inspectionState.moNo, setInspectionState]);

  // DEFENSIVE CHECK FOR allFactories ---
  useEffect(() => {
    if (inspectionState.factory && Array.isArray(allFactories)) {
      // Check if allFactories is an array
      const selectedFactoryData = allFactories.find(
        (f) => f.factory === inspectionState.factory.value
      );
      if (selectedFactoryData && Array.isArray(selectedFactoryData.lineList)) {
        // Check if lineList exists and is an array
        setLineOptions(
          selectedFactoryData.lineList.map((line) => ({
            value: line,
            label: line
          }))
        );
      }
    } else {
      setLineOptions([]);
    }
    handleStateChange("lineNo", null);
  }, [inspectionState.factory, allFactories]);

  // FUNCTION TO GET DEFECT NAME BASED ON CURRENT LANGUAGE ---
  const getDefectNameForDisplay = useCallback(
    (defect) => {
      if (!defect) return "";
      const lang = i18n.language;
      if (lang.startsWith("km")) return defect.DefectNameKhmer;
      if (lang.startsWith("zh")) return defect.DefectNameChi;
      return defect.DefectNameEng;
    },
    [i18n.language]
  );

  // --- UPDATED FILTER LOGIC ---
  const filteredDefects = useMemo(() => {
    if (!searchTerm) {
      return inspectionState.defects;
    }
    const lowercasedTerm = searchTerm.toLowerCase();

    if (searchType === "displayCode") {
      return inspectionState.defects.filter((defect) =>
        String(defect.DisplayCode).includes(lowercasedTerm)
      );
    }

    // Default search by name
    return inspectionState.defects.filter(
      (defect) =>
        defect.DefectNameEng?.toLowerCase().includes(lowercasedTerm) ||
        defect.DefectNameKhmer?.toLowerCase().includes(lowercasedTerm) ||
        defect.DefectNameChi?.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, searchType, inspectionState.defects]);

  const totalDefectQty = useMemo(() => {
    return inspectionState.defects.reduce(
      (sum, defect) => sum + (Number(defect.qty) || 0),
      0
    );
  }, [inspectionState.defects]);

  const totalDefectRate = useMemo(() => {
    const checked = Number(inspectionState.checkedQty);
    if (!checked || checked === 0) return 0;
    return (totalDefectQty / checked) * 100;
  }, [totalDefectQty, inspectionState.checkedQty]);

  // --- EVENT HANDLERS ---
  const handleStateChange = (field, value) => {
    setInspectionState((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleDefectQtyChange = (defectCode, value) => {
    if (
      value === "" ||
      (/^[0-9]\d*$/.test(value) && !value.startsWith("0") && value !== "0") ||
      value === "0"
    ) {
      const updatedDefects = inspectionState.defects.map((d) =>
        d.DefectCode === defectCode ? { ...d, qty: value } : d
      );
      handleStateChange("defects", updatedDefects);
    }
  };

  const handleCheckedQtyChange = (e) => {
    const value = e.target.value;
    if (
      value === "" ||
      (/^[0-9]\d*$/.test(value) && !value.startsWith("0") && value !== "0") ||
      value === "0"
    ) {
      handleStateChange("checkedQty", value);
    }
  };

  // --- DYNAMIC STYLING HELPERS ---
  const getTotalRateStyling = () => {
    if (totalDefectRate > 5)
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/50"
      };
    if (totalDefectRate >= 3)
      return {
        color: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/50"
      };
    return {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/50"
    };
  };

  const getDefectRateCellColor = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/50";
    if (rate >= 1) return "bg-orange-100 dark:bg-orange-900/50";
    if (rate > 0) return "bg-green-100 dark:bg-green-900/50";
    return "";
  };

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  // --- DEFENSIVE CHECK IN useMemo ---
  const factoryOptions = useMemo(() => {
    // If allFactories is not an array, return an empty array immediately.
    if (!Array.isArray(allFactories)) {
      return [];
    }
    return allFactories.map((f) => ({
      value: f.factory,
      label: f.factory_second_name
        ? `${f.factory} (${f.factory_second_name})`
        : f.factory
    }));
  }, [allFactories]);

  // FORM VALIDATION LOGIC
  const isFormInvalid = useMemo(() => {
    return (
      !inspectionState.factory ||
      !inspectionState.lineNo ||
      !inspectionState.moNo ||
      !inspectionState.color ||
      !inspectionState.checkedQty ||
      Number(inspectionState.checkedQty) <= 0
    );
  }, [inspectionState]);

  // SAVE HANDLER FUNCTION ---
  const handleSave = async () => {
    if (isFormInvalid) {
      Swal.fire(
        "Incomplete Form",
        "Please fill in all required fields (Factory, Line, MO, Color, and Checked Qty).",
        "warning"
      );
      return;
    }
    setIsSubmitting(true);

    // Filter for defects that have a quantity entered
    const defectsToSave = inspectionState.defects
      .filter((d) => Number(d.qty) > 0)
      .map((d) => ({
        defectCode: d.DefectCode,
        displayCode: d.DisplayCode,
        defectName: d.DefectNameEng, // English name only
        qty: Number(d.qty)
      }));

    const factoryData = allFactories.find(
      (f) => f.factory === inspectionState.factory.value
    );

    const payload = {
      inspectionDate: inspectionState.inspectionDate,
      factory: inspectionState.factory.value,
      factory_second_name: factoryData?.factory_second_name || "",
      lineNo: inspectionState.lineNo.value,
      moNo: inspectionState.moNo.value,
      color: inspectionState.color.value,
      preparedBy: {
        empId: user.emp_id,
        engName: user.eng_name
      },
      checkedQty: Number(inspectionState.checkedQty),
      totalDefectQty: totalDefectQty,
      defectList: defectsToSave
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/subcon-sewing-qc1-reports`,
        payload
      );
      Swal.fire({
        icon: "success",
        title: "Report Saved!",
        text: `Your report has been saved with ID: ${response.data.reportID}`,
        timer: 2000,
        showConfirmButton: false
      });

      // --- FORM RESET LOGIC ---
      const resetDefects = inspectionState.defects.map((d) => ({
        ...d,
        qty: ""
      }));

      setInspectionState((prevState) => ({
        ...prevState,
        lineNo: null,
        moNo: null,
        color: null,
        checkedQty: "",
        defects: resetDefects
      }));

      // Clear local state
      setMoNoSearchTerm("");
      setMoNoOptions([]);
      setColorOptions([]);
    } catch (error) {
      console.error("Error saving report:", error);
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "An unexpected error occurred.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} />
              Inspection Date
            </label>
            <DatePicker
              selected={inspectionState.inspectionDate}
              onChange={(date) => handleStateChange("inspectionDate", date)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Factory size={16} />
              Factory
            </label>
            <Select
              options={factoryOptions}
              value={inspectionState.factory}
              onChange={(val) => handleStateChange("factory", val)}
              styles={reactSelectStyles}
              placeholder="Select Factory..."
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <List size={16} />
              Line No
            </label>
            <Select
              options={lineOptions}
              value={inspectionState.lineNo}
              onChange={(val) => handleStateChange("lineNo", val)}
              styles={reactSelectStyles}
              placeholder="Select Line..."
              isDisabled={!inspectionState.factory}
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash size={16} />
              MO No
            </label>
            <Select
              options={moNoOptions}
              value={inspectionState.moNo}
              onInputChange={setMoNoSearchTerm}
              onChange={(val) => handleStateChange("moNo", val)}
              styles={reactSelectStyles}
              placeholder="Type to search MO..."
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette size={16} />
              Color
            </label>
            <Select
              options={colorOptions}
              value={inspectionState.color}
              onChange={(val) => handleStateChange("color", val)}
              styles={reactSelectStyles}
              placeholder="Select Color..."
              isDisabled={!inspectionState.moNo}
            />
          </div>
        </div>
      </div>

      {/* --- MAIN LAYOUT WITH FLEXBOX --- */}
      <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
        {/* --- STICKY LEFT COLUMN FOR CHECKED QTY --- */}
        <div className="w-full lg:w-1/5 lg:sticky lg:top-6 space-y-4">
          <CheckedQtyCard
            checkedQty={inspectionState.checkedQty}
            onChange={handleCheckedQtyChange}
            isLocked={isQtyLocked}
            onLockToggle={() => setIsQtyLocked(!isQtyLocked)}
          />
          {/* --- SUMMARY CARDS --- */}
          <VerticalSummaryCard
            icon={<AlertTriangle size={20} />}
            title="Total Defect Qty"
            value={totalDefectQty}
            colorClass="text-yellow-500 dark:text-yellow-400"
            bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
          />
          <VerticalSummaryCard
            icon={<Percent size={20} />}
            title="Total Defect Rate"
            value={`${totalDefectRate.toFixed(2)}%`}
            colorClass={getTotalRateStyling().color}
            bgColorClass={getTotalRateStyling().bg}
          />
          <VerticalSummaryCard
            icon={<User size={20} />}
            title="Prepared By"
            value={user?.emp_id || user?.name || "N/A"}
            colorClass="text-gray-500 dark:text-gray-300"
            bgColorClass="bg-gray-200 dark:bg-gray-700/50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 shadow-lg"
            >
              <Eye size={18} /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || isFormInvalid}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Saving..." : "Save Inspection"}
            </button>
          </div>
        </div>

        {/* --- WIDE RIGHT COLUMN FOR DEFECTS --- */}
        <div className="w-full lg:w-4/5">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full">
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-shrink-0">
                <label htmlFor="search-type" className="text-sm font-medium">
                  Search By
                </label>
                <select
                  id="search-type"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="defectName">Defect Name</option>
                  <option value="displayCode">Display Code</option>
                </select>
              </div>
              <div className="relative flex-grow">
                <label htmlFor="defect-search" className="text-sm font-medium">
                  Filter
                </label>
                <input
                  id="defect-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    searchType === "defectName"
                      ? "Type to filter defects..."
                      : "Type to filter by code..."
                  }
                  className="w-full mt-1 p-2 pl-10 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <Search className="absolute left-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-9 text-gray-400 hover:text-red-500"
                    title="Clear filter"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto max-h-[65vh] p-2 -mx-2">
              {filteredDefects.map((defect) => (
                <DefectCard
                  key={defect.DefectCode}
                  defect={defect}
                  checkedQty={Number(inspectionState.checkedQty) || 0}
                  onQtyChange={handleDefectQtyChange}
                  getDefectRateCellColor={getDefectRateCellColor}
                  isLocked={isQtyLocked}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* --- RENDER THE PREVIEW MODAL --- */}
      <SubConQCInspectionPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={{
          inspectionState,
          totalDefectQty,
          totalDefectRate,
          user,
          defects: inspectionState.defects,
          getTotalRateStyling,
          getDefectRateCellColor
        }}
      />
    </div>
  );
};

export default SubConQCInspection;
