import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { allDefects } from "../constants/defects";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import {
  XCircle,
  Database,
  QrCode,
  Eye,
  EyeOff,
  Camera,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CEDatabase from "../components/inspection/qc_roving/CEDatabase";
import EmpQRCodeScanner from "../components/inspection/qc_roving/EmpQRCodeScanner";
import PreviewRoving from "../components/inspection/qc_roving/PreviewRoving";
import RovingCamera from "../components/inspection/qc_roving/RovingCamera";
import RovingData from "../components/inspection/qc_roving/RovingData";
import InlineWorkers from "../components/inspection/qc_roving/InlineWorkers";

const RovingPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [inspectionType, setInspectionType] = useState("Normal");
  const [spiStatus, setSpiStatus] = useState("");
  const [measurementStatus, setMeasurementStatus] = useState("");
  const [spiImage, setSpiImage] = useState(null);
  const [measurementImage, setMeasurementImage] = useState(null);
  const [showSpiCamera, setShowSpiCamera] = useState(false);
  const [showMeasurementCamera, setShowMeasurementCamera] = useState(false);
  const [garments, setGarments] = useState([]);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDefect, setSelectedDefect] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState("");
  const [language, setLanguage] = useState("khmer");
  const [garmentQuantity, setGarmentQuantity] = useState(5);
  const [activeTab, setActiveTab] = useState("form");
  const [operationData, setOperationData] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [showOperatorDetails, setShowOperatorDetails] = useState(false);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const moNoDropdownRef = useRef(null);
  const [inspectionRepOrdinal, setInspectionRepOrdinal] = useState('N/A');
  const [inspectionRepLoading, setInspectionRepLoading] = useState(false);
  const [inspectionsCompletedForProgress, setInspectionsCompletedForProgress] = useState(0);
  const [lineWorkerData, setLineWorkerData] = useState([]);
  const [lineWorkerDataLoading, setLineWorkerDataLoading] = useState(true);
  const [lineWorkerDataError, setLineWorkerDataError] = useState(null);

  

  const getNumericLineValue = useCallback((value) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const strValue = String(value).toLowerCase();
    const numericPart = strValue.replace(/[^0-9]/g, ''); 
    return numericPart ? parseInt(numericPart, 10) : null;
  }, []);

 
  useEffect(() => {
    const size = inspectionType === 'Critical' ? 15 : 5;
    setGarments(Array.from({ length: size }, () => ({ garment_defect_id: '', defects: [], status: 'Pass' })));
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setGarmentQuantity(size);
  }, [inspectionType]);

  const fetchLineWorkerInfo = useCallback(async () => {
    try {
      setLineWorkerDataLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/line-summary`);
      const transformedData = response.data.map(summary => ({
        lineNo: summary.line_no,
        realWorkerCount: summary.real_worker_count,
        editedWorkerCount: summary.edited_worker_count,
      }));
      setLineWorkerData(transformedData);
      setLineWorkerDataError(null);
    } catch (err) {
      console.error("Error fetching line summary for progress:", err);
      setLineWorkerDataError(t('qcRoving.lineWorkerFetchError', "Failed to fetch line worker data."));
      setLineWorkerData([]);
    } finally {
      setLineWorkerDataLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLineWorkerInfo();
  }, [fetchLineWorkerInfo]);

  useEffect(() => {
    if (!authLoading && user) {
      setScannedUserData({
        emp_id: user.emp_id || "N/A_USER_EMP_ID",
        eng_name: user.eng_name || "N/A_USER_ENG_NAME",
        kh_name: user.kh_name || "N/A_USER_KH_NAME", 
        job_title: user.job_title || "N/A_USER_JOB_TITLE", 
        dept_name: user.dept_name || "N/A_USER_DEPT_NAME", 
        sect_name: user.sect_name || "N/A_USER_SECT_NAME", 
      });
    } else if (!authLoading && !user) {
      setScannedUserData(null);
    }
  }, [user, authLoading]);

  const fetchInspectionRepInfo = useCallback(async () => {
    const toOrdinal = (n) => {
      if (typeof n !== 'number' || isNaN(n) || n <= 0) return String(n);
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    if (lineNo && currentDate) {
      setInspectionRepLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${month}/${day}/${year}`;
        const response = await axios.get(`${API_BASE_URL}/api/qc-inline-roving/inspection-time-info`, {
          params: {
            line_no: lineNo,
            inspection_date: formattedDate,
          },
        });
        const apiData = response.data;
        if (typeof apiData.inspectionRepOrdinal === 'string' && apiData.inspectionRepOrdinal.toLowerCase().includes("line not configured")) {
          setInspectionRepOrdinal(t('qcRoving.lineNotConfigured', "N/A (Line not configured)"));
          setInspectionsCompletedForProgress(0);
          return;
        }
        if (apiData.status === "line_not_configured") {
           setInspectionRepOrdinal(t('qcRoving.lineNotConfigured', "N/A (Line not configured)"));
           setInspectionsCompletedForProgress(0);
           return;
        }
        const currentRoundOrdinal = apiData.currentRoundOrdinal;
        const inspectionsCompletedInCurrentRound = apiData.inspectionsCompletedInCurrentRound;
        if (currentRoundOrdinal === 0 || currentRoundOrdinal === null || typeof currentRoundOrdinal === 'undefined' || apiData.status === "no_data_yet") {
          setInspectionRepOrdinal(t('qcRoving.firstInspection', "1st Inspection"));
          setInspectionsCompletedForProgress(0);
        } else {
          if (lineWorkerDataLoading) {
            setInspectionRepOrdinal(t('qcRoving.loadingWorkerData', "Loading worker data..."));
            setInspectionsCompletedForProgress(0);
            return;
          }
          if (lineWorkerDataError) {
            setInspectionRepOrdinal(t('qcRoving.workerDataUnavailable', "N/A (Worker data error)"));
            setInspectionsCompletedForProgress(0);
            return;
          }
          const numericLineNoFromForm = getNumericLineValue(lineNo);
          const selectedLineInfo = lineWorkerData.find(s => getNumericLineValue(s.lineNo) === numericLineNoFromForm);
          if (!selectedLineInfo) {
            setInspectionRepOrdinal(t('qcRoving.lineWorkerInfoNotFound', "N/A (Worker info not found)"));
            setInspectionsCompletedForProgress(0);
            return;
          }
          const workerCountToCompare = selectedLineInfo.editedWorkerCount !== null && selectedLineInfo.editedWorkerCount !== undefined
                                        ? selectedLineInfo.editedWorkerCount
                                        : selectedLineInfo.realWorkerCount;
          if (typeof workerCountToCompare !== 'number' || workerCountToCompare <= 0) {
            setInspectionRepOrdinal(t('qcRoving.invalidWorkerCount', "N/A (Invalid worker count)"));
            setInspectionsCompletedForProgress(0);
            return;
          }
          if (inspectionsCompletedInCurrentRound < workerCountToCompare) {
            setInspectionRepOrdinal(
              t('qcRoving.inspectionRepOngoing', `${toOrdinal(currentRoundOrdinal)} Inspection (Ongoing: ${inspectionsCompletedInCurrentRound}/${workerCountToCompare})`)
            );
          } else {
            setInspectionRepOrdinal(`${toOrdinal(currentRoundOrdinal + 1)} Inspection`);
          }
          setInspectionsCompletedForProgress(inspectionsCompletedInCurrentRound);
        }
      } catch (error) {
        console.error("Error fetching inspection time info:", error);
        let newOrdinalMessage = t('qcRoving.inspectionRepError', "Error");
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          const errorMessage = (typeof errorData === 'string' ? errorData : errorData?.message || errorData?.error || "").toLowerCase();
          if ((status === 400 || status === 404) && (errorMessage.includes("line not configured") || errorMessage.includes("line not found") || errorMessage.includes("invalid line"))) {
            newOrdinalMessage = t('qcRoving.lineNotConfigured', "N/A (Line not configured)");
          }
        }
        setInspectionRepOrdinal(newOrdinalMessage);
        setInspectionsCompletedForProgress(0);
      } finally {
        setInspectionRepLoading(false);
      }
    } else {
      setInspectionRepOrdinal(t('qcRoving.inspectionRepNA', "N/A"));
      setInspectionsCompletedForProgress(0);
    }
  }, [lineNo, currentDate, t, lineWorkerData, lineWorkerDataLoading, lineWorkerDataError, getNumericLineValue]);

  useEffect(() => {
    fetchInspectionRepInfo();
  }, [fetchInspectionRepInfo]);

const fetchInspectionsCompleted = useCallback(async () => {
  if (lineNo && currentDate) {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${month}/${day}/${year}`;
      const response = await axios.get(`${API_BASE_URL}/api/inspections-completed`, {
        params: {
          line_no: lineNo,
          inspection_date: formattedDate,
        },
      });
      setInspectionsCompletedForProgress(response.data.completeInspectOperators);
    } catch (error) {
      console.error("Error fetching inspections completed:", error);
      setInspectionsCompletedForProgress(0);
    }
  }
}, [lineNo, currentDate]);

  useEffect(() => {
    fetchInspectionsCompleted();
  }, [fetchInspectionsCompleted]);

  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-mo-numbers`,
          {
            params: { search: moNoSearch }
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch MO numbers."
        });
      }
    };
    fetchMoNumbers();
  }, [moNoSearch]);

  useEffect(() => {
    const fetchOperationData = async () => {
      if (!moNo) {
        setOperationData([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-details`,
          {
            params: { stNo: moNo }
          }
        );
        setOperationData(response.data.orderData || []);
      } catch (error) {
        console.error("Error fetching operation data:", error);
        setOperationData([]);
        if (error.response?.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `MO Number "${moNo}" not found.`
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              error.response?.data?.message || "Failed to fetch operation data."
          });
        }
      }
    };
    fetchOperationData();
  }, [moNo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addDefect = (defectName) => {
    if (defectName && selectedOperationId && defects.length > 0) {
      const defect =allDefects.find((d) => d.english === defectName);
      if (defect) {
        setGarments((prevGarments) => {
          const newGarments = [...prevGarments];
          newGarments[currentGarmentIndex] = {
            ...newGarments[currentGarmentIndex],
            defects: [
              ...newGarments[currentGarmentIndex].defects,
              {
                name: defect.english,
                count: 1,
                operationId: selectedOperationId,
                repair: defect.repair
              }
            ],
            status: 'Fail',
          };
          return newGarments;
        });
        setSelectedDefect("");
      }
    }
  };

  const deleteDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects: newGarments[currentGarmentIndex].defects.filter((_, i) => i !== defectIndex),
        status: newGarments[currentGarmentIndex].defects.length > 1 ? 'Fail' : 'Pass',
      };
      return newGarments;
    });
  };

  const incrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      defects[defectIndex] = { ...defects[defectIndex], count:        defects[defectIndex].count + 1 };
      newGarments[currentGarmentIndex] = { ...newGarments[currentGarmentIndex], defects };
      return newGarments;
    });
  };

  const decrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      const currentCount = defects[defectIndex].count;
      if (currentCount > 1) {
        defects[defectIndex] = { ...defects[defectIndex], count: currentCount - 1 };
        newGarments[currentGarmentIndex] = { ...newGarments[currentGarmentIndex], defects };
      } else {
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects: defects.filter((_, i) => i !== defectIndex),
          status: defects.length > 1 ? 'Fail' : 'Pass',
        };
      }
      return newGarments;
    });
  };

  const resetForm = () => {
    const size = inspectionType === 'Critical' ? 15 : 5;
    setGarments(Array.from({ length: size }, () => ({ garment_defect_id: '', defects: [], status: 'Pass' })));
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setSelectedDefect("");
    setSelectedOperationId("");
    setLanguage("khmer");
    setScannedUserData(null);
    setShowOperatorDetails(false);
    setShowOperationDetails(false);
    setSpiStatus("");
    setMeasurementStatus("");
    setSpiImage(null);
    setMeasurementImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !lineNo ||
      !moNo ||
      !selectedOperationId ||
      !spiStatus ||
      !measurementStatus ||
      !scannedUserData
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill all required fields and scan the operator QR code."
      });
      return;
    }
    const now = new Date();
    const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const updatedGarments = garments.map((garment) => {
      const hasDefects = garment.defects.length > 0;
      const garmentDefectCount = garment.defects.reduce((sum, defect) => sum + defect.count, 0);
      return {
        ...garment,
        status: hasDefects ? "Fail" : "Pass",
        garment_defect_count: garmentDefectCount,
        defects: garment.defects.map((defect) => ({
          ...defect,
          name: defect.name // Already in English
        }))
      };
    });

    const totalDefectCount = updatedGarments.reduce(
      (acc, g) => acc + g.garment_defect_count,
      0
    );

    const qualityStatus = updatedGarments.some((g) => g.status === "Fail")
      ? "Reject"
      : "Pass";

    const selectedOperation = operationData.find(
      (data) => data.Tg_No === selectedOperationId
    );

    const singleOperatorInspectionData = {
      operator_emp_id: scannedUserData?.emp_id || "N/A",
      operator_eng_name: scannedUserData?.eng_name || "N/A",
      operator_kh_name: scannedUserData?.kh_name || "N/A",
      operator_job_title: scannedUserData?.job_title || "N/A",
      operator_dept_name: scannedUserData?.dept_name || "N/A",
      operator_sect_name: scannedUserData?.sect_name || "N/A",
      tg_no: selectedOperation?.Tg_No || "N/A",
      tg_code: selectedOperation?.Tg_Code || "N/A",
      ma_code: selectedOperation?.Ma_Code || "N/A",
      operation_ch_name: selectedOperation?.ch_name || "N/A",
      operation_kh_name: selectedOperation?.kh_name || "N/A",
      type: inspectionType,
      spi: spiStatus,
      spi_image: spiImage,
      measurement: measurementStatus,
      measurement_image: measurementImage,
      checked_quantity: garments.length,
      inspection_time: inspectionTime,
      qualityStatus,
      rejectGarments: [
        {
          totalCount: totalDefectCount,
          garments: updatedGarments.filter((g) => g.defects.length > 0),
        },
      ],
    };

    let totalOperatorsForLine = 0;
    const numericLineNoFromForm = getNumericLineValue(lineNo);
    if (numericLineNoFromForm !== null && lineWorkerData && lineWorkerData.length > 0) {
      const selectedLineInfo = lineWorkerData.find(s => {
        const numericLineNoFromData = getNumericLineValue(s.lineNo);
        return numericLineNoFromData !== null && numericLineNoFromData === numericLineNoFromForm;
      });
      if (selectedLineInfo) {
        totalOperatorsForLine = selectedLineInfo.editedWorkerCount !== null && selectedLineInfo.editedWorkerCount !== undefined
          ? selectedLineInfo.editedWorkerCount
          : (selectedLineInfo.realWorkerCount || 0);
      } else {
        console.warn(`Worker data not found for line ${lineNo}. total_operators will be defaulted to 0.`);
      }
    } else {
      console.warn(`Line number (${lineNo}) is invalid or lineWorkerData is not available. total_operators will be defaulted to 0.`);
    }

    const completeInspectOperators = 1;

    const inspectStatus = (totalOperatorsForLine > 0 && completeInspectOperators >= totalOperatorsForLine)
      ? "Completed"
      : "Not Complete";

     const reportPayload = {
      inline_roving_id: Date.now(),
      report_name: 'QC Inline Roving',
      inspection_date: currentDate.toLocaleDateString("en-US"),
      mo_no: moNo,
      line_no: lineNo,
      inspection_rep: [{
        inspection_rep_name: inspectionRepOrdinal,
        emp_id: user?.emp_id || 'Guest',
        eng_name: user?.eng_name || 'Guest',
        total_operators: totalOperatorsForLine,
        complete_inspect_operators: completeInspectOperators,
        Inspect_status: inspectStatus,
        inlineData: [singleOperatorInspectionData]
      }],
    };

    try {
      await axios.post(`${API_BASE_URL}/api/save-qc-inline-roving`, reportPayload);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'QC Inline Roving data saved successfully!',
      });
      resetForm();
      fetchInspectionRepInfo(); // Refresh the inspection repetition info after saving
      fetchInspectionsCompleted(); // Refresh the inspections completed info after saving
    } catch (error) {
      console.error("Error saving QC Inline Roving data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save QC Inline Roving data.',
      });
    }
  };

  // const handleUserDataFetched = (userData) => {
  //   setScannedUserData(userData);
  //   setShowScanner(false);
  // };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  const getDefectName = (defect, lang = language) => {
    switch (lang) {
      case 'english':
        return defect.english;
      case 'chinese':
        return defect.chinese;
      case 'khmer':
      default:
        return defect.khmer;
    }
  };

  const commonResultStatus = garments.some((g) => g.defects.length > 0)
    ? "Reject"
    : "Pass";

  const garment = garments[currentGarmentIndex] || {
    defects: [],
    status: "Pass"
  };

  const currentGarmentDefects = garment.defects;

  const totalDefects = garments.reduce(
    (acc, garment) =>
      acc + garment.defects.reduce((sum, defect) => sum + defect.count, 0),
    0
  );

  const defectGarments = garments.filter(
    (garment) => garment.defects.length > 0
  ).length;

  const defectRate = ((totalDefects / garmentQuantity) * 100).toFixed(2) + "%";

  const defectRatio =
    ((defectGarments / garmentQuantity) * 100).toFixed(2) + "%";

  const operationIds = [
    ...new Set(operationData.map((data) => data.Tg_No))
  ].sort();

  const selectedOperation = operationData.find(
    (data) => data.Tg_No === selectedOperationId
  );

  const lineNoOptions = Array.from({ length: 30 }, (_, i) =>
    (i + 1).toString()
  );

  const isFormValid =
    lineNo &&
    moNo &&
    selectedOperationId &&
    spiStatus &&
    measurementStatus &&
    scannedUserData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t("qcRoving.qc_inline_roving_inspection")}
        </h1>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 ${activeTab === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-lg`}
          >
            {t("qcRoving.qcInlineRoving")}
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 ${
              activeTab === "data"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("qcRoving.data")}
          </button>
          <button
            onClick={() => setActiveTab("db")}
            className={`px-4 py-2 flex items-center space-x-2 ${
              activeTab === "db"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } `}
          >
            <Database className="w-5 h-5" />
            <span>DB</span>
          </button>
          <button
            onClick={() => setActiveTab("inlineWorkers")}
            className={`px-4 py-2 ${
              activeTab === "inlineWorkers"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-lg`}
          >
            {t("qcRoving.inlineWorkers")}
          </button>
        </div>

        {activeTab === 'form' ? (
          <>
            <div className="my-4 p-4 bg-blue-100 rounded-lg shadow">
              <h3 className="text-md font-semibold text-gray-700 mb-2">
                {t("qcRoving.lineWorkerProgressTitle", "Line {{lineDisplayValue}} : Inspection Progress", { lineDisplayValue: getNumericLineValue(lineNo) || t('qcRoving.na', 'N/A') })} 
                &nbsp;({inspectionRepLoading ? t('qcRoving.loading', "Loading...") : inspectionRepOrdinal})
              </h3>
              {(() => {
                const numericLineNoFromForm = getNumericLineValue(lineNo); 
                if (numericLineNoFromForm === null || lineWorkerDataLoading || lineWorkerDataError || inspectionRepLoading) {
                  if (lineWorkerDataLoading) return <p className="text-sm text-gray-500">{t("qcRoving.loadingWorkerData", "Loading worker data...")}</p>;
                  if (lineWorkerDataError) return <p className="text-sm text-red-500">{lineWorkerDataError}</p>;
                  if (inspectionRepLoading) return <p className="text-sm text-gray-500">{t("qcRoving.loadingInspectionData", "Loading inspection data...")}</p>;
                  return <p className="text-sm text-gray-500">{t("qcRoving.selectLineForProgress", "Select a line to see worker status.")}</p>;
                }
                const selectedLineInfo = lineWorkerData.find(s => {
                  const numericLineNoFromData = getNumericLineValue(s.lineNo);
                  return numericLineNoFromData !== null && numericLineNoFromData === numericLineNoFromForm;
                });
                if (selectedLineInfo) {
                  const totalWorkersForLine = selectedLineInfo.editedWorkerCount !== null && selectedLineInfo.editedWorkerCount !== undefined
                    ? selectedLineInfo.editedWorkerCount
                    : (selectedLineInfo.realWorkerCount || 0);
                  const progressPercent = totalWorkersForLine > 0 ? (inspectionsCompletedForProgress / totalWorkersForLine) * 100 : 0;
                  return (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        {t("qcRoving.inspectionsCompleted", "Inspections Completed")} : {inspectionsCompletedForProgress} / {totalWorkersForLine}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className={`${progressPercent >= 100 ? 'bg-green-600' : 'bg-blue-600'} h-2.5 rounded-full`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                } else {
                  return <p className="text-sm text-gray-500">{t("qcRoving.noWorkerDataForLine", "No worker data available for selected line.")}</p>;
                }
              })()}
              {lineWorkerDataLoading && (<p className="text-sm text-gray-500">{t("qcRoving.loadingWorkerData", "Loading worker data...")}</p>)}
              {lineWorkerDataError && !lineWorkerDataLoading && (<p className="text-sm text-red-500">{lineWorkerDataError}</p>)}
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="inspectionRep" className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.inspectionRep", "Inspection Repetition")}
                  </label>
                  <input type="text" id="inspectionRep" value={inspectionRepLoading ? t('qcRoving.loading', "Loading...") : inspectionRepOrdinal} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.date")}
                  </label>
                  <DatePicker
                    selected={currentDate}
                    onChange={(date) => setCurrentDate(date)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.lineNo")}
                  </label>
                  <select
                    value={lineNo}
                    onChange={(e) => setLineNo(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">{t("qcRoving.select_line_no")}</option>
                    {lineNoOptions.map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.moNo")}
                  </label>
                  <div className="relative" ref={moNoDropdownRef}>
                    <input
                      type="text"
                      value={moNoSearch}
                      onChange={(e) => {
                        setMoNoSearch(e.target.value);
                      }}
                      placeholder={t("qcRoving.search_mono")}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {showMoNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {moNoOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setMoNo(option);
                              setMoNoSearch(option);
                              setShowMoNoDropdown(false);
                            }}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.operationNo")}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOperationId}
                      onChange={(e) => setSelectedOperationId(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      disabled={!moNo || operationIds.length === 0}
                    >
                      <option value="">
                        {t("qcRoving.select_operation_no")}
                      </option>
                      {operationIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                    {selectedOperation && (
                                            <button
                        onClick={() =>
                          setShowOperationDetails(!showOperationDetails)
                        }
                        className="text-gray-600 hover:text-gray-800 mt-1"
                      >
                        {showOperationDetails ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {showOperationDetails && selectedOperation && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p>
                          <strong>Tg_No:</strong> {selectedOperation.Tg_No}
                        </p>
                        <p>
                          <strong>Tg_Code (Machine Code):</strong>{" "}
                          {selectedOperation.Tg_Code || "N/A"}
                        </p>
                        <p>
                          <strong>Ma_Code (Machine Type):</strong>{" "}
                          {selectedOperation.Ma_Code || "N/A"}
                        </p>
                        <p>
                          <strong>Operation (Chi):</strong>{" "}
                          {selectedOperation.ch_name || "N/A"}
                        </p>
                        <p>
                          <strong>Operation (Kh):</strong>{" "}
                          {selectedOperation.kh_name || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.scanQR")}
                  </label>
                  {/* <button
                    onClick={() => setShowScanner(true)}
                    className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full justify-center"
                  >
                    <QrCode className="w-5 h-5" />
                    {t("qcRoving.scanQR")}
                  </button> */}
                  <div className="mt-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                    {scannedUserData ? t("qcRoving.operatorDataSetToCurrentUser", "Operator: Current User") : t("qcRoving.operatorDataNotSet", "Operator: Not Set (QR Scan Disabled)")}
                  </div>
                  {scannedUserData && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm"></p>
                      <button
                        onClick={() =>
                          setShowOperatorDetails(!showOperatorDetails)
                        }
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {showOperatorDetails ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                  {showOperatorDetails && scannedUserData && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p>
                          <strong>Operator ID:</strong>{" "}
                          {scannedUserData.emp_id || "N/A"}
                        </p>
                        <p>
                          <strong>Name (Eng):</strong>{" "}
                          {scannedUserData.eng_name || "N/A"}
                        </p>
                        <p>
                          <strong>Name (Kh):</strong>{" "}
                          {scannedUserData.kh_name || "N/A"}
                        </p>
                        <p>
                          <strong>Department:</strong>{" "}
                          {scannedUserData.dept_name || "N/A"}
                        </p>
                        <p>
                          <strong>Section:</strong>{" "}
                          {scannedUserData.sect_name || "N/A"}
                        </p>
                        <p>
                          <strong>Job Title:</strong>{" "}
                          {scannedUserData.job_title || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.language")}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="khmer">Khmer</option>
                    <option value="english">English</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.inspectionType")}
                  </label>
                  <div className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="Normal"
                        checked={inspectionType === 'Normal'}
                        onChange={(e) => setInspectionType(e.target.value)}
                        className="form-radio"
                      />
                      <span className="ml-2">{t("qcRoving.normal")}</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        value="Critical"
                        checked={inspectionType === 'Critical'}
                        onChange={(e) => setInspectionType(e.target.value)}
                        className="form-radio"
                      />
                      <span className="ml-2">{t("qcRoving.critical")}</span>
                    </label>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {t("qcRoving.quantity")}: {garmentQuantity}
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-300" />

              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.spi")}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={spiStatus}
                      onChange={(e) => setSpiStatus(e.target.value)}
                      className="mt-1 w-3/4 p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">
                        {t("qcRoving.select_spi_status")}
                      </option>
                      <option value="Pass">{t("qcRoving.pass")}</option>
                      <option value="Reject">{t("qcRoving.reject")}</option>
                    </select>
                    <button
                      onClick={() => setShowSpiCamera(true)}
                      className="mt-1 p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  {spiImage && (
                    <div className="mt-2 relative p-2 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setSpiImage(null)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <img
                        src={`${API_BASE_URL}${spiImage}`}
                        alt="SPI Image"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.measurement")}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={measurementStatus}
                      onChange={(e) => setMeasurementStatus(e.target.value)}
                      className="mt-1 w-3/4 p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">
                        {t("qcRoving.select_measurement_status")}
                      </option>
                      <option value="Pass">{t("qcRoving.pass")}</option>
                      <option value="Reject">{t("qcRoving.reject")}</option>
                    </select>
                    <button
                      onClick={() => setShowMeasurementCamera(true)}
                      className="mt-1 p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  {measurementImage && (
                    <div className="mt-2 relative p-2 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setMeasurementImage(null)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <img
                        src={`${API_BASE_URL}${measurementImage}`}
                        alt="Measurement Image"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {t("qcRoving.quality")}
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      {t("qcRoving.part")} {currentGarmentIndex + 1}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-lg ${
                        commonResultStatus === 'Pass'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t("qcRoving.status")}: {commonResultStatus}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {currentGarmentDefects.length > 0 ? (
                      currentGarmentDefects.map((defect, defectIndex) => {
                        const defectInfo = allDefects.find(
                          (d) => d.english === defect.name
                        );
                        return (
                          <div
                            key={`${currentGarmentIndex}-${defectIndex}`}
                            className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm flex-wrap gap-y-2"
                          >
                            <span className="max-w-[220px] md:max-w-[400px] p-2">
                              {defectInfo
                                ? getDefectName(defectInfo)
                                : defect.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => decrementDefect(defectIndex)}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded-l hover:bg-gray-400"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                value={defect.count}
                                readOnly
                                className="w-8 text-center border border-gray-300 rounded"
                              />
                              <button
                                onClick={() => incrementDefect(defectIndex)}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded-r hover:bg-gray-400"
                              >
                                +
                              </button>
                              <button
                                onClick={() => deleteDefect(defectIndex)}
                                className="p-2 text-red-600 hover:text-red-800"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-600">
                        {t("qcRoving.no_defect_record")}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-4">
                      <select
                        value={selectedDefect}
                        onChange={(e) => {
                          setSelectedDefect(e.target.value);
                          if (e.target.value) {
                            addDefect(e.target.value);
                          }
                        }}
                        className="border p-2 rounded w-full"
                        disabled={!moNo || !selectedOperationId}
                      >
                        <option value="">{t("qcRoving.select_defect")}</option>
                        {allDefects.map((defect) => (
                          <option key={defect.code} value={defect.english}>
                            {getDefectName(defect)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 mb-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {t("qcRoving.defect_metrics")}
                </h2>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">
                        {t("qcRoving.defect_rate")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("qcRoving.defect_ratio")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border text-center border-gray-300 p-2">
                        {defectRate}
                      </td>
                      <td className="border text-center border-gray-300 p-2">
                        {defectRatio}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <div className="space-x-4">
                <button
                  onClick={() => setCurrentGarmentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentGarmentIndex === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg disabled:opacity-50"
                >
                  {t("qcRoving.previous")}
                </button>
                <button
                  onClick={() => setCurrentGarmentIndex(prev => Math.min(garments.length - 1, prev + 1))}
                  disabled={currentGarmentIndex === garments.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {t("qcRoving.next")}
                </button>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!isFormValid}
                className={`px-6 py-3 rounded-lg ${
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                {t("qcRoving.preview")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-3 rounded-lg ${
                  isFormValid
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                {t("qcRoving.finish_inspection")}
              </button>
            </div>
          {/* {showScanner && (
              <EmpQRCodeScanner
                onUserDataFetched={handleUserDataFetched}
                onClose={() => setShowScanner(false)}
              />
            )} */}
            {showPreview && (
              <PreviewRoving
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                data={{
                  date: currentDate.toLocaleDateString("en-US"),
                  qcId: user?.emp_id || "Guest",
                  lineNo,
                  moNo,
                  operatorId: scannedUserData?.emp_id || "N/A",
                  inspectionType,
                  operationName:
                    selectedOperation?.kh_name ||
                    selectedOperation?.ch_name ||
                    "N/A",
                  machineCode: selectedOperation?.Ma_Code || "N/A",
                  spiStatus,
                  measurementStatus,
                  garments,
                  defectRate,
                  defectRatio
                }}
              />
            )}

            {showSpiCamera && (
              <RovingCamera
                isOpen={showSpiCamera}
                onClose={() => setShowSpiCamera(false)}
                onImageCaptured={(imagePath) => setSpiImage(imagePath)}
                date={currentDate.toISOString().split("T")[0]}
                type="spi"
                empId={user?.emp_id || "Guest"}
              />
            )}

            {showMeasurementCamera && (
              <RovingCamera
                isOpen={showMeasurementCamera}
                onClose={() => setShowMeasurementCamera(false)}
                onImageCaptured={(imagePath) => setMeasurementImage(imagePath)}
                date={currentDate.toISOString().split("T")[0]}
                type="measurement"
                empId={user?.emp_id || "Guest"}
              />
            )}
          </>
        ) : activeTab === "data" ? (
          <RovingData />
        ) : activeTab === "db" ? (
          <CEDatabase />
        ) : (
          <InlineWorkers onWorkerCountUpdated={fetchLineWorkerInfo} />
        )}
      </div>
    </div>
  );
};

export default RovingPage;


