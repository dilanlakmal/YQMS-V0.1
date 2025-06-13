import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Filter,
  ImageOff,
  ListChecks,
  Loader2,
  Percent,
  Search,
  TrendingUp,
  UserCircle2,
  Users
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";
import DefectBoxHT from "./DefectBoxHT";
import SCCImageUpload from "./SCCImageUpload";

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
        "API_BASE_URL is not a valid URL for constructing operator image paths, using path directly:",
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
const labelClasses = "block text-sm font-medium text-gray-700 mb-0.5";
const MAX_REMARKS_LENGTH = 250;

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const HTInspectionReport = ({
  formData, // Use formData directly from props
  onFormDataChange,
  onFormSubmit,
  isSubmitting: parentIsSubmitting,
  formType
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Local UI state, not related to form data itself
  const [moNoSearch, setMoNoSearch] = useState(formData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  const [tableNoSearchTerm, setTableNoSearchTerm] = useState(
    formData.tableNo || ""
  );
  const [allTableNoOptions, setAllTableNoOptions] = useState([]);
  const [filteredTableNoOptions, setFilteredTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [tableNoManuallyEntered, setTableNoManuallyEntered] = useState(false);
  const tableNoManuallyEnteredRef = useRef(tableNoManuallyEntered);

  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [aqlDetailsLoading, setAqlDetailsLoading] = useState(false);
  const [defectsLoading, setDefectsLoading] = useState(false);
  const [operatorDataLoading, setOperatorDataLoading] = useState(false);
  const [cutPanelDetailsLoading, setCutPanelDetailsLoading] = useState(false);

  const [showDefectBox, setShowDefectBox] = useState(false);
  const [availableSccDefects, setAvailableSccDefects] = useState([]);
  const [isSubmittingData, setIsSubmittingData] = useState(false);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const tableNoInputRef = useRef(null);
  const tableNoDropdownWrapperRef = useRef(null);

  useEffect(() => {
    tableNoManuallyEnteredRef.current = tableNoManuallyEntered;
  }, [tableNoManuallyEntered]);

  // Fetches AQL details and updates the parent form state
  const fetchAQLDetails = useCallback(
    async (lotSize, currentFormData) => {
      if (!lotSize || lotSize <= 0) {
        onFormDataChange({
          ...currentFormData,
          aqlData: {
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          }
        });
        return;
      }
      setAqlDetailsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/aql-details`, {
          params: { lotSize }
        });
        const newAql = {
          type: "General",
          level: "II",
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
              : null,
          totalPcsForAQL: lotSize
        };
        onFormDataChange({ ...currentFormData, aqlData: newAql });
      } catch (error) {
        console.error(t("sccHTInspection.errorFetchingAQL"), error);
        onFormDataChange({
          ...currentFormData,
          aqlData: {
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null,
            totalPcsForAQL: lotSize
          }
        });
      } finally {
        setAqlDetailsLoading(false);
      }
    },
    [onFormDataChange, t]
  );

  // useEffect to calculate and update derived data (result, defectRate, etc.)
  useEffect(() => {
    const newTotalDefectsQty =
      formData.defects?.reduce((sum, defect) => sum + defect.count, 0) || 0;
    let newDefectRate = 0;
    let newResult = "Pending";

    if (formData.aqlData?.sampleSize && formData.aqlData.sampleSize > 0) {
      newDefectRate = parseFloat(
        ((newTotalDefectsQty / formData.aqlData.sampleSize) * 100).toFixed(2)
      );
      if (formData.aqlData.acceptDefect !== null) {
        newResult =
          newTotalDefectsQty <= formData.aqlData.acceptDefect
            ? "Pass"
            : "Reject";
      }
    } else if (formData.aqlData?.sampleSize === 0) {
      newResult = newTotalDefectsQty === 0 ? "Pass" : "Reject";
    }

    if (
      formData.defectsQty !== newTotalDefectsQty ||
      formData.defectRate !== newDefectRate ||
      formData.result !== newResult
    ) {
      onFormDataChange({
        ...formData,
        defectsQty: newTotalDefectsQty,
        defectRate: newDefectRate,
        result: newResult
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.defects, formData.aqlData, onFormDataChange]);

  // Correctly implemented operator fetching useEffect
  useEffect(() => {
    const fetchOperator = async () => {
      if (!formData.machineNo) {
        if (formData.operatorData !== null) {
          onFormDataChange({ ...formData, operatorData: null });
        }
        return;
      }
      setOperatorDataLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/operator-by-machine/ht/${formData.machineNo}`
        );
        const fetchedOpData = response.data?.data || null;
        onFormDataChange({ ...formData, operatorData: fetchedOpData });
      } catch (error) {
        if (formData.operatorData !== null) {
          onFormDataChange({ ...formData, operatorData: null });
        }
        if (
          !(
            error.response?.status === 404 &&
            error.response?.data?.message === "OPERATOR_NOT_FOUND"
          )
        ) {
          console.error("Error fetching operator data for HT Insp:", error);
        }
      } finally {
        setOperatorDataLoading(false);
      }
    };

    fetchOperator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.machineNo, onFormDataChange]);

  useEffect(() => {
    const fetchDefectsList = async () => {
      setDefectsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/scc/defects`);
        setAvailableSccDefects(response.data || []);
      } catch (error) {
        console.error(t("sccHTInspection.errorFetchingDefects"), error);
        Swal.fire(
          t("scc.error"),
          t("sccHTInspection.errorFetchingDefectsMsg"),
          "error"
        );
      } finally {
        setDefectsLoading(false);
      }
    };
    fetchDefectsList();
  }, [t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (["actualLayers", "totalBundle", "totalPcs"].includes(name)) {
      processedValue =
        value === ""
          ? ""
          : isNaN(parseInt(value, 10))
          ? formData[name]
          : parseInt(value, 10);
    }
    if (name === "batchNo")
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 3);

    const newFormData = { ...formData, [name]: processedValue };
    const numBundle = Number(newFormData.totalBundle);
    const numLayers = Number(newFormData.actualLayers);
    let newTotalPcsValue = newFormData.totalPcs;

    if (
      (name === "totalBundle" || name === "actualLayers") &&
      name !== "totalPcs"
    ) {
      if (numBundle > 0 && numLayers > 0)
        newTotalPcsValue = numBundle * numLayers;
      else newTotalPcsValue = "";
      newFormData.totalPcs = newTotalPcsValue;
    }

    const numTotalPcs = Number(newTotalPcsValue);
    if (
      name === "totalPcs" ||
      ((name === "totalBundle" || name === "actualLayers") &&
        formData.totalPcs !== newTotalPcsValue)
    ) {
      if (numTotalPcs > 0) {
        if (newFormData.aqlData?.totalPcsForAQL !== numTotalPcs) {
          fetchAQLDetails(numTotalPcs, newFormData);
          return;
        }
      } else {
        newFormData.aqlData = {
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null,
          totalPcsForAQL: 0
        };
      }
    }
    onFormDataChange(newFormData);
  };

  const handleDateChange = (date) => {
    onFormDataChange({ ...formData, inspectionDate: date });
  };

  const handleMachineNoChange = (e) => {
    onFormDataChange({
      ...formData,
      machineNo: e.target.value,
      operatorData: null
    });
  };

  const fetchMoNumbers = useCallback(
    async (searchTerm) => {
      if (searchTerm.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term: searchTerm }
        });
        setMoNoOptions(response.data || []);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error(t("scc.errorFetchingMoLog"), error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (moNoSearch && (moNoSearch !== formData.moNo || !formData.moNo)) {
        fetchMoNumbers(moNoSearch);
      } else if (!moNoSearch) {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, formData.moNo, fetchMoNumbers]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    setShowMoNoDropdown(false);
    onFormDataChange({
      ...formData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      batchNo: "",
      tableNo: "",
      actualLayers: "",
      totalBundle: "",
      totalPcs: "",
      defects: [],
      // Keep remarks, images, operatorData
      aqlData: {
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null,
        totalPcsForAQL: 0
      },
      defectsQty: 0,
      result: "Pending",
      defectRate: 0
    });
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
    setAvailableColors([]);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.moNo) {
        if (
          formData.buyer ||
          formData.buyerStyle ||
          formData.color ||
          availableColors.length > 0
        ) {
          onFormDataChange({
            ...formData,
            buyer: "",
            buyerStyle: "",
            color: ""
          });
          setAvailableColors([]);
        }
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${formData.moNo}`
        );
        const details = response.data;
        onFormDataChange({
          ...formData,
          buyer: details.engName || "N/A",
          buyerStyle: details.custStyle || "N/A",
          color: ""
        });
        setAvailableColors(details.colors || []);
        setTableNoSearchTerm("");
        setAllTableNoOptions([]);
        setFilteredTableNoOptions([]);
      } catch (error) {
        console.error(t("scc.errorFetchingOrderDetailsLog"), error);
        onFormDataChange({
          ...formData,
          buyer: "",
          buyerStyle: "",
          color: ""
        });
        setAvailableColors([]);
        setTableNoSearchTerm("");
        setAllTableNoOptions([]);
        setFilteredTableNoOptions([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    if (formData.moNo) fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moNo, t, onFormDataChange]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    onFormDataChange({
      ...formData,
      color: newColor,
      tableNo: "",
      actualLayers: "",
      totalPcs: "",
      aqlData: {
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null,
        totalPcsForAQL: 0
      },
      defectsQty: 0,
      result: "Pending",
      defectRate: 0
    });
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
  };

  const fetchAllTableNumbersForMOColor = useCallback(async () => {
    if (!formData.moNo || !formData.color) {
      setAllTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    setCutPanelDetailsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
        { params: { styleNo: formData.moNo, color: formData.color } }
      );
      const tables = (response.data || []).map((item) =>
        typeof item === "object" ? item.TableNo : item
      );
      setAllTableNoOptions(tables);
    } catch (error) {
      console.error(t("sccHTInspection.errorFetchingTableNos"), error);
      setAllTableNoOptions([]);
    } finally {
      setCutPanelDetailsLoading(false);
    }
  }, [formData.moNo, formData.color, t]);

  useEffect(() => {
    if (formData.moNo && formData.color) {
      fetchAllTableNumbersForMOColor();
    } else {
      setAllTableNoOptions([]);
    }
  }, [formData.moNo, formData.color, fetchAllTableNumbersForMOColor]);

  const handleTableNoSearchChange = (e) => {
    const searchTerm = e.target.value;
    setTableNoSearchTerm(searchTerm);
    setTableNoManuallyEntered(true);
    setShowTableNoDropdown(
      searchTerm.trim() !== "" || allTableNoOptions.length > 0
    );
    if (searchTerm === "") {
      setFilteredTableNoOptions(allTableNoOptions);
      onFormDataChange({
        ...formData,
        tableNo: "",
        actualLayers: "",
        totalPcs: "",
        aqlData: {
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null,
          totalPcsForAQL: 0
        }
      });
    }
  };

  const debouncedFilterOptions = useCallback(
    debounce((currentSearchTerm, currentAllOptions) => {
      if (currentSearchTerm.trim() !== "") {
        setFilteredTableNoOptions(
          currentAllOptions.filter((option) =>
            String(option)
              .toLowerCase()
              .includes(currentSearchTerm.toLowerCase())
          )
        );
      } else {
        setFilteredTableNoOptions(currentAllOptions);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedFilterOptions(tableNoSearchTerm, allTableNoOptions);
  }, [tableNoSearchTerm, allTableNoOptions, debouncedFilterOptions]);

  const handleTableNoSelect = async (selectedTable) => {
    const selectedTableNo =
      typeof selectedTable === "object" ? selectedTable.TableNo : selectedTable;
    setTableNoSearchTerm(selectedTableNo);
    setShowTableNoDropdown(false);
    setTableNoManuallyEntered(false);
    setCutPanelDetailsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-details`,
        {
          params: {
            styleNo: formData.moNo,
            tableNo: selectedTableNo,
            color: formData.color
          }
        }
      );
      const cutPanelDetails = response.data;
      const actualLayersValue =
        cutPanelDetails.ActualLayer != null
          ? Number(cutPanelDetails.ActualLayer)
          : cutPanelDetails.PlanLayer != null
          ? Number(cutPanelDetails.PlanLayer)
          : "";

      const numBundle = Number(formData.totalBundle) || 0;
      const newTotalPcs =
        numBundle > 0 && actualLayersValue > 0
          ? numBundle * actualLayersValue
          : "";

      const newFormData = {
        ...formData,
        tableNo: selectedTableNo,
        actualLayers: actualLayersValue,
        totalPcs: newTotalPcs
      };

      if (newTotalPcs > 0) {
        fetchAQLDetails(newTotalPcs, newFormData);
      } else {
        onFormDataChange({
          ...newFormData,
          aqlData: {
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null,
            totalPcsForAQL: 0
          }
        });
      }
    } catch (error) {
      console.error(t("sccHTInspection.errorFetchingCutPanelDetails"), error);
      onFormDataChange({
        ...formData,
        tableNo: selectedTableNo,
        actualLayers: "",
        totalPcs: "",
        aqlData: {
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null,
          totalPcsForAQL: 0
        }
      });
    } finally {
      setCutPanelDetailsLoading(false);
    }
  };

  const handleTableNoInputBlur = () => {
    const searchTermAtBlur = tableNoSearchTerm;
    setTimeout(() => {
      if (
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(document.activeElement)
      ) {
        setShowTableNoDropdown(false);
      }
      if (tableNoManuallyEnteredRef.current) {
        const trimmedSearchTerm = searchTermAtBlur.trim();
        if (formData.tableNo !== trimmedSearchTerm) {
          onFormDataChange({
            ...formData,
            tableNo: trimmedSearchTerm,
            actualLayers: "",
            totalPcs: "",
            aqlData: {
              sampleSizeLetterCode: "",
              sampleSize: null,
              acceptDefect: null,
              rejectDefect: null,
              totalPcsForAQL: 0
            }
          });
        }
        setTableNoManuallyEntered(false);
      }
    }, 150);
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
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(event.target) &&
        !tableNoInputRef.current?.contains(event.target)
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddDefectToReport = (defect) => {
    onFormDataChange({
      ...formData,
      defects: [...(formData.defects || []), { ...defect, count: 1 }]
    });
  };
  const handleRemoveDefectFromReport = (idx) => {
    onFormDataChange({
      ...formData,
      defects: formData.defects.filter((_, i) => i !== idx)
    });
  };
  const handleUpdateDefectCountInReport = (idx, count) => {
    const newDefects = [...(formData.defects || [])];
    if (newDefects[idx])
      newDefects[idx] = { ...newDefects[idx], count: Math.max(0, count) };
    onFormDataChange({ ...formData, defects: newDefects });
  };
  const handleImageChangeForDefect = (file, url) => {
    onFormDataChange({
      ...formData,
      defectImageFile: file,
      defectImageUrl: url
    });
  };
  const handleImageRemoveForDefect = () => {
    onFormDataChange({
      ...formData,
      defectImageFile: null,
      defectImageUrl: null
    });
  };
  const handleRemarksChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_REMARKS_LENGTH) {
      onFormDataChange({ ...formData, remarks: val });
    }
  };

  const handleSubmit = async () => {
    // The derived data (result, defectRate, etc.) should already be current on formData
    // due to the useEffect that calculates it. This is a final check.
    const currentDefectsQty =
      formData.defects?.reduce((sum, defect) => sum + defect.count, 0) || 0;
    let currentDefectRate = 0;
    let currentResult = "Pending";
    if (formData.aqlData?.sampleSize && formData.aqlData.sampleSize > 0) {
      currentDefectRate = parseFloat(
        ((currentDefectsQty / formData.aqlData.sampleSize) * 100).toFixed(2)
      );
      if (formData.aqlData.acceptDefect !== null) {
        currentResult =
          currentDefectsQty <= formData.aqlData.acceptDefect
            ? "Pass"
            : "Reject";
      }
    } else if (formData.aqlData?.sampleSize === 0) {
      currentResult = currentDefectsQty === 0 ? "Pass" : "Reject";
    }

    const finalPayload = {
      ...formData,
      inspectionDate:
        formData.inspectionDate instanceof Date
          ? formData.inspectionDate.toISOString()
          : new Date(formData.inspectionDate).toISOString(),
      actualLayers: Number(formData.actualLayers),
      totalBundle: Number(formData.totalBundle),
      totalPcs: Number(formData.totalPcs),
      defects: formData.defects.map((d) => ({
        no: d.no,
        defectNameEng: d.defectNameEng,
        defectNameKhmer: d.defectNameKhmer,
        defectNameChinese: d.defectNameChinese,
        count: d.count
      })),
      remarks: formData.remarks?.trim() || "NA",
      defectsQty: currentDefectsQty,
      defectRate: currentDefectRate,
      result: currentResult
    };

    if (
      !finalPayload.inspectionDate ||
      !finalPayload.machineNo ||
      !finalPayload.moNo ||
      !finalPayload.color ||
      !finalPayload.batchNo ||
      !finalPayload.tableNo ||
      finalPayload.actualLayers <= 0 ||
      finalPayload.totalBundle <= 0 ||
      finalPayload.totalPcs <= 0 ||
      finalPayload.aqlData?.sampleSize === null ||
      finalPayload.aqlData?.sampleSize < 0 ||
      finalPayload.aqlData?.acceptDefect === null ||
      finalPayload.aqlData?.rejectDefect === null
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t(
          "sccHTInspection.validation.fillAllRequired",
          "Please fill all required fields including AQL details before submitting."
        ),
        "warning"
      );
      return;
    }

    setIsSubmittingData(true);
    try {
      const success = await onFormSubmit(formType, finalPayload);
      if (success) {
        setMoNoSearch("");
        setTableNoSearchTerm("");
      }
    } catch (error) {
      // Parent handles error display
    } finally {
      setIsSubmittingData(false);
    }
  };

  const getResultCellBG = (res) =>
    res === "Pass"
      ? "bg-green-100 text-green-700"
      : res === "Reject"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";
  const isLoading =
    orderDetailsLoading ||
    aqlDetailsLoading ||
    defectsLoading ||
    cutPanelDetailsLoading ||
    parentIsSubmitting ||
    isSubmittingData ||
    operatorDataLoading;

  if (!user)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-800">
        {t("sccHTInspection.title")}
      </h2>
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[150]">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          <div>
            <label htmlFor="htInspDate" className={labelClasses}>
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
              id="htInspDate"
            />
          </div>
          <div>
            <label htmlFor="htInspMachineNo" className={labelClasses}>
              {t("scc.machineNo")}
            </label>
            <select
              id="htInspMachineNo"
              name="machineNo"
              value={formData.machineNo || ""}
              onChange={handleMachineNoChange}
              className={`${inputFieldClasses} py-1.5`}
              required
            >
              <option value="">{t("scc.selectMachine")}</option>
              {Array.from({ length: 15 }, (_, i) => String(i + 1)).map(
                (num) => (
                  <option key={`machine-${num}`} value={num}>
                    {num}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="relative md:col-span-1">
            <label htmlFor="htInspMoNoSearch" className={labelClasses}>
              {t("scc.moNo")}
            </label>
            <div className="relative mt-1" ref={moNoDropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="htInspMoNoSearch"
                value={moNoSearch}
                ref={moNoInputRef}
                onChange={(e) => setMoNoSearch(e.target.value)}
                onFocus={() => {
                  if (moNoSearch && moNoOptions.length === 0)
                    fetchMoNumbers(moNoSearch);
                  setShowMoNoDropdown(true);
                }}
                placeholder={t("scc.searchMoNo")}
                className={`${inputFieldClasses} pl-9 py-1.5`}
                required
                autoComplete="off"
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
          <div className="md:col-span-1">
            <label className={labelClasses}>{t("scc.buyer")}</label>
            <input
              type="text"
              value={formData.buyer || ""}
              readOnly
              className={`${inputFieldReadonlyClasses} py-1.5`}
            />
          </div>
          <div className="md:col-span-1">
            <label className={labelClasses}>{t("scc.buyerStyle")}</label>
            <input
              type="text"
              value={formData.buyerStyle || ""}
              readOnly
              className={`${inputFieldReadonlyClasses} py-1.5`}
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="htInspColor" className={labelClasses}>
              {t("scc.color")}
            </label>
            <select
              id="htInspColor"
              name="color"
              value={formData.color || ""}
              onChange={handleColorChange}
              className={`${inputFieldClasses} py-1.5`}
              disabled={
                !formData.moNo ||
                availableColors.length === 0 ||
                orderDetailsLoading
              }
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
          <div className="md:col-span-1">
            <label htmlFor="htInspBatchNo" className={labelClasses}>
              {t("sccHTInspection.batchNo")}
            </label>
            <input
              type="text"
              id="htInspBatchNo"
              name="batchNo"
              value={formData.batchNo || ""}
              onChange={handleInputChange}
              className={`${inputFieldClasses} py-1.5`}
              placeholder="e.g. 001"
              maxLength={3}
              inputMode="numeric"
              pattern="[0-9]{3}"
              required
            />
          </div>
        </div>

        <div className="lg:col-span-1 lg:max-w-[240px] w-full self-start lg:mt-1">
          <div className="bg-slate-50 p-3 rounded-lg shadow border border-slate-200 h-full flex flex-col justify-center items-center min-h-[100px]">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 self-start">
              {t("scc.operatorData")}
            </h3>
            {operatorDataLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : formData.operatorData && formData.operatorData.emp_id ? (
              <div className="text-center w-full flex flex-col items-center">
                {formData.operatorData.emp_face_photo ? (
                  <img
                    src={getFacePhotoUrl(formData.operatorData.emp_face_photo)}
                    alt={formData.operatorData.emp_eng_name || "Operator"}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-200 mb-1"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      // Optionally show a placeholder icon inside this div
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder =
                          parent.querySelector(".placeholder-icon");
                        if (placeholder) placeholder.style.display = "flex";
                      }
                    }}
                  />
                ) : (
                  <UserCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mb-1" />
                )}
                <p
                  className="text-xs font-medium text-slate-800 truncate w-full px-1"
                  title={formData.operatorData.emp_id}
                >
                  {formData.operatorData.emp_id}
                </p>
                <p
                  className="text-[10px] text-slate-500 truncate w-full px-1"
                  title={formData.operatorData.emp_eng_name}
                >
                  {formData.operatorData.emp_eng_name || "N/A"}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <UserCircle2 className="w-10 h-10 mb-1" />
                <p className="text-[11px]">{t("scc.noOperatorAssigned")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-md font-semibold text-gray-700 mb-2">
          {t("sccHTInspection.inspectionDetails")}
        </h3>
        <div
          className={`relative bg-white rounded-md shadow ${
            showTableNoDropdown ? "overflow-visible" : "overflow-x-auto"
          }`}
        >
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.tableNo")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.actualLayers")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalBundle")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalPcs")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.totalInspectedQty")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.defectsQty")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.defectRate")}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                  {t("sccHTInspection.result")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-2 py-1 whitespace-nowrap">
                  <div
                    className="relative z-[40]"
                    ref={tableNoDropdownWrapperRef}
                  >
                    <input
                      type="text"
                      ref={tableNoInputRef}
                      value={tableNoSearchTerm}
                      onChange={handleTableNoSearchChange}
                      onFocus={() => {
                        if (
                          formData.moNo &&
                          formData.color &&
                          (allTableNoOptions.length === 0 || tableNoSearchTerm)
                        ) {
                          if (
                            allTableNoOptions.length === 0 &&
                            !cutPanelDetailsLoading
                          )
                            fetchAllTableNumbersForMOColor();
                        }
                        setShowTableNoDropdown(true);
                      }}
                      onBlur={handleTableNoInputBlur}
                      placeholder={t("sccHTInspection.searchOrEnterTableNo")}
                      className={`${inputFieldClasses} py-1.5 w-full`}
                      disabled={
                        !formData.moNo ||
                        !formData.color ||
                        cutPanelDetailsLoading
                      }
                      autoComplete="off"
                    />
                    {showTableNoDropdown &&
                      filteredTableNoOptions.length > 0 && (
                        <ul className="absolute z-[50] mt-1 w-full bg-white shadow-lg max-h-40 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm top-full left-0">
                          {filteredTableNoOptions.map((tableOpt) => (
                            <li
                              key={
                                typeof tableOpt === "object"
                                  ? tableOpt.TableNo
                                  : tableOpt
                              }
                              onClick={() => handleTableNoSelect(tableOpt)}
                              className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-500 hover:text-white"
                            >
                              {typeof tableOpt === "object"
                                ? tableOpt.TableNo
                                : tableOpt}
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    name="actualLayers"
                    value={
                      formData.actualLayers === null ||
                      formData.actualLayers === undefined
                        ? ""
                        : formData.actualLayers
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5 w-full`}
                    inputMode="numeric"
                    min="0"
                    disabled={
                      cutPanelDetailsLoading &&
                      !tableNoManuallyEnteredRef.current
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    name="totalBundle"
                    value={
                      formData.totalBundle === null ||
                      formData.totalBundle === undefined
                        ? ""
                        : formData.totalBundle
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5 w-full`}
                    inputMode="numeric"
                    min="0"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    name="totalPcs"
                    value={
                      formData.totalPcs === null ||
                      formData.totalPcs === undefined
                        ? ""
                        : formData.totalPcs
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5 w-full ${
                      Number(formData.totalBundle) > 0 &&
                      Number(formData.actualLayers) > 0
                        ? "bg-yellow-50"
                        : ""
                    }`}
                    inputMode="numeric"
                    min="0"
                  />
                </td>
                <td className="px-3 py-2">
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    formData.aqlData?.sampleSize ?? "N/A"
                  )}
                </td>
                <td className="px-3 py-2">{formData.defectsQty}</td>
                <td
                  className={`px-3 py-2 font-medium ${getResultCellBG(
                    formData.result
                  )}`}
                >
                  {formData.aqlData?.sampleSize === null ||
                  formData.aqlData?.sampleSize === 0
                    ? "0.00%"
                    : `${formData.defectRate?.toFixed(2) ?? "0.00"}%`}
                </td>
                <td
                  className={`px-3 py-2 font-medium ${getResultCellBG(
                    formData.result
                  )}`}
                >
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t(`scc.${formData.result.toLowerCase()}`, formData.result)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {Number(formData.totalPcs) > 0 &&
        !aqlDetailsLoading &&
        formData.aqlData?.sampleSize !== null && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
            <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
              <ListChecks size={18} className="mr-2" />
              {t("sccHTInspection.aqlInfoTitle")}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div className="flex items-center">
                <Filter size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlType")}:{" "}
                <strong className="ml-1">
                  {formData.aqlData.type || "General"}
                </strong>
              </div>
              <div className="flex items-center">
                <TrendingUp size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlLevel")}:{" "}
                <strong className="ml-1">
                  {formData.aqlData.level || "II"}
                </strong>
              </div>
              <div className="flex items-center">
                <FileText size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.sampleSizeCode")}:{" "}
                <strong className="ml-1">
                  {formData.aqlData.sampleSizeLetterCode || "N/A"}
                </strong>
              </div>
              <div className="flex items-center">
                <Users size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlSampleReq")}:{" "}
                <strong className="ml-1">{formData.aqlData.sampleSize}</strong>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle size={14} className="mr-1.5" />
                Ac:{" "}
                <strong className="ml-1">
                  {formData.aqlData.acceptDefect}
                </strong>
              </div>
              <div className="flex items-center text-red-600">
                <AlertTriangle size={14} className="mr-1.5" />
                Re:{" "}
                <strong className="ml-1">
                  {formData.aqlData.rejectDefect}
                </strong>
              </div>
            </div>
          </div>
        )}
      {Number(formData.totalPcs) > 0 && aqlDetailsLoading && (
        <div className="mt-4 p-3 flex justify-center items-center">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      )}

      <div className="mt-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-gray-700">
            {t("sccHTInspection.defectDetailsTitle")}
          </h3>
          <button
            type="button"
            onClick={() => setShowDefectBox(true)}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600"
            disabled={
              defectsLoading ||
              formData.aqlData?.sampleSize === null ||
              formData.aqlData?.sampleSize <= 0
            }
          >
            {t("sccHTInspection.manageDefectsBtn")}{" "}
            {defectsLoading && (
              <Loader2 size={14} className="animate-spin ml-2" />
            )}
          </button>
        </div>
        {formData.defects && formData.defects.length > 0 ? (
          <div className="space-y-1 text-xs border p-2 rounded-md bg-gray-50">
            {formData.defects.map((defect, index) => (
              <div
                key={defect.no || index}
                className="flex justify-between items-center p-1.5 border-b last:border-b-0"
              >
                <span className="flex-1 pr-2">
                  {i18n.language === "kh" && defect.defectNameKhmer
                    ? defect.defectNameKhmer
                    : i18n.language === "zh" && defect.defectNameChinese
                    ? defect.defectNameChinese
                    : defect.defectNameEng}
                </span>
                <span className="font-medium">{defect.count}</span>
              </div>
            ))}
            <div className="flex justify-between p-1.5 bg-gray-100 rounded-b font-semibold mt-1">
              <span>{t("sccHTInspection.totalDefects")}:</span>
              <span>{formData.defectsQty}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            {t("sccHTInspection.noDefectsRecorded")}
          </p>
        )}
      </div>

      {showDefectBox && (
        <DefectBoxHT
          defects={formData.defects || []}
          availableDefects={availableSccDefects}
          onClose={() => setShowDefectBox(false)}
          onAddDefect={handleAddDefectToReport}
          onRemoveDefect={handleRemoveDefectFromReport}
          onUpdateDefectCount={handleUpdateDefectCountInReport}
        />
      )}

      <div className="mt-5">
        <label htmlFor="htInspRemarks" className={labelClasses}>
          {t("sccHTInspection.remarks")}
        </label>
        <textarea
          id="htInspRemarks"
          name="remarks"
          rows="3"
          value={formData.remarks || ""}
          onChange={handleRemarksChange}
          className={inputFieldClasses}
          placeholder={t("sccHTInspection.remarksPlaceholder")}
          maxLength={MAX_REMARKS_LENGTH}
        ></textarea>
        <p className="text-xs text-gray-500 text-right mt-0.5">
          {formData.remarks?.length || 0} / {MAX_REMARKS_LENGTH}
        </p>
      </div>
      <div className="mt-5">
        <SCCImageUpload
          label={t("sccHTInspection.defectImageLabel")}
          onImageChange={handleImageChangeForDefect}
          onImageRemove={handleImageRemoveForDefect}
          initialImageUrl={formData.defectImageUrl}
          imageType="htInspectionDefect"
        />
      </div>
      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {(parentIsSubmitting || isSubmittingData) && (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          )}
          {t("scc.submit")}
        </button>
      </div>
    </div>
  );
};

export default HTInspectionReport;
