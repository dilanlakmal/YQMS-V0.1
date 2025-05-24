// SCCPage.jsx
import axios from "axios";
import {
  CheckSquare,
  Eye,
  FileText,
  ListChecks,
  Settings2,
  ShieldCheck,
  ThermometerSun
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import DailyHTQC from "../components/inspection/scc/DailyHTQC";
import DailyFUQC from "../components/inspection/scc/DailyFUQC";
import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

const DEFAULT_TEMP_OFFSET_FUQC = 5;

const initialSharedStateFirstOutput = {
  _id: null,
  inspectionDate: new Date(),
  machineNo: "",
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  standardSpecification: [],
  referenceSampleImageFile: null,
  referenceSampleImageUrl: null,
  afterWashImageFile: null,
  afterWashImageUrl: null,
  remarks: ""
};

const initialSharedStateDailyTesting = {
  _id: null,
  inspectionDate: new Date(),
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  machineNo: "",
  standardSpecifications: { tempC: null, timeSec: null, pressure: null },
  numberOfRejections: 0,
  parameterAdjustmentRecords: [],
  finalResult: "Pending",
  remarks: "",
  afterWashImageFile: null,
  afterWashImageUrl: null
};

const initialDailyHTQCState = {
  _id: null,
  inspectionDate: new Date(),
  machineNo: "",
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  baseReqTemp: null,
  baseReqTime: null,
  baseReqPressure: null,
  inspections: [],
  stretchTestResult: "Pending",
  stretchTestRejectReasons: [],
  washingTestResult: "Pending",
  isStretchWashingTestDone: false
};

const initialDailyFUQCState = {
  _id: null,
  inspectionDate: new Date(),
  machineNo: "",
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  baseReqTemp: null,
  temp_offset: DEFAULT_TEMP_OFFSET_FUQC,
  inspections: [],
  remarks: ""
};

const initialHTInspectionReportState = {
  _id: null,
  inspectionDate: new Date(),
  machineNo: "",
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  batchNo: "",
  totalBundle: null,
  totalPcs: null,
  defects: [],
  remarks: "",
  defectImageFile: null,
  defectImageUrl: null
};

const SCCPage = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("firstOutputHT");

  const [htFormData, setHtFormData] = useState({
    ...initialSharedStateFirstOutput
  });
  const [fuFormData, setFuFormData] = useState({
    ...initialSharedStateFirstOutput
  });
  const [dailyTestingFormData, setDailyTestingFormData] = useState({
    ...initialSharedStateDailyTesting
  });
  const [dailyHTQCFormData, setDailyHTQCFormData] = useState({
    ...initialDailyHTQCState
  });
  const [dailyFUQCFormData, setDailyFUQCFormData] = useState({
    ...initialDailyFUQCState
  });
  const [htInspectionReportData, setHtInspectionReportData] = useState({
    ...initialHTInspectionReportState
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadSccImage = useCallback(
    async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
      const imageFormData = new FormData();
      imageFormData.append("imageFile", file);
      imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
      if (currentDataForImage.machineNo) {
        imageFormData.append("machineNo", currentDataForImage.machineNo);
      }
      imageFormData.append(
        "color",
        currentDataForImage.color || "UNKNOWN_COLOR"
      );
      imageFormData.append("imageType", imageTypeIdentifierForUpload);
      imageFormData.append(
        "inspectionDate",
        currentDataForImage.inspectionDate instanceof Date
          ? currentDataForImage.inspectionDate.toISOString().split("T")[0]
          : String(
              currentDataForImage.inspectionDate ||
                new Date().toISOString().split("T")[0]
            ).split("T")[0]
      );
      if (
        imageTypeIdentifierForUpload.startsWith("htDefect-") &&
        currentDataForImage.batchNo
      ) {
        imageFormData.append("batchNo", currentDataForImage.batchNo);
      }
      const imgRes = await axios.post(
        `${API_BASE_URL}/api/scc/upload-image`,
        imageFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (!imgRes.data.success) {
        throw new Error(
          t(
            "scc.errorUploadingImageGeneric",
            `Failed to upload ${imageTypeIdentifierForUpload} image.`
          )
        );
      }
      return imgRes.data;
    },
    [t]
  );

  const tabs = useMemo(
    () => [
      {
        id: "firstOutputHT",
        labelKey: "scc.tabs.firstOutputHT",
        icon: <FileText size={16} />,
        formType: "HT",
        data: htFormData,
        setter: setHtFormData,
        component: SCCFirstOutputForm,
        disabled: false
      },
      {
        id: "firstOutputFU",
        labelKey: "scc.tabs.firstOutputFU",
        icon: <FileText size={16} />,
        formType: "FU",
        data: fuFormData,
        setter: setFuFormData,
        component: SCCFirstOutputForm,
        disabled: false
      },
      {
        id: "dailyTesting",
        labelKey: "scc.tabs.dailyTesting",
        icon: <ThermometerSun size={16} />,
        formType: "DailyTesting",
        data: dailyTestingFormData,
        setter: setDailyTestingFormData,
        component: SCCDailyTesting,
        disabled: false
      },
      {
        id: "dailyHTQC",
        labelKey: "scc.tabs.dailyHTQC",
        icon: <CheckSquare size={16} />,
        formType: "DailyHTQC",
        data: dailyHTQCFormData,
        setter: setDailyHTQCFormData,
        component: DailyHTQC,
        disabled: false
      },
      {
        id: "dailyFUQC",
        labelKey: "scc.tabs.dailyFUQC",
        icon: <ShieldCheck size={16} />,
        formType: "DailyFUQC",
        data: dailyFUQCFormData,
        setter: setDailyFUQCFormData,
        component: DailyFUQC,
        disabled: false
      },
      {
        id: "htInspection",
        labelKey: "scc.tabs.htInspection",
        icon: <Eye size={16} />,
        formType: "HTInspectionReport",
        data: htInspectionReportData,
        setter: setHtInspectionReportData,
        component: HTInspectionReport,
        disabled: false
      }
    ],
    [
      htFormData,
      fuFormData,
      dailyTestingFormData,
      dailyHTQCFormData,
      dailyFUQCFormData,
      htInspectionReportData,
      t
    ]
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const CurrentFormComponent = activeTabData?.component;

  const handleFormSubmit = useCallback(
    async (formTypeToSubmit, specificPayload = null) => {
      let currentSetter,
        endpoint,
        successMessageKey,
        initialStateForReset,
        payloadToSend;
      // Use specificPayload if provided (typically from child components like DailyHTQC/FUQC),
      // otherwise use the form data from SCCPage's state.
      const formDataToProcess =
        specificPayload ||
        (formTypeToSubmit === "HT"
          ? htFormData
          : formTypeToSubmit === "FU"
          ? fuFormData
          : formTypeToSubmit === "DailyTesting"
          ? dailyTestingFormData
          : formTypeToSubmit === "DailyHTQC"
          ? dailyHTQCFormData
          : formTypeToSubmit === "DailyFUQC"
          ? dailyFUQCFormData
          : formTypeToSubmit === "HTInspectionReport"
          ? htInspectionReportData
          : {});

      if (formTypeToSubmit === "HT") {
        currentSetter = setHtFormData;
        endpoint = "/api/scc/ht-first-output";
        successMessageKey = "scc.dataSavedSuccess";
        initialStateForReset = initialSharedStateFirstOutput;
      } else if (formTypeToSubmit === "FU") {
        currentSetter = setFuFormData;
        endpoint = "/api/scc/fu-first-output";
        successMessageKey = "scc.dataSavedSuccess";
        initialStateForReset = initialSharedStateFirstOutput;
      } else if (formTypeToSubmit === "DailyTesting") {
        currentSetter = setDailyTestingFormData;
        endpoint = "/api/scc/daily-testing";
        successMessageKey = "sccdaily.reportSavedSuccess";
        initialStateForReset = initialSharedStateDailyTesting;
      } else if (formTypeToSubmit === "DailyHTQC") {
        currentSetter = setDailyHTQCFormData;
        endpoint = "/api/scc/daily-htfu-test";
        successMessageKey = "sccDailyHTQC.reportSavedSuccess";
        initialStateForReset = initialDailyHTQCState;
      } else if (formTypeToSubmit === "DailyFUQC") {
        currentSetter = setDailyFUQCFormData;
        endpoint = "/api/scc/daily-fuqc-test";
        successMessageKey = "sccDailyFUQC.reportSavedSuccess";
        initialStateForReset = initialDailyFUQCState;
      } else if (formTypeToSubmit === "HTInspectionReport") {
        currentSetter = setHtInspectionReportData;
        endpoint = "/api/scc/ht-inspection-report";
        successMessageKey = "sccHTInspection.reportSavedSuccess";
        initialStateForReset = initialHTInspectionReportState;
      } else {
        console.error("Unknown form type:", formTypeToSubmit);
        Swal.fire(t("scc.error"), "Unknown form type.", "error");
        return;
      }

      if (!user) {
        Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
        return;
      }

      // Basic Validation (using formDataToProcess)
      if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
        if (
          !formDataToProcess.inspectionDate ||
          !formDataToProcess.machineNo ||
          !formDataToProcess.moNo ||
          !formDataToProcess.color
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validationErrorBasicMachine"),
            "warning"
          );
          return;
        }
      } else if (formTypeToSubmit === "HTInspectionReport") {
        if (
          !formDataToProcess ||
          !formDataToProcess.inspectionDate ||
          !formDataToProcess.machineNo ||
          !formDataToProcess.moNo ||
          !formDataToProcess.color ||
          !formDataToProcess.batchNo ||
          formDataToProcess.totalPcs === null ||
          formDataToProcess.totalPcs <= 0
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("sccHTInspection.validation.fillBasicPayload"),
            "warning"
          );
          return;
        }
      } else if (formTypeToSubmit === "DailyTesting") {
        if (
          !formDataToProcess.inspectionDate ||
          !formDataToProcess.moNo ||
          !formDataToProcess.color ||
          !formDataToProcess.machineNo
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validationErrorBasicMachine"),
            "warning"
          );
          return;
        }
      } else if (
        formTypeToSubmit === "DailyHTQC" ||
        formTypeToSubmit === "DailyFUQC"
      ) {
        if (
          !formDataToProcess ||
          !formDataToProcess.inspectionDate ||
          !formDataToProcess.machineNo ||
          !formDataToProcess.moNo ||
          !formDataToProcess.color ||
          !formDataToProcess.currentInspection
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              formTypeToSubmit === "DailyHTQC"
                ? "sccDailyHTQC.validation.fillBasicPayload"
                : "sccDailyFUQC.validation.fillBasicPayload"
            ),
            "warning"
          );
          return;
        }
      }

      let formIsValid = true;
      if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
        if (
          !formDataToProcess.standardSpecification ||
          formDataToProcess.standardSpecification.length < 2
        ) {
          formIsValid = false;
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validation.specsRequired"),
            "warning"
          );
        }
        if (
          formIsValid &&
          !formDataToProcess.referenceSampleImageUrl &&
          !formDataToProcess.referenceSampleImageFile
        ) {
          formIsValid = false;
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validation.refImageRequired"),
            "warning"
          );
        }
      }
      if (!formIsValid) return;

      setIsSubmitting(true);
      try {
        let finalImageUrls = {};
        let imageTypeIdentifier = "";
        if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
          if (formDataToProcess.referenceSampleImageFile) {
            imageTypeIdentifier = `referenceSample-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
            const imgData = await uploadSccImage(
              formDataToProcess.referenceSampleImageFile,
              formDataToProcess,
              imageTypeIdentifier
            );
            finalImageUrls.referenceSampleImage = imgData.filePath;
          } else {
            finalImageUrls.referenceSampleImage =
              formDataToProcess.referenceSampleImageUrl;
          }
          if (formDataToProcess.afterWashImageFile) {
            imageTypeIdentifier = `afterWash-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
            const imgData = await uploadSccImage(
              formDataToProcess.afterWashImageFile,
              formDataToProcess,
              imageTypeIdentifier
            );
            finalImageUrls.afterWashImage = imgData.filePath;
          } else {
            finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
          }
        } else if (formTypeToSubmit === "DailyTesting") {
          if (formDataToProcess.afterWashImageFile) {
            imageTypeIdentifier = `afterWashDaily-${formDataToProcess.machineNo}`;
            const imgData = await uploadSccImage(
              formDataToProcess.afterWashImageFile,
              formDataToProcess,
              imageTypeIdentifier
            );
            finalImageUrls.afterWashImage = imgData.filePath;
          } else {
            finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
          }
        } else if (formTypeToSubmit === "HTInspectionReport") {
          if (formDataToProcess.defectImageFile) {
            imageTypeIdentifier = `htDefect-${formDataToProcess.machineNo}-${formDataToProcess.moNo}-${formDataToProcess.color}-${formDataToProcess.batchNo}`;
            const imgData = await uploadSccImage(
              formDataToProcess.defectImageFile,
              formDataToProcess,
              imageTypeIdentifier
            );
            finalImageUrls.defectImageUrl = imgData.filePath;
          } else {
            finalImageUrls.defectImageUrl = formDataToProcess.defectImageUrl;
          }
        }

        if (
          formTypeToSubmit === "DailyHTQC" ||
          formTypeToSubmit === "DailyFUQC"
        ) {
          payloadToSend = { ...formDataToProcess };
          if (
            formTypeToSubmit === "DailyHTQC" &&
            (payloadToSend.stretchTestResult === "Pass" ||
              payloadToSend.stretchTestResult === "Pending")
          ) {
            payloadToSend.stretchTestRejectReasons = [];
          }
        } else if (formTypeToSubmit === "HTInspectionReport") {
          payloadToSend = {
            ...formDataToProcess,
            defectImageUrl: finalImageUrls.defectImageUrl,
            defectImageFile: undefined,
            emp_id: user.emp_id,
            emp_kh_name: user.kh_name || "N/A",
            emp_eng_name: user.eng_name || "N/A",
            emp_dept_name: user.dept_name || "N/A",
            emp_sect_name: user.sect_name || "N/A",
            emp_job_title: user.job_title || "N/A"
          };
        } else {
          const now = new Date();
          const inspectionTime = `${String(now.getHours()).padStart(
            2,
            "0"
          )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
            now.getSeconds()
          ).padStart(2, "0")}`;
          payloadToSend = {
            _id: formDataToProcess._id || undefined,
            inspectionDate: formDataToProcess.inspectionDate,
            machineNo: formDataToProcess.machineNo,
            moNo: formDataToProcess.moNo,
            buyer: formDataToProcess.buyer,
            buyerStyle: formDataToProcess.buyerStyle,
            color: formDataToProcess.color,
            remarks: formDataToProcess.remarks?.trim() || "NA",
            emp_id: user.emp_id,
            emp_kh_name: user.kh_name || "N/A",
            emp_eng_name: user.eng_name || "N/A",
            emp_dept_name: user.dept_name || "N/A",
            emp_sect_name: user.sect_name || "N/A",
            emp_job_title: user.job_title || "N/A",
            inspectionTime: inspectionTime
          };
          if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            payloadToSend.referenceSampleImage =
              finalImageUrls.referenceSampleImage;
            payloadToSend.afterWashImage = finalImageUrls.afterWashImage;
            payloadToSend.standardSpecification =
              formDataToProcess.standardSpecification.map((spec) => ({
                type: spec.type,
                method: spec.method,
                timeSec: spec.timeSec ? Number(spec.timeSec) : null,
                tempC: spec.tempC ? Number(spec.tempC) : null,
                tempOffsetMinus:
                  (parseFloat(spec.tempOffset) || 0) !== 0
                    ? -Math.abs(parseFloat(spec.tempOffset))
                    : 0,
                tempOffsetPlus:
                  (parseFloat(spec.tempOffset) || 0) !== 0
                    ? Math.abs(parseFloat(spec.tempOffset))
                    : 0,
                pressure: spec.pressure ? Number(spec.pressure) : null,
                status: spec.status,
                remarks: spec.remarks?.trim() || "NA"
              }));
          } else if (formTypeToSubmit === "DailyTesting") {
            payloadToSend.standardSpecifications = {
              tempC: formDataToProcess.standardSpecifications.tempC
                ? Number(formDataToProcess.standardSpecifications.tempC)
                : null,
              timeSec: formDataToProcess.standardSpecifications.timeSec
                ? Number(formDataToProcess.standardSpecifications.timeSec)
                : null,
              pressure: formDataToProcess.standardSpecifications.pressure
                ? Number(formDataToProcess.standardSpecifications.pressure)
                : null
            };
            payloadToSend.numberOfRejections =
              formDataToProcess.numberOfRejections || 0;
            payloadToSend.parameterAdjustmentRecords = (
              formDataToProcess.parameterAdjustmentRecords || []
            ).map((rec) => ({
              rejectionNo: rec.rejectionNo,
              adjustedTempC:
                rec.adjustedTempC !== null && rec.adjustedTempC !== ""
                  ? Number(rec.adjustedTempC)
                  : null,
              adjustedTimeSec:
                rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
                  ? Number(rec.adjustedTimeSec)
                  : null,
              adjustedPressure:
                rec.adjustedPressure !== null && rec.adjustedPressure !== ""
                  ? Number(rec.adjustedPressure)
                  : null
            }));
            payloadToSend.finalResult =
              formDataToProcess.finalResult || "Pending";
            payloadToSend.afterWashImage = finalImageUrls.afterWashImage;
          }
        }

        const response = await axios.post(
          `${API_BASE_URL}${endpoint}`,
          payloadToSend
        );
        Swal.fire(
          t("scc.success"),
          response.data.message || t(successMessageKey),
          "success"
        );
        const updatedRecord = response.data.data;

        // State Update Logic
        if (
          formTypeToSubmit === "DailyHTQC" ||
          formTypeToSubmit === "DailyFUQC" ||
          formTypeToSubmit === "HTInspectionReport"
        ) {
          // For these forms, the child component handles its internal state.
          // We update the parent's copy of the data with the response from the server,
          // which includes the complete, updated record.
          currentSetter((prevData) => ({
            ...initialStateForReset, // Start with a clean slate for non-persistent fields
            ...updatedRecord, // Overlay with all fields from the updated record
            inspectionDate: new Date(updatedRecord.inspectionDate), // Ensure date is a Date object
            // Ensure specific fields that child might not explicitly send back are preserved or reset
            ...(formTypeToSubmit === "DailyFUQC" && {
              temp_offset:
                updatedRecord.temp_offset !== undefined
                  ? updatedRecord.temp_offset
                  : DEFAULT_TEMP_OFFSET
            }),
            ...(formTypeToSubmit === "DailyHTQC" && {
              stretchTestRejectReasons:
                updatedRecord.stretchTestRejectReasons || []
            })
          }));
        } else {
          // For HT, FU, DailyTesting
          let stateUpdate = {
            ...initialStateForReset,
            _id: updatedRecord._id,
            machineNo: updatedRecord.machineNo,
            moNo: updatedRecord.moNo,
            color: updatedRecord.color,
            buyer: formDataToProcess.buyer,
            buyerStyle: formDataToProcess.buyerStyle,
            inspectionDate: new Date(updatedRecord.inspectionDate),
            remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks
          };
          if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            stateUpdate.standardSpecification =
              updatedRecord.standardSpecification.map((spec) => ({
                ...spec,
                tempOffset:
                  spec.tempOffsetPlus !== 0
                    ? String(spec.tempOffsetPlus)
                    : spec.tempOffsetMinus !== 0
                    ? String(spec.tempOffsetMinus)
                    : "0",
                remarks: spec.remarks === "NA" ? "" : spec.remarks,
                pressure: spec.pressure !== null ? String(spec.pressure) : ""
              }));
            stateUpdate.referenceSampleImageUrl =
              updatedRecord.referenceSampleImage;
            stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
          } else if (formTypeToSubmit === "DailyTesting") {
            stateUpdate.standardSpecifications = {
              ...updatedRecord.standardSpecifications,
              pressure:
                updatedRecord.standardSpecifications.pressure !== null
                  ? String(updatedRecord.standardSpecifications.pressure)
                  : ""
            };
            stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
            stateUpdate.parameterAdjustmentRecords = (
              updatedRecord.parameterAdjustmentRecords || []
            ).map((rec) => ({
              ...rec,
              adjustedTempC:
                rec.adjustedTempC !== null ? String(rec.adjustedTempC) : "",
              adjustedTimeSec:
                rec.adjustedTimeSec !== null ? String(rec.adjustedTimeSec) : "",
              adjustedPressure:
                rec.adjustedPressure !== null
                  ? String(rec.adjustedPressure)
                  : ""
            }));
            stateUpdate.finalResult = updatedRecord.finalResult;
            stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
          }
          currentSetter(stateUpdate);
        }
      } catch (error) {
        console.error(
          t("scc.errorSubmittingLog"),
          error.response?.data || error.message || error
        );
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          t("scc.errorSubmitting");
        Swal.fire(t("scc.error"), errorMessage, "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user,
      t,
      uploadSccImage,
      htFormData,
      fuFormData,
      dailyTestingFormData,
      dailyHTQCFormData,
      dailyFUQCFormData,
      htInspectionReportData,
      setHtFormData,
      setFuFormData,
      setDailyTestingFormData,
      setDailyHTQCFormData,
      setDailyFUQCFormData,
      setHtInspectionReportData
    ]
  );

  if (authLoading) {
    return (
      <div className="p-6 text-center">
        {t("scc.loadingUser", "Loading user data...")}
      </div>
    );
  }
  if (!user && !authLoading) {
    return (
      <div className="p-6 text-center">
        {t("scc.noUserFound", "User not found. Please log in.")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
          {t("scc.title", "SCC Inspection (HT/FU)")}
        </h1>
        <div className="flex flex-wrap justify-center border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {tab.icon}
              <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
            </button>
          ))}
        </div>
        <div className="p-3 sm:p-4 md:p-5 lg:p-6">
          {CurrentFormComponent &&
            activeTabData &&
            !activeTabData.disabled &&
            user && (
              <CurrentFormComponent
                formType={activeTabData.formType}
                key={`${activeTab}-${activeTabData.formType}`}
                formData={activeTabData.data}
                onFormDataChange={activeTabData.setter}
                onFormSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          {activeTabData && activeTabData.disabled && (
            <div className="text-center py-10 text-gray-500">
              <Settings2 size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-xl">{t(activeTabData.labelKey)}</p>
              <p>
                {t(
                  "scc.tabUnderConstruction",
                  "This section is under construction."
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SCCPage;
