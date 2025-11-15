import axios from "axios";
import i18next from "i18next";
import { Database, Eye, EyeOff, QrCode, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import CEDatabase from "../components/inspection/qc_roving/CEDatabase";
import EmpQRCodeScanner from "../components/inspection/qc_roving/EmpQRCodeScanner";
import ImageCaptureUpload from "../components/inspection/qc_roving/ImageCaptureupload";
import InlineWorkers from "../components/inspection/qc_roving/InlineWorkers";
import PreviewRoving from "../components/inspection/qc_roving/PreviewRoving";
import RovingData from "../components/inspection/qc_roving/RovingData";
import RovingPairing from "../components/inspection/qc_roving/RovingPairing";
import RovingPairingData from "../components/inspection/qc_roving/RovingPairingData";

const RovingPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const toOrdinalFormattedString = (n, transFunc) => {
    if (typeof n !== "number" || isNaN(n) || n <= 0) return String(n);
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    const suffix = s[(v - 20) % 10] || s[v] || s[0];
    return `${n}${suffix} ${transFunc(
      "qcRoving.inspectionText",
      "Inspection"
    )}`;
  };
  const [inspectionType, setInspectionType] = useState("Normal");
  const [spiStatus, setSpiStatus] = useState("");
  const [measurementStatus, setMeasurementStatus] = useState("");
  const [spiFilesToUpload, setSpiFilesToUpload] = useState([]);
  const [measurementFilesToUpload, setMeasurementFilesToUpload] = useState([]);
  const [defectFilesToUpload, setDefectFilesToUpload] = useState([]);
  const [garments, setGarments] = useState([]);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDefectName, setSelectedDefectName] = useState("");
  const [apiDeterminedBuyer, setApiDeterminedBuyer] = useState("Other");

  const mapI18nLangToDisplayLang = (lang) => {
    if (lang.startsWith("kh")) return "kh";
    if (lang.startsWith("ch") || lang.startsWith("zh")) return "ch";
    return "en";
  };
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
  const [selectedManualInspectionRep, setSelectedManualInspectionRep] =
    useState(() => toOrdinalFormattedString(1, t));
  const [
    inspectionsCompletedForSelectedRep,
    setInspectionsCompletedForSelectedRep
  ] = useState(0);
  const [lineWorkerData, setLineWorkerData] = useState([]);
  const [lineWorkerDataLoading, setLineWorkerDataLoading] = useState(true);
  const [lineWorkerDataError, setLineWorkerDataError] = useState(null);
  const [imageUploaderKey, setImageUploaderKey] = useState(Date.now());
  const [defectDisplayLanguage, setDefectDisplayLanguage] = useState(
    mapI18nLangToDisplayLang(i18next.language)
  );
  const [remarkText, setRemarkText] = useState("");

  const [defects, setDefects] = useState([]);
  const [isLoadingDefects, setIsLoadingDefects] = useState(true);
  const [defectsError, setDefectsError] = useState(null);

  // --- NEW STATES FOR MANUAL WORKER ID SEARCH ---
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualWorkerIdSearch, setManualWorkerIdSearch] = useState("");
  const [manualWorkerIdOptions, setManualWorkerIdOptions] = useState([]);
  const [isSearchingWorkerId, setIsSearchingWorkerId] = useState(false);
  const [showWorkerIdDropdown, setShowWorkerIdDropdown] = useState(false);
  const workerIdDropdownRef = useRef(null);

  const getNumericLineValue = useCallback((value) => {
    if (value === null || value === undefined || String(value).trim() === "")
      return null;
    const strValue = String(value).toLowerCase();
    const numericPart = strValue.replace(/[^0-9]/g, "");
    return numericPart ? parseInt(numericPart, 10) : null;
  }, []);

  // Fetch defect data on component mount
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sewing-defects`);
        setDefects(response.data);
        setDefectsError(null);
      } catch (error) {
        console.error("Error fetching defects:", error);
        setDefectsError("Failed to load defects. Please try again later.");
      } finally {
        setIsLoadingDefects(false);
      }
    };
    fetchDefects();
  }, []);

  // Effect to update defectDisplayLanguage when i18next.language changes
  useEffect(() => {
    const handleGlobalLanguageChanged = (lng) => {
      setDefectDisplayLanguage(mapI18nLangToDisplayLang(lng));
    };
    i18next.on("languageChanged", handleGlobalLanguageChanged);
    // Initial sync
    setDefectDisplayLanguage(mapI18nLangToDisplayLang(i18next.language));
    return () => {
      i18next.off("languageChanged", handleGlobalLanguageChanged);
    };
  }, []);

  useEffect(() => {
    const size = inspectionType === "Critical" ? 15 : 5;
    setGarments(
      Array.from({ length: size }, () => ({
        garment_defect_id: "",
        defects: [],
        status: "Pass"
      }))
    );
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setGarmentQuantity(size);
  }, [inspectionType]);

  const fetchLineWorkerInfo = useCallback(async () => {
    try {
      setLineWorkerDataLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/line-summary`);
      const transformedData = response.data.map((summary) => ({
        lineNo: summary.line_no,
        realWorkerCount: summary.real_worker_count,
        editedWorkerCount: summary.edited_worker_count
      }));
      setLineWorkerData(transformedData);
      setLineWorkerDataError(null);
    } catch (err) {
      console.error("Error fetching line summary for progress:", err);
      setLineWorkerDataError(
        t("qcRoving.lineWorkerFetchError", "Failed to fetch line worker data.")
      );
      setLineWorkerData([]);
    } finally {
      setLineWorkerDataLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLineWorkerInfo();
  }, [fetchLineWorkerInfo]);

  // Effect to fetch buyer name when moNo changes
  useEffect(() => {
    const fetchBuyerByMo = async () => {
      if (moNo) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/buyer-by-mo`, {
            params: { moNo }
          });
          setApiDeterminedBuyer(response.data.buyerName || "Other");
        } catch (error) {
          console.error("Error fetching buyer by MO:", error);
          setApiDeterminedBuyer("Other"); // Fallback on error
        }
      } else {
        setApiDeterminedBuyer("Other"); // Default if no MO
      }
    };
    fetchBuyerByMo();
  }, [moNo]);

  const fetchInspectionsCompleted = useCallback(async () => {
    if (lineNo && currentDate && selectedManualInspectionRep && moNo) {
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1);
        const day = String(currentDate.getDate());
        const formattedDate = `${month}/${day}/${year}`;

        const response = await axios.get(
          `${API_BASE_URL}/api/inspections-completed`,
          {
            params: {
              line_no: lineNo,
              inspection_date: formattedDate,
              inspection_rep_name: selectedManualInspectionRep,
              mo_no: moNo
            }
          }
        );

        const completeInspectOperators =
          response.data.completeInspectOperators || 0;

        setInspectionsCompletedForSelectedRep(completeInspectOperators);
      } catch (error) {
        console.error("Error fetching inspections completed:", error);
        setInspectionsCompletedForSelectedRep(0);
      }
    } else {
      setInspectionsCompletedForSelectedRep(0);
    }
  }, [lineNo, currentDate, selectedManualInspectionRep, moNo, API_BASE_URL]);

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

  // --- NEW USEEFFECT FOR WORKER ID SEARCH ---
  useEffect(() => {
    const fetchWorkerIds = async () => {
      if (manualWorkerIdSearch.trim() === "") {
        setManualWorkerIdOptions([]);
        setShowWorkerIdDropdown(false);
        return;
      }
      setIsSearchingWorkerId(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/roving-users/search-by-empid`,
          {
            params: { term: manualWorkerIdSearch }
          }
        );
        setManualWorkerIdOptions(response.data);
        setShowWorkerIdDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching worker IDs:", error);
        setManualWorkerIdOptions([]);
        setShowWorkerIdDropdown(false);
      } finally {
        setIsSearchingWorkerId(false);
      }
    };

    if (isManualMode) {
      // Use a timeout to avoid sending requests on every keystroke
      const handler = setTimeout(() => {
        fetchWorkerIds();
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [manualWorkerIdSearch, isManualMode]);

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
      // --- NEW: LOGIC TO CLOSE WORKER ID DROPDOWN ---
      if (
        workerIdDropdownRef.current &&
        !workerIdDropdownRef.current.contains(event.target)
      ) {
        setShowWorkerIdDropdown(false);
      }
      // --- END OF NEW LOGIC ---
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- NEW HANDLER FOR SELECTING A WORKER FROM DROPDOWN ---
  const handleWorkerIdSelect = async (empId) => {
    setManualWorkerIdSearch(empId);
    setShowWorkerIdDropdown(false);
    try {
      // Use the new endpoint to get all required details
      const response = await axios.get(`${API_BASE_URL}/api/users/${empId}`);
      handleUserDataFetched(response.data);
    } catch (error) {
      console.error("Error fetching full user details:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch worker details."
      });
      setScannedUserData(null); // Clear data on error
    }
  };

  const addDefect = (defectEnglishName) => {
    if (defectEnglishName && selectedOperationId && defects.length > 0) {
      const defect = defects.find((d) => d.english === defectEnglishName);
      if (defect) {
        setGarments((prevGarments) => {
          const newGarments = [...prevGarments];
          newGarments[currentGarmentIndex] = {
            ...newGarments[currentGarmentIndex],
            defects: [
              ...newGarments[currentGarmentIndex].defects,
              {
                name: defect.english,
                operationId: selectedOperationId,
                repair: defect.repair,
                type: defect.type,
                count: 1,
                severity: (() => {
                  const buyerStatus = defect.statusByBuyer?.find(
                    (status) => status.buyerName === apiDeterminedBuyer
                  );
                  if (buyerStatus) {
                    if (
                      buyerStatus.isCommon &&
                      buyerStatus.defectStatus?.includes(buyerStatus.isCommon)
                    ) {
                      return buyerStatus.isCommon;
                    }
                    return buyerStatus.defectStatus?.[0] || "Minor";
                  }
                  return "Minor";
                })()
              }
            ],
            status: "Fail"
          };
          return newGarments;
        });
        setSelectedDefectName("");
      }
    }
  };

  const handleDefectSeverityChange = (defectIndexInGarment, newSeverity) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const currentDefectsArray = [...newGarments[currentGarmentIndex].defects];

      if (currentDefectsArray[defectIndexInGarment]) {
        currentDefectsArray[defectIndexInGarment] = {
          ...currentDefectsArray[defectIndexInGarment],
          severity: newSeverity // Update the severity
        };
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects: currentDefectsArray
        };
      }
      return newGarments;
    });
  };

  const deleteDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects: newGarments[currentGarmentIndex].defects.filter(
          (_, i) => i !== defectIndex
        ),
        status:
          newGarments[currentGarmentIndex].defects.length > 1 ? "Fail" : "Pass"
      };
      return newGarments;
    });
  };

  const incrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      defects[defectIndex] = {
        ...defects[defectIndex],
        count: defects[defectIndex].count + 1
      };
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects
      };
      return newGarments;
    });
  };

  const decrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      const currentCount = defects[defectIndex].count;
      if (currentCount > 1) {
        defects[defectIndex] = {
          ...defects[defectIndex],
          count: currentCount - 1
        };
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects
        };
      } else {
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects: defects.filter((_, i) => i !== defectIndex),
          status: defects.length > 1 ? "Fail" : "Pass"
        };
      }
      return newGarments;
    });
  };

  const resetForm = () => {
    const size = inspectionType === "Critical" ? 15 : 5;
    setGarments(
      Array.from({ length: size }, () => ({
        garment_defect_id: "",
        defects: [],
        status: "Pass"
      }))
    );
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setSelectedDefectName("");
    setSelectedOperationId("");
    setLanguage("khmer");
    setScannedUserData(null);
    setShowOperatorDetails(false);
    setShowOperationDetails(false);
    setSpiStatus("");
    setMeasurementStatus("");
    setSpiFilesToUpload([]);
    setMeasurementFilesToUpload([]);
    setDefectFilesToUpload([]);
    // setSelectedManualInspectionRep("");
    setImageUploaderKey(Date.now());
    setRemarkText("");
    // --- NEW: Also reset manual search fields ---
    setIsManualMode(false);
    setManualWorkerIdSearch("");
    setManualWorkerIdOptions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !lineNo ||
      !moNo ||
      !selectedOperationId ||
      !selectedManualInspectionRep ||
      !spiStatus ||
      !measurementStatus ||
      !scannedUserData
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: t(
          "qcRoving.validation.fillAllFieldsAndSelectRep",
          "Please fill all required fields, select inspection repetition, and scan the operator QR code."
        )
      });
      return;
    }

    // Helper function to upload a single file
    const uploadFile = async (
      file,
      imageTypeForUpload,
      operatorEmpId,
      fileIndex
    ) => {
      const formData = new FormData();
      formData.append("imageFile", file);
      formData.append("imageType", imageTypeForUpload);
      formData.append("date", currentDate.toISOString().split("T")[0]);
      formData.append("lineNo", lineNo);
      formData.append("moNo", moNo);
      formData.append("operationId", selectedOperationId);
      formData.append("operatorEmpId", operatorEmpId || "UNKNOWN_OPERATOR");
      formData.append("fileIndex", fileIndex);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/roving/upload-roving-image`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" }
          }
        );
        if (response.data.success) {
          return response.data.filePath;
        } else {
          throw new Error(
            response.data.message ||
              `Failed to upload ${imageTypeForUpload} image ${file.name}`
          );
        }
      } catch (uploadError) {
        console.error(
          `Error uploading ${imageTypeForUpload} image ${file.name}:`,
          uploadError
        );
        throw uploadError;
      }
    };

    let uploadedSpiImagePaths = [];
    let uploadedMeasurementImagePaths = [];
    let uploadedDefectImagePaths = [];

    try {
      Swal.fire({
        title: t("qcRoving.submission.uploadingImages", "Uploading images..."),
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Upload SPI images
      for (let i = 0; i < spiFilesToUpload.length; i++) {
        const path = await uploadFile(
          spiFilesToUpload[i],
          "spi",
          scannedUserData?.emp_id,
          i
        );
        uploadedSpiImagePaths.push(path);
      }
      // Upload Measurement images
      for (let i = 0; i < measurementFilesToUpload.length; i++) {
        const path = await uploadFile(
          measurementFilesToUpload[i],
          "measurement",
          scannedUserData?.emp_id,
          i
        );
        uploadedMeasurementImagePaths.push(path);
      }
      // Upload Defects images
      for (let i = 0; i < defectFilesToUpload.length; i++) {
        const path = await uploadFile(
          defectFilesToUpload[i],
          "defect",
          scannedUserData?.emp_id,
          i
        );
        uploadedDefectImagePaths.push(path);
      }
      Swal.close();
    } catch (uploadError) {
      Swal.fire(
        t("qcRoving.submission.imageUploadFailedTitle", "Image Upload Failed"),
        uploadError.message ||
          t(
            "qcRoving.submission.imageUploadFailedText",
            "One or more images could not be uploaded. Please try again."
          ),
        "error"
      );
      return;
    }

    const now = new Date();
    const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const updatedGarments = garments.map((garment) => {
      const hasDefects = garment.defects.length > 0;
      const garmentDefectCount = garment.defects.reduce(
        (sum, defect) => sum + defect.count,
        0
      );
      return {
        ...garment,
        status: hasDefects ? "Fail" : "Pass",
        garment_defect_count: garmentDefectCount,
        defects: garment.defects.map((defect) => {
          const defectMasterEntry = defects.find(
            (d) => d.english === defect.name
          );
          let buyerSpecificDefectInfo = null;

          if (defectMasterEntry && defectMasterEntry.statusByBuyer) {
            buyerSpecificDefectInfo = defectMasterEntry.statusByBuyer.find(
              (bs) => bs.buyerName === apiDeterminedBuyer
            );
          }
          const finalDefectStatus =
            buyerSpecificDefectInfo &&
            Array.isArray(buyerSpecificDefectInfo.defectStatus) &&
            buyerSpecificDefectInfo.defectStatus.length > 0
              ? defect.severity
              : "N/A";

          return {
            ...defect,
            defect_status: finalDefectStatus
          };
        })
      };
    });

    const totalDefectCount = updatedGarments.reduce(
      (acc, g) => acc + g.garment_defect_count,
      0
    );

    const qualityStatus = updatedGarments.some((g) => g.status === "Fail")
      ? "Reject"
      : "Pass";

    const rejectedGarmentCountForOperator = updatedGarments.filter(
      (g) => g.status === "Fail"
    ).length;

    let overallOperatorStatusKey = "";
    const anyCriticalDefectInUpdatedGarments = updatedGarments.some((g) =>
      g.defects.some((d) => d.severity === "Critical")
    );

    const totalMajorDefectsInUpdatedGarments = updatedGarments.reduce(
      (sum, g) =>
        sum +
        g.defects
          .filter((d) => d.severity === "Major")
          .reduce((defectSum, defect) => defectSum + defect.count, 0),
      0
    );

    const totalMinorDefectsInUpdatedGarments = updatedGarments.reduce(
      (sum, g) =>
        sum +
        g.defects
          .filter((d) => d.severity === "Minor")
          .reduce((defectSum, defect) => defectSum + defect.count, 0),
      0
    );

    if (!spiStatus || !measurementStatus) {
      overallOperatorStatusKey = "Pending";
    } else if (anyCriticalDefectInUpdatedGarments) {
      overallOperatorStatusKey = "Reject-Critical";
    } else if (totalMajorDefectsInUpdatedGarments >= 2) {
      overallOperatorStatusKey = "Reject-Major-M";
    } else if (totalMinorDefectsInUpdatedGarments >= 2) {
      overallOperatorStatusKey = "Reject-Minor-M";
    } else if (totalMajorDefectsInUpdatedGarments === 1) {
      // This condition is met if SPI/Meas Pass, not critical, <2 Minor, 1 Major
      overallOperatorStatusKey = "Reject-Major-S";
    } else if (totalMinorDefectsInUpdatedGarments === 1) {
      // This condition is met if SPI/Meas Pass, not critical, no Major, 1 Minor
      overallOperatorStatusKey = "Reject-Minor-S";
    } else if (spiStatus === "Reject" || measurementStatus === "Reject") {
      // This condition is met if not critical, <2 Major, <2 Minor, but SPI/Meas is Reject
      overallOperatorStatusKey = "Reject";
    } else if (
      spiStatus === "Pass" &&
      measurementStatus === "Pass" &&
      totalMajorDefectsInUpdatedGarments === 0 &&
      totalMinorDefectsInUpdatedGarments === 0
    ) {
      overallOperatorStatusKey = "Pass";
    } else {
      // Fallback, though ideally all cases should be covered
      overallOperatorStatusKey = "Unknown";
    }

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
      spi_images: uploadedSpiImagePaths,
      measurement: measurementStatus,
      measurement_images: uploadedMeasurementImagePaths,
      checked_quantity: garments.length,
      rejectedGarmentCount: rejectedGarmentCountForOperator,
      inspection_time: inspectionTime,
      remark: remarkText,
      qualityStatus,
      defectImages: uploadedDefectImagePaths,
      overall_roving_status: overallOperatorStatusKey,
      rejectGarments: [
        {
          totalCount: totalDefectCount,
          garments: updatedGarments.filter((g) => g.defects.length > 0)
        }
      ]
    };

    let totalOperatorsForLine = 0;
    const numericLineNoFromForm = getNumericLineValue(lineNo);
    if (
      numericLineNoFromForm !== null &&
      lineWorkerData &&
      lineWorkerData.length > 0
    ) {
      const selectedLineInfo = lineWorkerData.find((s) => {
        const numericLineNoFromData = getNumericLineValue(s.lineNo);
        return (
          numericLineNoFromData !== null &&
          numericLineNoFromData === numericLineNoFromForm
        );
      });
      if (selectedLineInfo) {
        totalOperatorsForLine =
          selectedLineInfo.editedWorkerCount !== null &&
          selectedLineInfo.editedWorkerCount !== undefined
            ? selectedLineInfo.editedWorkerCount
            : selectedLineInfo.realWorkerCount || 0;
      } else {
        console.warn(
          `Worker data not found for line ${lineNo}. total_operators will be defaulted to 0.`
        );
      }
    } else {
      console.warn(
        `Line number (${lineNo}) is invalid or lineWorkerData is not available. total_operators will be defaulted to 0.`
      );
    }

    const newCompleteInspectOperatorsForRep =
      inspectionsCompletedForSelectedRep + 1;

    const newInspectStatus =
      totalOperatorsForLine > 0 &&
      newCompleteInspectOperatorsForRep >= totalOperatorsForLine
        ? "Completed"
        : "Not Complete";

    const reportPayload = {
      inline_roving_id: Date.now(),
      report_name: "QC Inline Roving",
      inspection_date: currentDate.toLocaleDateString("en-US"),
      mo_no: moNo,
      line_no: lineNo,
      inspection_rep_item: {
        inspection_rep_name: selectedManualInspectionRep,
        emp_id: user?.emp_id || "Guest",
        eng_name: user?.eng_name || "Guest",
        total_operators: totalOperatorsForLine,
        complete_inspect_operators: newCompleteInspectOperatorsForRep,
        Inspect_status: newInspectStatus,
        inlineData: [singleOperatorInspectionData]
      }
    };

    try {
      await axios.post(
        `${API_BASE_URL}/api/save-qc-inline-roving`,
        reportPayload
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: t(
          "qcRoving.submission.success",
          "QC Inline Roving data saved successfully!"
        )
      });
      fetchInspectionsCompleted();
      resetForm();
    } catch (error) {
      console.error("Error saving QC Inline Roving data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save QC Inline Roving data."
      });
    }
  };

  const handleUserDataFetched = (userData) => {
    setScannedUserData(userData);
    setShowScanner(false);
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  const getDefectNameForDisplay = (defect) => {
    // Renamed for clarity
    if (!defect) return "N/A";
    switch (
      defectDisplayLanguage // Use defectDisplayLanguage state
    ) {
      case "kh":
        return defect.khmer || defect.english;
      case "ch":
        return defect.chinese || defect.english;
      case "en":
      default:
        return defect.english;
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

  // Calculate Overall Status for the current garment
  let overallStatusText = "";
  let overallStatusColor = "";

  const anyCriticalDefectInOverallGarments = garments.some((g) =>
    g.defects.some((d) => d.severity === "Critical")
  );

  const totalMajorDefectsInOverallGarments = garments.reduce(
    (sum, g) =>
      sum +
      g.defects
        .filter((d) => d.severity === "Major")
        .reduce((defectSum, defect) => defectSum + defect.count, 0),
    0
  );

  const totalMinorDefectsInOverallGarments = garments.reduce(
    (sum, g) =>
      sum +
      g.defects
        .filter((d) => d.severity === "Minor")
        .reduce((defectSum, defect) => defectSum + defect.count, 0),
    0
  );

  if (!spiStatus || !measurementStatus) {
    overallStatusText = t("qcRoving.pending", "Pending");
    overallStatusColor = "bg-gray-200 text-gray-700";
  } else if (anyCriticalDefectInOverallGarments) {
    overallStatusText = t("qcRoving.rejectCritical", "Reject-Critical");
    overallStatusColor = "bg-red-300 text-red-800";
  } else if (totalMajorDefectsInOverallGarments >= 2) {
    overallStatusText = t("qcRoving.rejectMajorMultiple", "Reject-Major-M");
    overallStatusColor = "bg-red-300 text-red-800";
  } else if (totalMinorDefectsInOverallGarments >= 2) {
    overallStatusText = t("qcRoving.rejectMinorMultiple", "Reject-Minor-M");
    overallStatusColor = "bg-red-100 text-red-800";
  } else if (totalMajorDefectsInOverallGarments === 1) {
    overallStatusText = t("qcRoving.rejectMajorSingle", "Reject-Major-S");
    overallStatusColor = "bg-red-300 text-red-800";
  } else if (totalMinorDefectsInOverallGarments === 1) {
    overallStatusText = t("qcRoving.rejectMinorSingle", "Reject-Minor-S");
    overallStatusColor = "bg-yellow-200 text-yellow-800";
  } else if (spiStatus === "Reject" || measurementStatus === "Reject") {
    overallStatusText = t("qcRoving.rejectSpiMeas", "Reject");
    overallStatusColor = "bg-yellow-100 text-yellow-800";
  } else if (
    spiStatus === "Pass" &&
    measurementStatus === "Pass" &&
    totalMajorDefectsInOverallGarments === 0 &&
    totalMinorDefectsInOverallGarments === 0
  ) {
    overallStatusText = t("qcRoving.pass", "Pass");
    overallStatusColor = "bg-green-100 text-green-800";
  } else {
    overallStatusText = t("qcRoving.unknown", "Unknown");
    overallStatusColor = "bg-gray-200 text-gray-700";
  }

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

  const inspectionRepOptions = [1, 2, 3, 4, 5].map((num) => ({
    value: toOrdinalFormattedString(num, t),
    label: toOrdinalFormattedString(num, t)
  }));

  const isFormValid =
    lineNo &&
    moNo &&
    selectedOperationId &&
    selectedManualInspectionRep &&
    spiStatus &&
    measurementStatus &&
    scannedUserData;

  const inspectionContextData = {
    date: currentDate.toISOString().split("T")[0],
    lineNo: lineNo || "NA_Line",
    moNo: moNo || "NA_MO",
    operationId: selectedOperationId || "NA_Op"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t("qcRoving.qc_inline_roving_inspection")}
        </h1>
        {/* Tab Buttons*/}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 ${
              activeTab === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-lg`}
          >
            {t("qcRoving.qcInlineRoving")}
          </button>
          <button
            onClick={() => setActiveTab("pairing")}
            className={`px-4 py-2 ${
              activeTab === "pairing"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("qcRoving.pairing", "Pairing")}
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
            onClick={() => setActiveTab("pairingdata")}
            className={`px-4 py-2 ${
              activeTab === "pairingdata"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t("qcRoving.pairingdata")}
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

        {activeTab === "form" ? (
          <>
            {/* ... Progress Bar and Main Form Section (Inspection Rep, Date, Line, MO)... */}
            <div className="my-4 p-4 bg-blue-100 rounded-lg shadow">
              <h3 className="text-md font-semibold text-gray-700 mb-2">
                {t(
                  "qcRoving.lineRepProgressTitle",
                  "Line {{lineDisplayValue}} - {{repName}}: Inspection Progress",
                  {
                    lineDisplayValue:
                      getNumericLineValue(lineNo) || t("qcRoving.na", "N/A"),
                    repName:
                      selectedManualInspectionRep || t("qcRoving.na", "N/A")
                  }
                )}
              </h3>
              {(() => {
                const numericLineNoFromForm = getNumericLineValue(lineNo);
                if (!selectedManualInspectionRep) {
                  return (
                    <p className="text-sm text-gray-500">
                      {t(
                        "qcRoving.selectInspectionRepForProgress",
                        "Select an inspection repetition to see progress."
                      )}
                    </p>
                  );
                }
                if (!lineNo || !moNo) {
                  return (
                    <p className="text-sm text-gray-500">
                      {t(
                        "qcRoving.fillLineMoOpForProgress",
                        "Please select Line, MO, and Operation to see specific progress."
                      )}
                    </p>
                  );
                }
                if (lineWorkerDataLoading || lineWorkerDataError) {
                  if (lineWorkerDataLoading)
                    return (
                      <p className="text-sm text-gray-500">
                        {t(
                          "qcRoving.loadingWorkerData",
                          "Loading worker data..."
                        )}
                      </p>
                    );
                  if (lineWorkerDataError)
                    return (
                      <p className="text-sm text-red-500">
                        {lineWorkerDataError}
                      </p>
                    );
                  return (
                    <p className="text-sm text-gray-500">
                      {t(
                        "qcRoving.selectLineForProgress",
                        "Select a line to see worker status."
                      )}
                    </p>
                  );
                }
                const selectedLineInfo = lineWorkerData.find((s) => {
                  const numericLineNoFromData = getNumericLineValue(s.lineNo);
                  return (
                    numericLineNoFromData !== null &&
                    numericLineNoFromData === numericLineNoFromForm
                  );
                });
                if (selectedLineInfo) {
                  const totalWorkersForLine =
                    selectedLineInfo.editedWorkerCount !== null &&
                    selectedLineInfo.editedWorkerCount !== undefined
                      ? selectedLineInfo.editedWorkerCount
                      : selectedLineInfo.realWorkerCount || 0;
                  const progressPercent =
                    totalWorkersForLine > 0
                      ? (inspectionsCompletedForSelectedRep /
                          totalWorkersForLine) *
                        100
                      : 0;
                  return (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        {t(
                          "qcRoving.inspectionsCompleted",
                          "Inspections Completed"
                        )}{" "}
                        : {inspectionsCompletedForSelectedRep} /{" "}
                        {totalWorkersForLine}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className={`${
                            progressPercent >= 100
                              ? "bg-green-600"
                              : "bg-blue-600"
                          } h-2.5 rounded-full`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <p className="text-sm text-gray-500">
                      {t(
                        "qcRoving.noWorkerDataForLine",
                        "No worker data available for selected line."
                      )}
                    </p>
                  );
                }
              })()}
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label
                    htmlFor="manualInspectionRep"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("qcRoving.inspectionNo", "Inspection No")}
                  </label>
                  <select
                    id="inspectionRep"
                    value={selectedManualInspectionRep}
                    onChange={(e) =>
                      setSelectedManualInspectionRep(e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">
                      {t(
                        "qcRoving.select_inspection_rep",
                        "Select Inspection Rep..."
                      )}
                    </option>
                    {inspectionRepOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                {/* --- MODIFIED SECTION FOR QR SCANNER AND MANUAL ID --- */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("qcRoving.operatorId", "Operator ID")}
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <button
                      onClick={() => setShowScanner(true)}
                      disabled={isManualMode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <QrCode className="w-5 h-5" />
                      {t("qcRoving.scanQR")}
                    </button>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="manualMode"
                        checked={isManualMode}
                        onChange={(e) => {
                          setIsManualMode(e.target.checked);
                          if (!e.target.checked) {
                            setManualWorkerIdSearch("");
                            setManualWorkerIdOptions([]);
                            // Optionally clear scanned user data if you switch back
                            // setScannedUserData(null);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="manualMode"
                        className="ml-2 text-sm text-gray-900"
                      >
                        {t("qcRoving.manual", "Manual")}
                      </label>
                    </div>
                  </div>

                  {isManualMode && (
                    <div className="relative mt-2" ref={workerIdDropdownRef}>
                      <input
                        type="text"
                        value={manualWorkerIdSearch}
                        onChange={(e) =>
                          setManualWorkerIdSearch(e.target.value)
                        }
                        placeholder={t(
                          "qcRoving.search_worker_id",
                          "Search Worker ID..."
                        )}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!isManualMode}
                      />
                      {showWorkerIdDropdown && (
                        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                          {isSearchingWorkerId ? (
                            <li className="p-2 text-gray-500">
                              {t("qcRoving.searching", "Searching...")}
                            </li>
                          ) : (
                            manualWorkerIdOptions.map((user) => (
                              <li
                                key={user.emp_id}
                                onClick={() =>
                                  handleWorkerIdSelect(user.emp_id)
                                }
                                className="p-2 hover:bg-blue-100 cursor-pointer"
                              >
                                {user.emp_id} - {user.eng_name}
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  {scannedUserData && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-700">
                        {t(
                          "qcRoving.operatorSelected",
                          "Operator Selected: {{emp_id}}",
                          { emp_id: scannedUserData.emp_id }
                        )}
                      </p>
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
                    {t("qcRoving.inspectionType")}
                  </label>
                  <div className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="Normal"
                        checked={inspectionType === "Normal"}
                        onChange={(e) => setInspectionType(e.target.value)}
                        className="form-radio"
                      />
                      <span className="ml-2">{t("qcRoving.normal")}</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        value="Critical"
                        checked={inspectionType === "Critical"}
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

              {/* --- SPI and Measurement Section --- */}
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mt-2">
                    {t("qcRoving.spi")}
                  </label>
                  <select
                    value={spiStatus}
                    onChange={(e) => setSpiStatus(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">{t("qcRoving.select_spi_status")}</option>
                    <option value="Pass">{t("qcRoving.pass")}</option>
                    <option value="Reject">{t("qcRoving.reject")}</option>
                  </select>
                  <div className="mt-2">
                    <ImageCaptureUpload
                      key={`spi-${imageUploaderKey}`}
                      imageType="spi"
                      maxImages={5}
                      onImageFilesChange={setSpiFilesToUpload}
                      inspectionData={inspectionContextData}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mt-2">
                    {t("qcRoving.measurement")}
                  </label>
                  <select
                    value={measurementStatus}
                    onChange={(e) => setMeasurementStatus(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">
                      {t("qcRoving.select_measurement_status")}
                    </option>
                    <option value="Pass">{t("qcRoving.pass")}</option>
                    <option value="Reject">{t("qcRoving.reject")}</option>
                  </select>
                  <div className="mt-2">
                    <ImageCaptureUpload
                      key={`measurement-${imageUploaderKey}`}
                      imageType="measurement"
                      maxImages={5}
                      onImageFilesChange={setMeasurementFilesToUpload}
                      inspectionData={inspectionContextData}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Quality Section (Defect Recording) --- */}
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
                      className={`px-3 py-1 rounded-md text-sm ${
                        commonResultStatus === "Pass"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t("qcRoving.status")}: {commonResultStatus}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {currentGarmentDefects.length > 0 ? (
                      currentGarmentDefects.map((defect, defectIndex) => {
                        const defectInfo = defects.find(
                          (d) => d.english === defect.name
                        );
                        let defectSeverityText = "";
                        let defectSeverityColor = "";

                        let buyerSpecificStatus = null;
                        let availableSeverityOptions = [];
                        let initialSeverityForDropdown = "Minor";

                        const defectMasterInfo = defects.find(
                          (d) => d.english === defect.name
                        );
                        if (
                          defectMasterInfo &&
                          defectMasterInfo.statusByBuyer
                        ) {
                          buyerSpecificStatus =
                            defectMasterInfo.statusByBuyer.find(
                              (bs) => bs.buyerName === apiDeterminedBuyer
                            );
                          if (buyerSpecificStatus) {
                            availableSeverityOptions =
                              Array.isArray(buyerSpecificStatus.defectStatus) &&
                              buyerSpecificStatus.defectStatus.length > 0
                                ? [...buyerSpecificStatus.defectStatus]
                                : ["Minor"];
                            initialSeverityForDropdown =
                              buyerSpecificStatus.isCommon || "Minor";
                          } else {
                            availableSeverityOptions = [
                              "Minor",
                              "Major",
                              "Critical"
                            ];
                            initialSeverityForDropdown = "Minor";
                          }
                        }
                        const currentValidSeverity =
                          availableSeverityOptions.includes(defect.severity)
                            ? defect.severity
                            : initialSeverityForDropdown;

                        if (defect.severity === "Critical") {
                          defectSeverityText = t(
                            "qcRoving.defectStatus.rejectCritical",
                            "Reject-Critical"
                          );
                          defectSeverityColor = "bg-red-100 text-red-800";
                        } else if (defect.severity === "Major") {
                          defectSeverityText = t(
                            "qcRoving.defectStatus.rejectMajor",
                            "Reject-Major"
                          );
                          defectSeverityColor = "bg-orange-500 text-orange-800";
                        } else if (defect.severity === "Minor") {
                          defectSeverityText = t(
                            "qcRoving.defectStatus.rejectMinor",
                            "Reject-Minor"
                          );
                          defectSeverityColor = "bg-yellow-100 text-yellow-800";
                        }
                        return (
                          <div
                            key={`${currentGarmentIndex}-${defectIndex}`}
                            className="flex items-center justify-between bg-white p-3 shadow-sm flex-wrap gap-y-2 px-3 py-1 text-lg"
                          >
                            <div className="flex items-center flex-grow mr-2">
                              <span className="truncate text-sm">
                                {defectInfo
                                  ? getDefectNameForDisplay(defectInfo)
                                  : defect.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {buyerSpecificStatus &&
                                availableSeverityOptions.length > 0 && (
                                  <select
                                    value={currentValidSeverity} // Use the validated current severity
                                    onChange={(e) =>
                                      handleDefectSeverityChange(
                                        defectIndex,
                                        e.target.value
                                      )
                                    }
                                    className="text-xs p-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {availableSeverityOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {t(
                                          `defectBuyerStatus.classifications.${opt.toLowerCase()}`,
                                          opt
                                        )}
                                      </option>
                                    ))}
                                  </select>
                                )}
                            </div>
                            <div className="flex items-center flex-grow mr-2">
                              <span
                                className={`font-semibold text-sm rounded-md ${defectSeverityColor} mr-2`}
                              >
                                {`(${defectSeverityText})`}
                              </span>
                            </div>

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
                        value={selectedDefectName}
                        onChange={(e) => {
                          setSelectedDefectName(e.target.value);
                          if (e.target.value) {
                            addDefect(e.target.value);
                          }
                        }}
                        className="border p-2 rounded w-full"
                        disabled={!moNo || !selectedOperationId}
                      >
                        <option value="">{t("qcRoving.select_defect")}</option>
                        {defects
                          .sort((a, b) =>
                            getDefectNameForDisplay(a).localeCompare(
                              getDefectNameForDisplay(b)
                            )
                          )
                          .map((defect) => (
                            <option key={defect.code} value={defect.english}>
                              {getDefectNameForDisplay(defect)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Defect Metrics and Image Upload --- */}
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
                {/* ImageCaptureUpload component for defects */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("qcRoving.defectImages", "Defect Images")}
                  </label>
                  <ImageCaptureUpload
                    key={`defect-${imageUploaderKey}`}
                    imageType="defect"
                    maxImages={5}
                    onImageFilesChange={setDefectFilesToUpload}
                    inspectionData={inspectionContextData}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <div className="space-x-4">
                <button
                  onClick={() =>
                    setCurrentGarmentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentGarmentIndex === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg disabled:opacity-50"
                >
                  {t("qcRoving.previous")}
                </button>
                <button
                  onClick={() =>
                    setCurrentGarmentIndex((prev) =>
                      Math.min(garments.length - 1, prev + 1)
                    )
                  }
                  disabled={currentGarmentIndex === garments.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {t("qcRoving.next")}
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300">
              <h4 className="text-md font-semibold text-gray-700 mb-2">
                {t("qcRoving.rovingStatus", "Quality Status")}
              </h4>
              <span
                className={`px-4 py-2 text-lg font-semibold rounded-md ${overallStatusColor}`}
              >
                {overallStatusText}
              </span>
            </div>

            <div className="mt-6">
              <label
                htmlFor="remark"
                className="block text-sm font-medium text-gray-700"
              >
                {t("qcRoving.remark", "Remark (Optional)")}
              </label>
              <textarea
                id="remark"
                name="remark"
                rows="3"
                maxLength="250"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t(
                  "qcRoving.remarkPlaceholder",
                  "Enter any remarks here..."
                )}
              ></textarea>
              <p className="mt-1 text-xs text-gray-500 text-right">
                {remarkText.length} / 250{" "}
                {t("qcRoving.characters", "characters")}
              </p>
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
            {showScanner && (
              <EmpQRCodeScanner
                onUserDataFetched={handleUserDataFetched}
                onClose={() => setShowScanner(false)}
              />
            )}
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
                  defectRatio,
                  remark: remarkText,
                  spiFilesToUpload,
                  measurementFilesToUpload,
                  rovingStatus: overallStatusText,
                  overallStatusColor: overallStatusColor
                }}
              />
            )}
          </>
        ) : activeTab === "pairing" ? (
          <RovingPairing />
        ) : activeTab === "data" ? (
          <RovingData />
        ) : activeTab === "pairingdata" ? (
          <RovingPairingData />
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
