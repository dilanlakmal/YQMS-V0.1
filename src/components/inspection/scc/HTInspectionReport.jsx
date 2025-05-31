import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Filter,
  ListChecks,
  Loader2,
  Search,
  TrendingUp,
  Users
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
import DefectBoxHT from "./DefectBoxHT";
import SCCImageUpload from "./SCCImageUpload";

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
  formData: parentFormData,
  onFormDataChange,
  onFormSubmit,
  isSubmitting: parentIsSubmitting,
  formType
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [localFormData, setLocalFormData] = useState(() => ({
    ...parentFormData,
    tableNo: parentFormData.tableNo || "",
    actualLayers:
      parentFormData.actualLayers === undefined ||
      parentFormData.actualLayers === null
        ? ""
        : Number(parentFormData.actualLayers),
    totalBundle:
      parentFormData.totalBundle === undefined ||
      parentFormData.totalBundle === null
        ? ""
        : Number(parentFormData.totalBundle),
    totalPcs:
      parentFormData.totalPcs === undefined || parentFormData.totalPcs === null
        ? ""
        : Number(parentFormData.totalPcs),
    defects: parentFormData.defects || [],
    remarks: parentFormData.remarks || ""
  }));

  const [moNoSearch, setMoNoSearch] = useState(parentFormData.moNo || "");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  const [tableNoSearchTerm, setTableNoSearchTerm] = useState(
    parentFormData.tableNo || ""
  );
  const [allTableNoOptions, setAllTableNoOptions] = useState([]);
  const [filteredTableNoOptions, setFilteredTableNoOptions] = useState([]);
  const [showTableNoDropdown, setShowTableNoDropdown] = useState(false);
  const [cutPanelDetailsLoading, setCutPanelDetailsLoading] = useState(false);
  const [tableNoManuallyEntered, setTableNoManuallyEntered] = useState(false);

  // *** FIX: Ref to track tableNoManuallyEntered for setTimeout in onBlur ***
  const tableNoManuallyEnteredRef = useRef(tableNoManuallyEntered);

  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [aqlDetailsLoading, setAqlDetailsLoading] = useState(false);
  const [defectsLoading, setDefectsLoading] = useState(false);

  const [aqlData, setAqlData] = useState({
    sampleSizeLetterCode: "",
    sampleSize: null,
    acceptDefect: null,
    rejectDefect: null
  });
  const [showDefectBox, setShowDefectBox] = useState(false);
  const [availableSccDefects, setAvailableSccDefects] = useState([]);
  const [isSubmittingData, setIsSubmittingData] = useState(false);

  const moNoInputRef = useRef(null);
  const moNoDropdownRef = useRef(null);
  const tableNoInputRef = useRef(null);
  const tableNoDropdownWrapperRef = useRef(null);

  // *** FIX: Keep tableNoManuallyEnteredRef in sync with tableNoManuallyEntered state ***
  useEffect(() => {
    tableNoManuallyEnteredRef.current = tableNoManuallyEntered;
  }, [tableNoManuallyEntered]);

  const updateParent = useCallback(
    (updatedData) => {
      onFormDataChange(updatedData);
    },
    [onFormDataChange]
  );

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
        console.error(t("sccHTInspection.errorFetchingAQL"), error);
        setAqlData({
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        });
      } finally {
        setAqlDetailsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    setLocalFormData({
      _id: parentFormData._id || null,
      inspectionDate: parentFormData.inspectionDate
        ? new Date(parentFormData.inspectionDate)
        : new Date(),
      machineNo: parentFormData.machineNo || "",
      moNo: parentFormData.moNo || "",
      buyer: parentFormData.buyer || "",
      buyerStyle: parentFormData.buyerStyle || "",
      color: parentFormData.color || "",
      batchNo: parentFormData.batchNo || "",
      tableNo: parentFormData.tableNo || "",
      actualLayers:
        parentFormData.actualLayers === undefined ||
        parentFormData.actualLayers === null
          ? ""
          : Number(parentFormData.actualLayers),
      totalBundle:
        parentFormData.totalBundle === undefined ||
        parentFormData.totalBundle === null
          ? ""
          : Number(parentFormData.totalBundle),
      totalPcs:
        parentFormData.totalPcs === undefined ||
        parentFormData.totalPcs === null
          ? ""
          : Number(parentFormData.totalPcs),
      defects: parentFormData.defects || [],
      remarks: parentFormData.remarks || "",
      defectImageFile: parentFormData.defectImageFile || null,
      defectImageUrl: parentFormData.defectImageUrl || null,
      aqlData: parentFormData.aqlData || {
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      },
      defectsQty: parentFormData.defectsQty || 0,
      result: parentFormData.result || "Pending"
    });

    setMoNoSearch(parentFormData.moNo || "");
    setShowMoNoDropdown(false);
    if (!parentFormData.moNo) setAvailableColors([]);

    setTableNoSearchTerm(parentFormData.tableNo || "");
    setShowTableNoDropdown(false);
    if (!parentFormData.moNo || !parentFormData.color) {
      setAllTableNoOptions([]);
      setFilteredTableNoOptions([]);
    }

    if (parentFormData.totalPcs && Number(parentFormData.totalPcs) > 0) {
      fetchAQLDetails(Number(parentFormData.totalPcs));
    } else {
      setAqlData({
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      });
    }
  }, [parentFormData, fetchAQLDetails]);

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

  const calculateTotalPcs = (bundle, layers) => {
    const numBundle = Number(bundle);
    const numLayers = Number(layers);
    if (
      !isNaN(numBundle) &&
      !isNaN(numLayers) &&
      numBundle > 0 &&
      numLayers > 0
    ) {
      return numBundle * numLayers;
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (["totalBundle", "actualLayers", "totalPcs"].includes(name)) {
      processedValue = value === "" ? "" : parseInt(value, 10);
      if (value !== "" && isNaN(processedValue))
        processedValue = localFormData[name] || "";
      else if (value === "") processedValue = "";
    }
    if (name === "batchNo")
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 3);

    setLocalFormData((prev) => {
      const newLocalData = { ...prev, [name]: processedValue };
      const numBundle = Number(newLocalData.totalBundle);
      const numLayers = Number(newLocalData.actualLayers);

      if (name === "totalBundle" || name === "actualLayers") {
        if (numBundle > 0 && numLayers > 0)
          newLocalData.totalPcs = numBundle * numLayers;
        else if (name !== "totalPcs") newLocalData.totalPcs = "";
      }

      const numTotalPcs = Number(newLocalData.totalPcs);
      if (
        name === "totalPcs" ||
        ((name === "totalBundle" || name === "actualLayers") && numTotalPcs > 0)
      ) {
        if (numTotalPcs > 0) fetchAQLDetails(numTotalPcs);
        else
          setAqlData({
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          });
      }
      updateParent(newLocalData);
      return newLocalData;
    });
  };

  const handleDateChange = (date) => {
    const newLocalData = { ...localFormData, inspectionDate: date };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
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
      if (
        moNoSearch &&
        (moNoSearch !== localFormData.moNo || !localFormData.moNo)
      ) {
        fetchMoNumbers(moNoSearch);
      } else if (!moNoSearch) {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [moNoSearch, localFormData.moNo, fetchMoNumbers]);

  const handleMoSelect = (selectedMo) => {
    setMoNoSearch(selectedMo);
    setShowMoNoDropdown(false);
    const newLocalData = {
      ...localFormData,
      moNo: selectedMo,
      buyer: "",
      buyerStyle: "",
      color: "",
      tableNo: "",
      actualLayers: "",
      totalPcs: ""
    };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
    setAvailableColors([]);
    setAqlData({
      sampleSizeLetterCode: "",
      sampleSize: null,
      acceptDefect: null,
      rejectDefect: null
    });
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!localFormData.moNo) {
        if (
          localFormData.buyer ||
          localFormData.buyerStyle ||
          localFormData.color ||
          availableColors.length > 0
        ) {
          const clearedData = {
            ...localFormData,
            buyer: "",
            buyerStyle: "",
            color: ""
          };
          setLocalFormData(clearedData);
          updateParent(clearedData);
          setAvailableColors([]);
        }
        return;
      }
      setOrderDetailsLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/order-details/${localFormData.moNo}`
        );
        const details = response.data;
        const newLocal = {
          ...localFormData,
          buyer: details.engName || "N/A",
          buyerStyle: details.custStyle || "N/A",
          color: ""
        };
        setLocalFormData(newLocal);
        updateParent(newLocal);
        setAvailableColors(details.colors || []);
        setTableNoSearchTerm("");
        setAllTableNoOptions([]);
        setFilteredTableNoOptions([]);
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
        setTableNoSearchTerm("");
        setAllTableNoOptions([]);
        setFilteredTableNoOptions([]);
      } finally {
        setOrderDetailsLoading(false);
      }
    };
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFormData.moNo, t]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    const newLocalData = {
      ...localFormData,
      color: newColor,
      tableNo: "",
      actualLayers: "",
      totalPcs: ""
    };
    setLocalFormData(newLocalData);
    updateParent(newLocalData);
    setTableNoSearchTerm("");
    setAllTableNoOptions([]);
    setFilteredTableNoOptions([]);
    setAqlData({
      sampleSizeLetterCode: "",
      sampleSize: null,
      acceptDefect: null,
      rejectDefect: null
    });
  };

  const fetchAllTableNumbersForMOColor = useCallback(async () => {
    if (!localFormData.moNo || !localFormData.color) {
      setAllTableNoOptions([]);
      setShowTableNoDropdown(false);
      return;
    }
    setCutPanelDetailsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-table-nos`,
        {
          params: { styleNo: localFormData.moNo, color: localFormData.color }
        }
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
  }, [localFormData.moNo, localFormData.color, t]);

  useEffect(() => {
    if (localFormData.moNo && localFormData.color) {
      fetchAllTableNumbersForMOColor();
    } else {
      setAllTableNoOptions([]);
    }
  }, [localFormData.moNo, localFormData.color, fetchAllTableNumbersForMOColor]);

  const handleTableNoSearchChange = (e) => {
    const searchTerm = e.target.value;
    setTableNoSearchTerm(searchTerm);
    setTableNoManuallyEntered(true); // User is typing

    setShowTableNoDropdown(
      searchTerm.trim() !== "" || allTableNoOptions.length > 0
    );

    if (searchTerm === "") {
      setFilteredTableNoOptions(allTableNoOptions);

      // If search is cleared, also clear tableNo in formData
      setLocalFormData((prev) => {
        if (prev.tableNo === "") return prev; // No change needed
        const updatedData = {
          ...prev,
          tableNo: "",
          actualLayers: "",
          totalPcs: ""
        };
        updateParent(updatedData);
        setAqlData({
          sampleSizeLetterCode: "",
          sampleSize: null,
          acceptDefect: null,
          rejectDefect: null
        });
        return updatedData;
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

    setTableNoSearchTerm(selectedTableNo); // Update display in input to full selected value
    setShowTableNoDropdown(false);
    setTableNoManuallyEntered(false); // A selection was made, not manual entry
    setCutPanelDetailsLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/cutpanel-orders-details`,
        {
          params: {
            styleNo: localFormData.moNo,
            tableNo: selectedTableNo, // Use the full selected table number
            color: localFormData.color
          }
        }
      );
      const cutPanelDetails = response.data;
      const actualLayersValue =
        cutPanelDetails.ActualLayer !== undefined &&
        cutPanelDetails.ActualLayer !== null
          ? Number(cutPanelDetails.ActualLayer)
          : cutPanelDetails.PlanLayer !== undefined &&
            cutPanelDetails.PlanLayer !== null
          ? Number(cutPanelDetails.PlanLayer)
          : "";

      setLocalFormData((prev) => {
        const newLocalData = {
          ...prev,
          tableNo: selectedTableNo, // Set form data tableNo to full selected value
          actualLayers: actualLayersValue
        };
        const newTotalPcs = calculateTotalPcs(
          newLocalData.totalBundle, // Use current totalBundle from form
          actualLayersValue
        );
        newLocalData.totalPcs = newTotalPcs === null ? "" : newTotalPcs;

        if (newLocalData.totalPcs && Number(newLocalData.totalPcs) > 0) {
          fetchAQLDetails(Number(newLocalData.totalPcs));
        } else {
          setAqlData({
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          });
        }
        updateParent(newLocalData);
        return newLocalData;
      });
    } catch (error) {
      console.error(t("sccHTInspection.errorFetchingCutPanelDetails"), error);
      // Even if details fetch fails, update tableNo to what was selected
      setLocalFormData((prev) => {
        const updatedData = {
          ...prev,
          tableNo: selectedTableNo,
          actualLayers: "",
          totalPcs: ""
        };
        updateParent(updatedData);
        return updatedData;
      });
      setAqlData({
        sampleSizeLetterCode: "",
        sampleSize: null,
        acceptDefect: null,
        rejectDefect: null
      });
    } finally {
      setCutPanelDetailsLoading(false);
    }
  };

  // *** MODIFIED handleTableNoInputBlur using tableNoManuallyEnteredRef ***
  const handleTableNoInputBlur = () => {
    const searchTermAtBlur = tableNoSearchTerm; // Capture search term at the moment of blur

    setTimeout(() => {
      // Hide dropdown if focus is not on it or its children
      if (
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(document.activeElement)
      ) {
        setShowTableNoDropdown(false);
      }

      // Check the LATEST status of tableNoManuallyEntered using the ref
      if (tableNoManuallyEnteredRef.current) {
        // If true, it means no selection was made that reset the flag.
        // This is a blur from a manual typing state.
        setLocalFormData((prev) => {
          const trimmedSearchTerm = searchTermAtBlur.trim();
          if (prev.tableNo === trimmedSearchTerm) {
            // If current tableNo in form data already matches what was blurred, no data change needed.
            // However, we still need to reset the manual entry flag.
            return prev;
          }

          // If tableNo needs to be updated to the blurred search term
          const updatedData = {
            ...prev,
            tableNo: trimmedSearchTerm,
            actualLayers: "", // Reset dependent fields for manual entry
            totalPcs: ""
          };
          updateParent(updatedData);
          setAqlData({
            // Reset AQL data
            sampleSizeLetterCode: "",
            sampleSize: null,
            acceptDefect: null,
            rejectDefect: null
          });
          return updatedData;
        });
        // This manual entry blur has been processed, so reset the actual state flag.
        // This will, in turn, update tableNoManuallyEnteredRef.current via its useEffect.
        setTableNoManuallyEntered(false);
      }
      // If tableNoManuallyEnteredRef.current was false, it means a selection occurred.
      // handleTableNoSelect took care of setting tableNoSearchTerm, localFormData.tableNo,
      // and tableNoManuallyEntered state correctly.
      // So, the blur handler does nothing to the data in this case.
    }, 150);
  };

  const totalDefectsQty = useMemo(
    () =>
      localFormData.defects?.reduce((sum, defect) => sum + defect.count, 0) ||
      0,
    [localFormData.defects]
  );

  const inspectionResult = useMemo(() => {
    if (
      aqlData.acceptDefect === null ||
      aqlData.sampleSize === null ||
      aqlData.sampleSize <= 0
    )
      return "Pending";
    return totalDefectsQty <= aqlData.acceptDefect ? "Pass" : "Reject";
  }, [totalDefectsQty, aqlData.acceptDefect, aqlData.sampleSize]);

  useEffect(() => {
    const newLocalDataWithAqlResult = {
      ...localFormData,
      aqlData: {
        type: "General",
        level: "II",
        sampleSizeLetterCode: aqlData.sampleSizeLetterCode,
        sampleSize: aqlData.sampleSize,
        acceptDefect: aqlData.acceptDefect,
        rejectDefect: aqlData.rejectDefect
      },
      defectsQty: totalDefectsQty,
      result: inspectionResult
    };

    if (
      JSON.stringify(localFormData.aqlData) !==
        JSON.stringify(newLocalDataWithAqlResult.aqlData) ||
      localFormData.defectsQty !== newLocalDataWithAqlResult.defectsQty ||
      localFormData.result !== newLocalDataWithAqlResult.result
    ) {
      setLocalFormData((prevLocal) => ({
        ...prevLocal,
        ...newLocalDataWithAqlResult
      }));
      updateParent(newLocalDataWithAqlResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aqlData, totalDefectsQty, inspectionResult, updateParent]); // Added updateParent for completeness, though it's stable

  const handleAddDefectToReport = (defect) => {
    const newDefect = { ...defect, count: 1 };
    setLocalFormData((prev) => {
      const updatedDefects = [...(prev.defects || []), newDefect];
      const newLocal = { ...prev, defects: updatedDefects };
      // updateParent will be called by the useEffect watching aqlData, totalDefectsQty, inspectionResult
      return newLocal;
    });
  };

  const handleRemoveDefectFromReport = (idx) => {
    setLocalFormData((prev) => {
      const newDefects = [...(prev.defects || [])];
      newDefects.splice(idx, 1);
      const newLocal = { ...prev, defects: newDefects };
      // updateParent will be called by the useEffect
      return newLocal;
    });
  };

  const handleUpdateDefectCountInReport = (idx, count) => {
    setLocalFormData((prev) => {
      const newDefects = [...(prev.defects || [])];
      if (newDefects[idx])
        newDefects[idx] = { ...newDefects[idx], count: Math.max(0, count) };
      const newLocal = { ...prev, defects: newDefects };
      // updateParent will be called by the useEffect
      return newLocal;
    });
  };

  const handleImageChangeForDefect = (file, url) => {
    setLocalFormData((prev) => {
      const newLocal = {
        ...prev,
        defectImageFile: file,
        defectImageUrl: url
      };
      updateParent(newLocal);
      return newLocal;
    });
  };
  const handleImageRemoveForDefect = () => {
    setLocalFormData((prev) => {
      const newLocal = {
        ...prev,
        defectImageFile: null,
        defectImageUrl: null
      };
      updateParent(newLocal);
      return newLocal;
    });
  };
  const handleRemarksChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_REMARKS_LENGTH) {
      setLocalFormData((prev) => {
        const newLocal = { ...prev, remarks: val };
        updateParent(newLocal);
        return newLocal;
      });
    }
  };

  const handleSubmit = async () => {
    // localFormData already contains the latest aqlData, defectsQty, and result due to the syncing useEffect
    const {
      inspectionDate,
      machineNo,
      moNo,
      color,
      batchNo,
      tableNo,
      actualLayers,
      totalBundle,
      totalPcs: currentTotalPcs
    } = localFormData;

    if (
      !inspectionDate ||
      !machineNo ||
      !moNo ||
      !color ||
      !batchNo ||
      !tableNo
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccHTInspection.validation.fillBasicWithTable"),
        "warning"
      );
      return;
    }
    if (
      actualLayers === "" ||
      Number(actualLayers) <= 0 ||
      totalBundle === "" ||
      Number(totalBundle) <= 0 ||
      currentTotalPcs === "" ||
      Number(currentTotalPcs) <= 0
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccHTInspection.validation.fillBundlePcsLayers"),
        "warning"
      );
      return;
    }
    if (
      localFormData.aqlData?.sampleSize === null ||
      localFormData.aqlData?.sampleSize === undefined ||
      localFormData.aqlData?.sampleSize <= 0 ||
      localFormData.aqlData?.acceptDefect === null ||
      localFormData.aqlData?.acceptDefect === undefined ||
      localFormData.aqlData?.rejectDefect === null ||
      localFormData.aqlData?.rejectDefect === undefined
    ) {
      Swal.fire(
        t("scc.validationErrorTitle"),
        t("sccHTInspection.validation.aqlNotLoadedOrInvalid"),
        "warning"
      );
      return;
    }

    setIsSubmittingData(true);
    const payload = {
      ...localFormData,
      inspectionDate:
        localFormData.inspectionDate instanceof Date
          ? localFormData.inspectionDate.toISOString()
          : localFormData.inspectionDate,
      actualLayers: Number(localFormData.actualLayers),
      totalBundle: Number(localFormData.totalBundle),
      totalPcs: Number(localFormData.totalPcs),
      defects: localFormData.defects.map((d) => ({
        no: d.no,
        defectNameEng: d.defectNameEng,
        defectNameKhmer: d.defectNameKhmer, // Include all languages if backend expects them
        defectNameChinese: d.defectNameChinese,
        count: d.count
      })),
      remarks: localFormData.remarks?.trim() || "NA"
    };

    try {
      await onFormSubmit(formType, payload);
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
      : "bg-gray-100";
  const isLoading =
    orderDetailsLoading ||
    aqlDetailsLoading ||
    defectsLoading ||
    cutPanelDetailsLoading ||
    parentIsSubmitting ||
    isSubmittingData;

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
      // For Table No dropdown, its onBlur with setTimeout handles hiding.
      // The global click outside listener for tableNoDropdownWrapperRef could be removed
      // if onBlur is deemed sufficient, or kept as a fallback.
      // Let's ensure onBlur doesn't conflict with this. The onBlur's timeout
      // checks activeElement, so it should be okay.
      if (
        tableNoDropdownWrapperRef.current &&
        !tableNoDropdownWrapperRef.current.contains(event.target) &&
        !tableNoInputRef.current?.contains(event.target) // Don't hide if clicking back into input
      ) {
        setShowTableNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              onFocus={() => {
                if (moNoSearch && moNoOptions.length === 0)
                  fetchMoNumbers(moNoSearch);
                setShowMoNoDropdown(true);
              }}
              placeholder={t("scc.searchMoNo")}
              className={`${inputFieldClasses} pl-10`}
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
      </div>

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
            disabled={
              !localFormData.moNo ||
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
        <div>
          <label htmlFor="htInspBatchNo" className={labelClasses}>
            {t("sccHTInspection.batchNo")}
          </label>
          <input
            type="text"
            id="htInspBatchNo"
            name="batchNo"
            value={localFormData.batchNo || ""}
            onChange={handleInputChange}
            className={inputFieldClasses}
            placeholder="e.g. 001"
            maxLength={3}
            inputMode="numeric"
            pattern="[0-9]{3}"
            required
          />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-md font-semibold text-gray-700 mb-2">
          {t("sccHTInspection.inspectionDetails")}
        </h3>
        <div className="relative bg-white rounded-md shadow">
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.tableNo")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.actualLayers")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.totalBundle")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.totalPcs")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.totalInspectedQty")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
                  {t("sccHTInspection.defectsQty")}
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/6">
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
                          localFormData.moNo &&
                          localFormData.color &&
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
                        !localFormData.moNo ||
                        !localFormData.color ||
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
                      localFormData.actualLayers === null ||
                      localFormData.actualLayers === undefined
                        ? ""
                        : localFormData.actualLayers
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5 w-full`}
                    inputMode="numeric"
                    min="0"
                    disabled={
                      cutPanelDetailsLoading && // If details for a selected table are loading
                      !tableNoManuallyEnteredRef.current // Check ref for latest value
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    name="totalBundle"
                    value={
                      localFormData.totalBundle === null ||
                      localFormData.totalBundle === undefined
                        ? ""
                        : localFormData.totalBundle
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
                      localFormData.totalPcs === null ||
                      localFormData.totalPcs === undefined
                        ? ""
                        : localFormData.totalPcs
                    }
                    onChange={handleInputChange}
                    className={`${inputFieldClasses} py-1.5 w-full ${
                      Number(localFormData.totalBundle) > 0 &&
                      Number(localFormData.actualLayers) > 0
                        ? "bg-yellow-50"
                        : ""
                    }`}
                    inputMode="numeric"
                    min="0"
                  />
                </td>
                <td className="px-4 py-2">
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : localFormData.aqlData?.sampleSize !== null &&
                    localFormData.aqlData?.sampleSize !== undefined ? (
                    localFormData.aqlData.sampleSize
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-4 py-2">{localFormData.defectsQty}</td>
                <td
                  className={`px-4 py-2 font-medium ${getResultCellBG(
                    localFormData.result
                  )}`}
                >
                  {aqlDetailsLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t(
                      `scc.${localFormData.result.toLowerCase()}`,
                      localFormData.result
                    )
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {Number(localFormData.totalPcs) > 0 &&
        !aqlDetailsLoading &&
        localFormData.aqlData?.sampleSize !== null &&
        localFormData.aqlData?.sampleSize !== undefined && (
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
                  {localFormData.aqlData.type || "General"}
                </strong>
              </div>
              <div className="flex items-center">
                <TrendingUp size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlLevel")}:{" "}
                <strong className="ml-1">
                  {localFormData.aqlData.level || "II"}
                </strong>
              </div>
              <div className="flex items-center">
                <FileText size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.sampleSizeCode")}:{" "}
                <strong className="ml-1">
                  {localFormData.aqlData.sampleSizeLetterCode || "N/A"}
                </strong>
              </div>
              <div className="flex items-center">
                <Users size={14} className="mr-1.5 text-blue-600" />
                {t("sccHTInspection.aqlSampleReq")}:{" "}
                <strong className="ml-1">
                  {localFormData.aqlData.sampleSize}
                </strong>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle size={14} className="mr-1.5" />
                Ac:{" "}
                <strong className="ml-1">
                  {localFormData.aqlData.acceptDefect}
                </strong>
              </div>
              <div className="flex items-center text-red-600">
                <AlertTriangle size={14} className="mr-1.5" />
                Re:{" "}
                <strong className="ml-1">
                  {localFormData.aqlData.rejectDefect}
                </strong>
              </div>
            </div>
          </div>
        )}
      {Number(localFormData.totalPcs) > 0 && aqlDetailsLoading && (
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
              localFormData.aqlData?.sampleSize === null ||
              localFormData.aqlData?.sampleSize <= 0
            }
          >
            {t("sccHTInspection.manageDefectsBtn")}
            {defectsLoading && (
              <Loader2 size={14} className="animate-spin ml-2" />
            )}
          </button>
        </div>
        {localFormData.defects && localFormData.defects.length > 0 ? (
          <div className="space-y-1 text-xs border p-2 rounded-md bg-gray-50">
            {localFormData.defects.map((defect, index) => (
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
              <span>{localFormData.defectsQty}</span>
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
          defects={localFormData.defects || []}
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
          value={localFormData.remarks || ""}
          onChange={handleRemarksChange}
          className={inputFieldClasses}
          placeholder={t("sccHTInspection.remarksPlaceholder")}
          maxLength={MAX_REMARKS_LENGTH}
        ></textarea>
        <p className="text-xs text-gray-500 text-right mt-0.5">
          {localFormData.remarks?.length || 0} / {MAX_REMARKS_LENGTH}
        </p>
      </div>
      <div className="mt-5">
        <SCCImageUpload
          label={t("sccHTInspection.defectImageLabel")}
          onImageChange={handleImageChangeForDefect}
          onImageRemove={handleImageRemoveForDefect}
          initialImageUrl={localFormData.defectImageUrl}
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
