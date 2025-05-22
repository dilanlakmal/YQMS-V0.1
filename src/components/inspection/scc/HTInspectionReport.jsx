import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Info,
  ListChecks,
  Loader2,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Sigma
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
import DefectBoxHT from "./DefectBoxHT"; // Import the defect box
import SCCImageUpload from "./SCCImageUpload"; // Import image upload

// --- Constants and Helpers ---
const inputBaseClasses =
  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm";
const inputFocusClasses = "focus:ring-indigo-500 focus:border-indigo-500";
const inputFieldClasses = `${inputBaseClasses} ${inputFocusClasses}`;
const inputFieldReadonlyClasses = `${inputBaseClasses} bg-gray-100 cursor-not-allowed`;
const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";
const MAX_REMARKS_LENGTH = 250;

const HTInspectionReport = ({
  formData, // from SCCPage state
  onFormDataChange,
  onFormSubmit,
  isSubmitting: parentIsSubmitting, // Renamed to avoid conflict
  formType
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [localFormData, setLocalFormData] = useState(formData);
  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [aqlDetailsLoading, setAqlDetailsLoading] = useState(false);
  const [defectsLoading, setDefectsLoading] = useState(false);

  const [aqlData, setAqlData] = useState({
    sampleSizeLetterCode: "",
    sampleSize: null, // This is Total Inspected Qty
    acceptDefect: null,
    rejectDefect: null
  });

  const [showDefectBox, setShowDefectBox] = useState(false);
  const [availableSccDefects, setAvailableSccDefects] = useState([]);
  const [isSubmittingData, setIsSubmittingData] = useState(false); // Local submitting state

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);

  // Sync with formData prop from parent (e.g., if loaded from backend)
  useEffect(() => {
    setLocalFormData((prev) => ({
      ...prev,
      ...formData,
      // Ensure numeric fields are numbers or null
      totalBundle:
        formData.totalBundle !== undefined &&
        formData.totalBundle !== null &&
        formData.totalBundle !== ""
          ? Number(formData.totalBundle)
          : null,
      totalPcs:
        formData.totalPcs !== undefined &&
        formData.totalPcs !== null &&
        formData.totalPcs !== ""
          ? Number(formData.totalPcs)
          : null,
      batchNo: formData.batchNo || "",
      remarks: formData.remarks || "",
      defects: formData.defects || [],
      defectImageFile: formData.defectImageFile || null, // File object
      defectImageUrl: formData.defectImageUrl || null // URL string
    }));
    setMoNoSearch(formData.moNo || "");
    // If totalPcs is loaded and non-zero, fetch AQL details
    if (formData.totalPcs && Number(formData.totalPcs) > 0) {
      fetchAQLDetails(Number(formData.totalPcs));
    } else {
      setAqlData({
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      });
    }
  }, [formData]);

  // Update parent form data whenever localFormData (relevant parts) changes
  const updateParent = useCallback(
    (updatedData) => {
      onFormDataChange(updatedData);
    },
    [onFormDataChange]
  );

  // Fetch available SCC Defects for the dropdown
  useEffect(() => {
    const fetchDefects = async () => {
      setDefectsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/scc/defects`);
        setAvailableSccDefects(response.data || []);
      } catch (error) {
        console.error(
          t("sccHTInspection.errorFetchingDefects", "Error fetching defects:"),
          error
        );
        Swal.fire(
          t("scc.error"),
          t(
            "sccHTInspection.errorFetchingDefectsMsg",
            "Failed to load defect list."
          ),
          "error"
        );
      } finally {
        setDefectsLoading(false);
      }
    };
    fetchDefects();
  }, [t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "totalBundle" || name === "totalPcs") {
      processedValue = value === "" ? null : parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = null;
    }
    if (name === "batchNo") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 3); // Allow only 3 digits
    }

    const newLocalData = { ...localFormData, [name]: processedValue };
    setLocalFormData(newLocalData);
    updateParent(newLocalData); // Update parent immediately for these simple fields

    if (name === "totalPcs") {
      if (processedValue && processedValue > 0) {
        fetchAQLDetails(processedValue);
      } else {
        setAqlData({
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        });
      }
    }
  };

  const handleDateChange = (date) => {
    const newLocalData = { ...localFormData, inspectionDate: date };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
  };

  // MO No Search and Selection Logic (similar to other tabs)
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
    const newLocalData = {
      ...localFormData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: ""
    }; // Reset buyer, style, color
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
    // Order details will be fetched by the useEffect below
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!localFormData.moNo) {
        if (localFormData.buyer || localFormData.buyerStyle) {
          // Clear if MO is removed
          const clearedData = {
            ...localFormData,
            buyer: "",
            buyerStyle: "",
            color: ""
          };
          setLocalFormData(clearedData);
          updateParent(clearedData);
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
        const updatedDetails = {
          buyer: details.engName || "N/A",
          buyerStyle: details.custStyle || "N/A"
        };
        const newLocalData = { ...localFormData, ...updatedDetails };
        setLocalFormData(newLocalData);
        updateParent(newLocalData);
        setAvailableColors(details.colors || []);
      } catch (error) {
        console.error(t("scc.errorFetchingOrderDetailsLog"), error);
        const clearedData = {
          ...localFormData,
          buyer: "",
          buyerStyle: "",
          color: ""
        };
        setLocalFormData(clearedData);
        updateParent(clearedData);
        setAvailableColors([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [localFormData.moNo, t]); // updateParent removed to prevent loop; direct calls are fine.

  const handleColorChange = (e) => {
    const newLocalData = { ...localFormData, color: e.target.value };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
  };

  // AQL Details Fetching
  const fetchAQLDetails = useCallback(
    async (lotSize) => {
      if (!lotSize || lotSize <= 0) {
        setAqlData({
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        });
        return;
      }
      setAqlDetailsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/aql-details`, {
          params: { lotSize }
        });
        setAqlData({
          sampleSizeLetterCode: response.data.SampleSizeLetterCode || "",
          sampleSize:
            response.data.SampleSize !== undefined
              ? Number(response.data.SampleSize)
              : null,
          acceptDefect:
            response.data.AcceptDefect !== undefined
              ? Number(response.data.AcceptDefect)
              : null,
          rejectDefect:
            response.data.RejectDefect !== undefined
              ? Number(response.data.RejectDefect)
              : null
        });
      } catch (error) {
        console.error(
          t("sccHTInspection.errorFetchingAQL", "Error fetching AQL details:"),
          error
        );
        setAqlData({
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        });
        // Optionally show a small error message to user, but don't halt everything
      } finally {
        setAqlDetailsLoading(false);
      }
    },
    [t]
  );

  // Calculate Total Defects Qty
  const totalDefectsQty = useMemo(() => {
    return (
      localFormData.defects?.reduce((sum, defect) => sum + defect.count, 0) || 0
    );
  }, [localFormData.defects]);

  // Determine Inspection Result
  const inspectionResult = useMemo(() => {
    if (aqlData.acceptDefect === null || totalDefectsQty === null)
      return "Pending";
    return totalDefectsQty <= aqlData.acceptDefect ? "Pass" : "Reject";
  }, [totalDefectsQty, aqlData.acceptDefect]);

  // Defect Management Functions
  const handleAddDefectToReport = (defectToAddFromModal) => {
    // defectToAddFromModal is { no, defectNameEng, ... }
    const newDefectEntry = {
      ...defectToAddFromModal, // contains no, defectNameEng, defectNameKhmer, defectNameChinese
      count: 1 // Start with count 1
    };
    const newLocalData = {
      ...localFormData,
      defects: [...(localFormData.defects || []), newDefectEntry]
    };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
  };

  const handleRemoveDefectFromReport = (index) => {
    const updatedDefects = [...(localFormData.defects || [])];
    updatedDefects.splice(index, 1);
    const newLocalData = { ...localFormData, defects: updatedDefects };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
  };

  const handleUpdateDefectCountInReport = (index, newCount) => {
    const updatedDefects = [...(localFormData.defects || [])];
    if (updatedDefects[index]) {
      updatedDefects[index] = { ...updatedDefects[index], count: newCount };
      const newLocalData = { ...localFormData, defects: updatedDefects };
      setLocalFormData(newLocalData);
      updateParent(newLocalData);
    }
  };

  const handleImageChange = (file, previewUrl) => {
    const newLocalData = {
      ...localFormData,
      defectImageFile: file,
      defectImageUrl: previewUrl
    };
    setLocalFormData(newLocalData);
    updateParent(newLocalData); // Update parent with file and URL for submission logic
  };

  const handleImageRemove = () => {
    const newLocalData = {
      ...localFormData,
      defectImageFile: null,
      defectImageUrl: null
    };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
  };

  const handleRemarksChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_REMARKS_LENGTH) {
      const newLocalData = { ...localFormData, remarks: value };
      setLocalFormData(newLocalData);
      updateParent(newLocalData);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !localFormData.inspectionDate ||
      !localFormData.machineNo ||
      !localFormData.moNo ||
      !localFormData.color ||
      !localFormData.batchNo
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccHTInspection.validation.fillBasic",
          "Please fill Date, Machine, MO, Color, and Batch No."
        ),
        "warning"
      );
      return;
    }
    if (
      !localFormData.totalBundle ||
      localFormData.totalBundle <= 0 ||
      !localFormData.totalPcs ||
      localFormData.totalPcs <= 0
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccHTInspection.validation.fillBundlePcs",
          "Total Bundle and Total Pcs must be greater than 0."
        ),
        "warning"
      );
      return;
    }
    if (
      aqlData.sampleSize === null ||
      aqlData.acceptDefect === null ||
      aqlData.rejectDefect === null
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccHTInspection.validation.aqlNotLoaded",
          "AQL data not loaded. Ensure Total Pcs is valid."
        ),
        "warning"
      );
      return;
    }
    // Image is optional based on typical requirements, adjust if mandatory
    // Defects array can be empty, meaning 0 defects.

    setIsSubmittingData(true); // Use local submitting state
    // The onFormSubmit prop (from SCCPage) will handle the actual API call and global submitting state
    // We are constructing the payload here to be sent to onFormSubmit
    const payload = {
      _id: localFormData._id, // For updates
      inspectionDate: localFormData.inspectionDate,
      machineNo: localFormData.machineNo,
      moNo: localFormData.moNo,
      buyer: localFormData.buyer,
      buyerStyle: localFormData.buyerStyle,
      color: localFormData.color,
      batchNo: localFormData.batchNo,
      totalBundle: localFormData.totalBundle,
      totalPcs: localFormData.totalPcs,
      aqlData: {
        // Store the AQL parameters used for this inspection
        type: "General", // Fixed
        level: "II", // Fixed
        sampleSizeLetterCode: aqlData.sampleSizeLetterCode,
        sampleSize: aqlData.sampleSize, // This is Total Inspected Qty
        acceptDefect: aqlData.acceptDefect,
        rejectDefect: aqlData.rejectDefect
      },
      defectsQty: totalDefectsQty,
      result: inspectionResult,
      defects: localFormData.defects.map((d) => ({
        // Save simplified defect info
        no: d.no,
        defectNameEng: d.defectNameEng, // Or just 'no' and fetch details on view
        count: d.count
      })),
      remarks: localFormData.remarks?.trim() || "NA",
      defectImageFile: localFormData.defectImageFile, // Pass the File object for SCCPage to handle upload
      defectImageUrl: localFormData.defectImageUrl // Pass current URL (might be existing or new preview)
      // User info will be added by SCCPage's handleFormSubmit
    };

    try {
      await onFormSubmit(formType, payload); // Let parent handle submission and its state
      // If onFormSubmit is successful, SCCPage will reset its own formData for this tab,
      // which will then flow down and trigger the useEffect in this component to update localFormData.
      // So, no explicit reset here needed if parent handles it well.
    } catch (error) {
      // Error already handled by SCCPage's submit
    } finally {
      setIsSubmittingData(false);
    }
  };

  const getResultCellBG = (resultValue) => {
    if (resultValue === "Pass") return "bg-green-100 text-green-700";
    if (resultValue === "Reject") return "bg-red-100 text-red-700";
    return "bg-gray-100";
  };

  const isLoading =
    orderDetailsLoading ||
    aqlDetailsLoading ||
    defectsLoading ||
    parentIsSubmitting ||
    isSubmittingData;

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-800">
        {t("sccHTInspection.title", "Heat Transfer Inspection Report")}
      </h2>

      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[150]">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}

      {/* Row 1: Date, Machine No, MO No Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
        <div>
          <label htmlFor="htInspDate" className={labelClasses}>
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
          <label htmlFor="htInspMachineNo" className={labelClasses}>
            {t("scc.machineNo")}
          </label>
          <select
            id="htInspMachineNo"
            name="machineNo"
            value={localFormData.machineNo || ""}
            onChange={handleInputChange}
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
          <label htmlFor="htInspMoNoSearch" className={labelClasses}>
            {t("scc.moNo")}
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="htInspMoNoSearch"
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
        </div>
      </div>

      {/* Row 2: Buyer, Buyer Style, Color, Batch No */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 items-end">
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
          <label htmlFor="htInspColor" className={labelClasses}>
            {t("scc.color")}
          </label>
          <select
            id="htInspColor"
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
        <div>
          <label htmlFor="htInspBatchNo" className={labelClasses}>
            {t("sccHTInspection.batchNo", "Batch No.")}
          </label>
          <input
            type="text"
            id="htInspBatchNo"
            name="batchNo"
            value={localFormData.batchNo || ""}
            onChange={handleInputChange}
            className={inputFieldClasses}
            placeholder="e.g. 001"
            maxLength="3"
            inputMode="numeric"
            pattern="[0-9]{3}"
            required
          />
        </div>
      </div>

      {/* Inspection Details Table */}
      <div className="mt-5">
        <h3 className="text-md font-semibold text-gray-700 mb-2">
          {t("sccHTInspection.inspectionDetails", "Inspection Details")}
        </h3>
        <div className="overflow-x-auto bg-white rounded-md shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalBundle", "Total Bundle")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalPcs", "Total Pcs")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalInspectedQty", "Insp. Qty (AQL)")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.defectsQty", "Defects Qty")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.result", "Result")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    name="totalBundle"
                    value={
                      localFormData.totalBundle === null
                        ? ""
                        : localFormData.totalBundle
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5`}
                    inputMode="numeric"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    name="totalPcs"
                    value={
                      localFormData.totalPcs === null
                        ? ""
                        : localFormData.totalPcs
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5`}
                    inputMode="numeric"
                  />
                </td>
                <td className="px-4 py-2">
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : aqlData.sampleSize !== null ? (
                    aqlData.sampleSize
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-4 py-2">{totalDefectsQty}</td>
                <td
                  className={`px-4 py-2 font-medium ${getResultCellBG(
                    inspectionResult
                  )}`}
                >
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t(`scc.${inspectionResult.toLowerCase()}`, inspectionResult)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AQL Info Display */}
      {localFormData.totalPcs > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
          <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
            <ListChecks size={18} className="mr-2" />
            {t("sccHTInspection.aqlInfoTitle", "AQL Sampling Plan Information")}
          </h4>
          {aqlDetailsLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : aqlData.sampleSize !== null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              <div className="flex items-center">
                <Filter size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlType", "Type")}:{" "}
                <strong className="ml-1">General</strong>
              </div>
              <div className="flex items-center">
                <TrendingUp size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlLevel", "Level")}:{" "}
                <strong className="ml-1">II</strong>
              </div>
              <div className="flex items-center">
                <FileText size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.sampleSizeCode", "Code")}:{" "}
                <strong className="ml-1">
                  {aqlData.sampleSizeLetterCode || "N/A"}
                </strong>
              </div>
              <div className="flex items-center">
                <Users size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlSampleReq", "Sample")}:{" "}
                <strong className="ml-1">{aqlData.sampleSize}</strong>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle size={14} className="mr-1.5" />
                Ac: <strong className="ml-1">{aqlData.acceptDefect}</strong>
              </div>
              <div className="flex items-center text-red-600">
                <AlertTriangle size={14} className="mr-1.5" />
                Re: <strong className="ml-1">{aqlData.rejectDefect}</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {t(
                "sccHTInspection.enterTotalPcsForAQL",
                "Enter Total Pcs to view AQL details."
              )}
            </p>
          )}
        </div>
      )}

      {/* Defect Details Section */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-gray-700">
            {t("sccHTInspection.defectDetailsTitle", "Defect Details")}
          </h3>
          <button
            type="button"
            onClick={() => setShowDefectBox(true)}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600"
            disabled={defectsLoading}
          >
            {t("sccHTInspection.manageDefectsBtn", "Manage Defects")}
            {defectsLoading && (
              <Loader2 size={14} className="animate-spin ml-2" />
            )}
          </button>
        </div>
        {localFormData.defects && localFormData.defects.length > 0 ? (
          <div className="space-y-1 text-xs">
            {localFormData.defects.map((defect, index) => (
              <div
                key={index}
                className="flex justify-between p-1.5 bg-gray-50 rounded"
              >
                <span>
                  {i18n.language === "kh"
                    ? defect.defectNameKhmer
                    : i18n.language === "zh"
                    ? defect.defectNameChinese
                    : defect.defectNameEng}
                </span>
                <span>{defect.count}</span>
              </div>
            ))}
            <div className="flex justify-between p-1.5 bg-gray-100 rounded font-semibold mt-1">
              <span>{t("sccHTInspection.totalDefects", "Total Defects")}:</span>
              <span>{totalDefectsQty}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            {t("sccHTInspection.noDefectsRecorded", "No defects recorded.")}
          </p>
        )}
      </div>

      {showDefectBox && (
        <DefectBoxHT
          defects={localFormData.defects || []}
          availableDefects={availableSccDefects}
          onClose={() => setShowDefectBox(false)}
          onAddDefect={handleAddDefectToReport}
          onRemoveDefect={handleRemoveDefectFromReport}
          onUpdateDefectCount={handleUpdateDefectCountInReport}
        />
      )}

      {/* Remarks */}
      <div className="mt-5">
        <label htmlFor="htInspRemarks" className={labelClasses}>
          {t("sccHTInspection.remarks", "Remarks")}
        </label>
        <textarea
          id="htInspRemarks"
          name="remarks"
          rows="3"
          value={localFormData.remarks || ""}
          onChange={handleRemarksChange}
          className={inputFieldClasses}
          placeholder={t(
            "sccHTInspection.remarksPlaceholder",
            "Enter any remarks here (optional)..."
          )}
          maxLength={MAX_REMARKS_LENGTH}
        ></textarea>
        <p className="text-xs text-gray-500 text-right mt-0.5">
          {localFormData.remarks?.length || 0} / {MAX_REMARKS_LENGTH}
        </p>
      </div>

      {/* Image Upload */}
      <div className="mt-5">
        <SCCImageUpload
          label={t(
            "sccHTInspection.defectImageLabel",
            "Defect Image (Optional)"
          )}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          initialImageUrl={localFormData.defectImageUrl}
          imageType="htInspectionDefect"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading} // Use combined loading state
          className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {(parentIsSubmitting || isSubmittingData) && (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          )}
          {t("scc.submit", "Submit Report")}
        </button>
      </div>
    </div>
  );
};

export default HTInspectionReport;
