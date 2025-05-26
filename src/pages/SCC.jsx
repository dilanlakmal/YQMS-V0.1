// // SCCPage.jsx
// import axios from "axios";
// import {
//   CheckSquare,
//   Eye,
//   FileText,
//   ListChecks,
//   Settings2,
//   ShieldCheck,
//   ThermometerSun
// } from "lucide-react";
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC";
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const DEFAULT_TEMP_OFFSET_FUQC = 5;

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [],
//   referenceSampleImageFile: null,
//   referenceSampleImageUrl: null,
//   afterWashImageFile: null,
//   afterWashImageUrl: null,
//   remarks: ""
// };

// const initialSharedStateDailyTesting = {
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   machineNo: "",
//   standardSpecifications: { tempC: null, timeSec: null, pressure: null },
//   numberOfRejections: 0,
//   parameterAdjustmentRecords: [],
//   finalResult: "Pending",
//   remarks: "",
//   afterWashImageFile: null,
//   afterWashImageUrl: null
// };

// const initialDailyHTQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null,
//   baseReqTime: null,
//   baseReqPressure: null,
//   inspections: [],
//   stretchTestResult: "Pending",
//   stretchTestRejectReasons: [],
//   washingTestResult: "Pending",
//   isStretchWashingTestDone: false
// };

// const initialDailyFUQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null,
//   temp_offset: DEFAULT_TEMP_OFFSET_FUQC,
//   inspections: [],
//   remarks: ""
// };

// const initialHTInspectionReportState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   batchNo: "",
//   totalBundle: null,
//   totalPcs: null,
//   defects: [],
//   remarks: "",
//   defectImageFile: null,
//   defectImageUrl: null
// };

// const SCCPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("firstOutputHT");

//   const [htFormData, setHtFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [fuFormData, setFuFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [dailyTestingFormData, setDailyTestingFormData] = useState({
//     ...initialSharedStateDailyTesting
//   });
//   const [dailyHTQCFormData, setDailyHTQCFormData] = useState({
//     ...initialDailyHTQCState
//   });
//   const [dailyFUQCFormData, setDailyFUQCFormData] = useState({
//     ...initialDailyFUQCState
//   });
//   const [htInspectionReportData, setHtInspectionReportData] = useState({
//     ...initialHTInspectionReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
//       if (currentDataForImage.machineNo) {
//         imageFormData.append("machineNo", currentDataForImage.machineNo);
//       }
//       imageFormData.append(
//         "color",
//         currentDataForImage.color || "UNKNOWN_COLOR"
//       );
//       imageFormData.append("imageType", imageTypeIdentifierForUpload);
//       imageFormData.append(
//         "inspectionDate",
//         currentDataForImage.inspectionDate instanceof Date
//           ? currentDataForImage.inspectionDate.toISOString().split("T")[0]
//           : String(
//               currentDataForImage.inspectionDate ||
//                 new Date().toISOString().split("T")[0]
//             ).split("T")[0]
//       );
//       if (
//         imageTypeIdentifierForUpload.startsWith("htDefect-") &&
//         currentDataForImage.batchNo
//       ) {
//         imageFormData.append("batchNo", currentDataForImage.batchNo);
//       }
//       const imgRes = await axios.post(
//         `${API_BASE_URL}/api/scc/upload-image`,
//         imageFormData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );
//       if (!imgRes.data.success) {
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifierForUpload} image.`
//           )
//         );
//       }
//       return imgRes.data;
//     },
//     [t]
//   );

//   const tabs = useMemo(
//     () => [
//       {
//         id: "firstOutputHT",
//         labelKey: "scc.tabs.firstOutputHT",
//         icon: <FileText size={16} />,
//         formType: "HT",
//         data: htFormData,
//         setter: setHtFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "firstOutputFU",
//         labelKey: "scc.tabs.firstOutputFU",
//         icon: <FileText size={16} />,
//         formType: "FU",
//         data: fuFormData,
//         setter: setFuFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "dailyTesting",
//         labelKey: "scc.tabs.dailyTesting",
//         icon: <ThermometerSun size={16} />,
//         formType: "DailyTesting",
//         data: dailyTestingFormData,
//         setter: setDailyTestingFormData,
//         component: SCCDailyTesting,
//         disabled: false
//       },
//       {
//         id: "dailyHTQC",
//         labelKey: "scc.tabs.dailyHTQC",
//         icon: <CheckSquare size={16} />,
//         formType: "DailyHTQC",
//         data: dailyHTQCFormData,
//         setter: setDailyHTQCFormData,
//         component: DailyHTQC,
//         disabled: false
//       },
//       {
//         id: "dailyFUQC",
//         labelKey: "scc.tabs.dailyFUQC",
//         icon: <ShieldCheck size={16} />,
//         formType: "DailyFUQC",
//         data: dailyFUQCFormData,
//         setter: setDailyFUQCFormData,
//         component: DailyFUQC,
//         disabled: false
//       },
//       {
//         id: "htInspection",
//         labelKey: "scc.tabs.htInspection",
//         icon: <Eye size={16} />,
//         formType: "HTInspectionReport",
//         data: htInspectionReportData,
//         setter: setHtInspectionReportData,
//         component: HTInspectionReport,
//         disabled: false
//       }
//     ],
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData,
//       t
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let currentSetter,
//         endpoint,
//         successMessageKey,
//         initialStateForReset,
//         payloadToSend;
//       // Use specificPayload if provided (typically from child components like DailyHTQC/FUQC),
//       // otherwise use the form data from SCCPage's state.
//       const formDataToProcess =
//         specificPayload ||
//         (formTypeToSubmit === "HT"
//           ? htFormData
//           : formTypeToSubmit === "FU"
//           ? fuFormData
//           : formTypeToSubmit === "DailyTesting"
//           ? dailyTestingFormData
//           : formTypeToSubmit === "DailyHTQC"
//           ? dailyHTQCFormData
//           : formTypeToSubmit === "DailyFUQC"
//           ? dailyFUQCFormData
//           : formTypeToSubmit === "HTInspectionReport"
//           ? htInspectionReportData
//           : {});

//       if (formTypeToSubmit === "HT") {
//         currentSetter = setHtFormData;
//         endpoint = "/api/scc/ht-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "FU") {
//         currentSetter = setFuFormData;
//         endpoint = "/api/scc/fu-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "DailyTesting") {
//         currentSetter = setDailyTestingFormData;
//         endpoint = "/api/scc/daily-testing";
//         successMessageKey = "sccdaily.reportSavedSuccess";
//         initialStateForReset = initialSharedStateDailyTesting;
//       } else if (formTypeToSubmit === "DailyHTQC") {
//         currentSetter = setDailyHTQCFormData;
//         endpoint = "/api/scc/daily-htfu-test";
//         successMessageKey = "sccDailyHTQC.reportSavedSuccess";
//         initialStateForReset = initialDailyHTQCState;
//       } else if (formTypeToSubmit === "DailyFUQC") {
//         currentSetter = setDailyFUQCFormData;
//         endpoint = "/api/scc/daily-fuqc-test";
//         successMessageKey = "sccDailyFUQC.reportSavedSuccess";
//         initialStateForReset = initialDailyFUQCState;
//       } else if (formTypeToSubmit === "HTInspectionReport") {
//         currentSetter = setHtInspectionReportData;
//         endpoint = "/api/scc/ht-inspection-report";
//         successMessageKey = "sccHTInspection.reportSavedSuccess";
//         initialStateForReset = initialHTInspectionReportState;
//       } else {
//         console.error("Unknown form type:", formTypeToSubmit);
//         Swal.fire(t("scc.error"), "Unknown form type.", "error");
//         return;
//       }

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return;
//       }

//       // Basic Validation (using formDataToProcess)
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasicMachine"),
//             "warning"
//           );
//           return;
//         }
//       } else if (formTypeToSubmit === "HTInspectionReport") {
//         if (
//           !formDataToProcess ||
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.batchNo ||
//           formDataToProcess.totalPcs === null ||
//           formDataToProcess.totalPcs <= 0
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccHTInspection.validation.fillBasicPayload"),
//             "warning"
//           );
//           return;
//         }
//       } else if (formTypeToSubmit === "DailyTesting") {
//         if (
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.machineNo
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasicMachine"),
//             "warning"
//           );
//           return;
//         }
//       } else if (
//         formTypeToSubmit === "DailyHTQC" ||
//         formTypeToSubmit === "DailyFUQC"
//       ) {
//         if (
//           !formDataToProcess ||
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.currentInspection
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               formTypeToSubmit === "DailyHTQC"
//                 ? "sccDailyHTQC.validation.fillBasicPayload"
//                 : "sccDailyFUQC.validation.fillBasicPayload"
//             ),
//             "warning"
//           );
//           return;
//         }
//       }

//       let formIsValid = true;
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !formDataToProcess.standardSpecification ||
//           formDataToProcess.standardSpecification.length < 2
//         ) {
//           formIsValid = false;
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validation.specsRequired"),
//             "warning"
//           );
//         }
//         if (
//           formIsValid &&
//           !formDataToProcess.referenceSampleImageUrl &&
//           !formDataToProcess.referenceSampleImageFile
//         ) {
//           formIsValid = false;
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validation.refImageRequired"),
//             "warning"
//           );
//         }
//       }
//       if (!formIsValid) return;

//       setIsSubmitting(true);
//       try {
//         let finalImageUrls = {};
//         let imageTypeIdentifier = "";
//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           if (formDataToProcess.referenceSampleImageFile) {
//             imageTypeIdentifier = `referenceSample-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.referenceSampleImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.referenceSampleImage = imgData.filePath;
//           } else {
//             finalImageUrls.referenceSampleImage =
//               formDataToProcess.referenceSampleImageUrl;
//           }
//           if (formDataToProcess.afterWashImageFile) {
//             imageTypeIdentifier = `afterWash-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.afterWashImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.afterWashImage = imgData.filePath;
//           } else {
//             finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
//           }
//         } else if (formTypeToSubmit === "DailyTesting") {
//           if (formDataToProcess.afterWashImageFile) {
//             imageTypeIdentifier = `afterWashDaily-${formDataToProcess.machineNo}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.afterWashImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.afterWashImage = imgData.filePath;
//           } else {
//             finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
//           }
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           if (formDataToProcess.defectImageFile) {
//             imageTypeIdentifier = `htDefect-${formDataToProcess.machineNo}-${formDataToProcess.moNo}-${formDataToProcess.color}-${formDataToProcess.batchNo}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.defectImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.defectImageUrl = imgData.filePath;
//           } else {
//             finalImageUrls.defectImageUrl = formDataToProcess.defectImageUrl;
//           }
//         }

//         if (
//           formTypeToSubmit === "DailyHTQC" ||
//           formTypeToSubmit === "DailyFUQC"
//         ) {
//           payloadToSend = { ...formDataToProcess };
//           if (
//             formTypeToSubmit === "DailyHTQC" &&
//             (payloadToSend.stretchTestResult === "Pass" ||
//               payloadToSend.stretchTestResult === "Pending")
//           ) {
//             payloadToSend.stretchTestRejectReasons = [];
//           }
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           payloadToSend = {
//             ...formDataToProcess,
//             defectImageUrl: finalImageUrls.defectImageUrl,
//             defectImageFile: undefined,
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A"
//           };
//         } else {
//           const now = new Date();
//           const inspectionTime = `${String(now.getHours()).padStart(
//             2,
//             "0"
//           )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//             now.getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             _id: formDataToProcess._id || undefined,
//             inspectionDate: formDataToProcess.inspectionDate,
//             machineNo: formDataToProcess.machineNo,
//             moNo: formDataToProcess.moNo,
//             buyer: formDataToProcess.buyer,
//             buyerStyle: formDataToProcess.buyerStyle,
//             color: formDataToProcess.color,
//             remarks: formDataToProcess.remarks?.trim() || "NA",
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A",
//             inspectionTime: inspectionTime
//           };
//           if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             payloadToSend.referenceSampleImage =
//               finalImageUrls.referenceSampleImage;
//             payloadToSend.afterWashImage = finalImageUrls.afterWashImage;
//             payloadToSend.standardSpecification =
//               formDataToProcess.standardSpecification.map((spec) => ({
//                 type: spec.type,
//                 method: spec.method,
//                 timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                 tempC: spec.tempC ? Number(spec.tempC) : null,
//                 tempOffsetMinus:
//                   (parseFloat(spec.tempOffset) || 0) !== 0
//                     ? -Math.abs(parseFloat(spec.tempOffset))
//                     : 0,
//                 tempOffsetPlus:
//                   (parseFloat(spec.tempOffset) || 0) !== 0
//                     ? Math.abs(parseFloat(spec.tempOffset))
//                     : 0,
//                 pressure: spec.pressure ? Number(spec.pressure) : null,
//                 status: spec.status,
//                 remarks: spec.remarks?.trim() || "NA"
//               }));
//           } else if (formTypeToSubmit === "DailyTesting") {
//             payloadToSend.standardSpecifications = {
//               tempC: formDataToProcess.standardSpecifications.tempC
//                 ? Number(formDataToProcess.standardSpecifications.tempC)
//                 : null,
//               timeSec: formDataToProcess.standardSpecifications.timeSec
//                 ? Number(formDataToProcess.standardSpecifications.timeSec)
//                 : null,
//               pressure: formDataToProcess.standardSpecifications.pressure
//                 ? Number(formDataToProcess.standardSpecifications.pressure)
//                 : null
//             };
//             payloadToSend.numberOfRejections =
//               formDataToProcess.numberOfRejections || 0;
//             payloadToSend.parameterAdjustmentRecords = (
//               formDataToProcess.parameterAdjustmentRecords || []
//             ).map((rec) => ({
//               rejectionNo: rec.rejectionNo,
//               adjustedTempC:
//                 rec.adjustedTempC !== null && rec.adjustedTempC !== ""
//                   ? Number(rec.adjustedTempC)
//                   : null,
//               adjustedTimeSec:
//                 rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
//                   ? Number(rec.adjustedTimeSec)
//                   : null,
//               adjustedPressure:
//                 rec.adjustedPressure !== null && rec.adjustedPressure !== ""
//                   ? Number(rec.adjustedPressure)
//                   : null
//             }));
//             payloadToSend.finalResult =
//               formDataToProcess.finalResult || "Pending";
//             payloadToSend.afterWashImage = finalImageUrls.afterWashImage;
//           }
//         }

//         const response = await axios.post(
//           `${API_BASE_URL}${endpoint}`,
//           payloadToSend
//         );
//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );
//         const updatedRecord = response.data.data;

//         // State Update Logic
//         if (
//           formTypeToSubmit === "DailyHTQC" ||
//           formTypeToSubmit === "DailyFUQC" ||
//           formTypeToSubmit === "HTInspectionReport"
//         ) {
//           // For these forms, the child component handles its internal state.
//           // We update the parent's copy of the data with the response from the server,
//           // which includes the complete, updated record.
//           currentSetter((prevData) => ({
//             ...initialStateForReset, // Start with a clean slate for non-persistent fields
//             ...updatedRecord, // Overlay with all fields from the updated record
//             inspectionDate: new Date(updatedRecord.inspectionDate), // Ensure date is a Date object
//             // Ensure specific fields that child might not explicitly send back are preserved or reset
//             ...(formTypeToSubmit === "DailyFUQC" && {
//               temp_offset:
//                 updatedRecord.temp_offset !== undefined
//                   ? updatedRecord.temp_offset
//                   : DEFAULT_TEMP_OFFSET
//             }),
//             ...(formTypeToSubmit === "DailyHTQC" && {
//               stretchTestRejectReasons:
//                 updatedRecord.stretchTestRejectReasons || []
//             })
//           }));
//         } else {
//           // For HT, FU, DailyTesting
//           let stateUpdate = {
//             ...initialStateForReset,
//             _id: updatedRecord._id,
//             machineNo: updatedRecord.machineNo,
//             moNo: updatedRecord.moNo,
//             color: updatedRecord.color,
//             buyer: formDataToProcess.buyer,
//             buyerStyle: formDataToProcess.buyerStyle,
//             inspectionDate: new Date(updatedRecord.inspectionDate),
//             remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks
//           };
//           if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             stateUpdate.standardSpecification =
//               updatedRecord.standardSpecification.map((spec) => ({
//                 ...spec,
//                 tempOffset:
//                   spec.tempOffsetPlus !== 0
//                     ? String(spec.tempOffsetPlus)
//                     : spec.tempOffsetMinus !== 0
//                     ? String(spec.tempOffsetMinus)
//                     : "0",
//                 remarks: spec.remarks === "NA" ? "" : spec.remarks,
//                 pressure: spec.pressure !== null ? String(spec.pressure) : ""
//               }));
//             stateUpdate.referenceSampleImageUrl =
//               updatedRecord.referenceSampleImage;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           } else if (formTypeToSubmit === "DailyTesting") {
//             stateUpdate.standardSpecifications = {
//               ...updatedRecord.standardSpecifications,
//               pressure:
//                 updatedRecord.standardSpecifications.pressure !== null
//                   ? String(updatedRecord.standardSpecifications.pressure)
//                   : ""
//             };
//             stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
//             stateUpdate.parameterAdjustmentRecords = (
//               updatedRecord.parameterAdjustmentRecords || []
//             ).map((rec) => ({
//               ...rec,
//               adjustedTempC:
//                 rec.adjustedTempC !== null ? String(rec.adjustedTempC) : "",
//               adjustedTimeSec:
//                 rec.adjustedTimeSec !== null ? String(rec.adjustedTimeSec) : "",
//               adjustedPressure:
//                 rec.adjustedPressure !== null
//                   ? String(rec.adjustedPressure)
//                   : ""
//             }));
//             stateUpdate.finalResult = updatedRecord.finalResult;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           }
//           currentSetter(stateUpdate);
//         }
//       } catch (error) {
//         console.error(
//           t("scc.errorSubmittingLog"),
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting");
//         Swal.fire(t("scc.error"), errorMessage, "error");
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [
//       user,
//       t,
//       uploadSccImage,
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData,
//       setHtFormData,
//       setFuFormData,
//       setDailyTestingFormData,
//       setDailyHTQCFormData,
//       setDailyFUQCFormData,
//       setHtInspectionReportData
//     ]
//   );

//   if (authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.loadingUser", "Loading user data...")}
//       </div>
//     );
//   }
//   if (!user && !authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.noUserFound", "User not found. Please log in.")}
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
//       <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>
//         <div className="flex flex-wrap justify-center border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none ${
//                 activeTab === tab.id
//                   ? "border-b-2 border-indigo-500 text-indigo-600"
//                   : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {tab.icon}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-3 sm:p-4 md:p-5 lg:p-6">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType}
//                 key={`${activeTab}-${activeTabData.formType}`}
//                 formData={activeTabData.data}
//                 onFormDataChange={activeTabData.setter}
//                 onFormSubmit={handleFormSubmit}
//                 isSubmitting={isSubmitting}
//               />
//             )}
//           {activeTabData && activeTabData.disabled && (
//             <div className="text-center py-10 text-gray-500">
//               <Settings2 size={48} className="mx-auto mb-4 text-gray-400" />
//               <p className="text-xl">{t(activeTabData.labelKey)}</p>
//               <p>
//                 {t(
//                   "scc.tabUnderConstruction",
//                   "This section is under construction."
//                 )}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SCCPage;

// SCCPage.jsx
// import axios from "axios";
// import {
//   CheckSquare,
//   Eye,
//   FileText,
//   Settings2,
//   ShieldCheck,
//   ThermometerSun
// } from "lucide-react";
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC";
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const DEFAULT_TEMP_OFFSET_FUQC = 5;

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [
//     {
//       type: "first",
//       method: "",
//       timeSec: "",
//       tempC: "",
//       tempOffset: "5",
//       pressure: "",
//       status: "Pass",
//       remarks: ""
//     }
//   ],
//   showSecondHeatSpec: false,
//   referenceSampleImageFile: null,
//   referenceSampleImageUrl: null,
//   afterWashImageFile: null,
//   afterWashImageUrl: null,
//   remarks: ""
// };

// const initialSharedStateDailyTesting = {
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   machineNo: "",
//   standardSpecifications: { tempC: null, timeSec: null, pressure: null },
//   numberOfRejections: 0,
//   parameterAdjustmentRecords: [],
//   finalResult: "Pending",
//   remarks: "",
//   afterWashImageFile: null,
//   afterWashImageUrl: null
// };

// const initialDailyHTQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null,
//   baseReqTime: null,
//   baseReqPressure: null,
//   inspections: [],
//   stretchTestResult: "Pending",
//   stretchTestRejectReasons: [],
//   washingTestResult: "Pending",
//   isStretchWashingTestDone: false
// };

// const initialDailyFUQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null,
//   temp_offset: DEFAULT_TEMP_OFFSET_FUQC,
//   inspections: [],
//   remarks: ""
// };

// const initialHTInspectionReportState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   batchNo: "",
//   totalBundle: null,
//   totalPcs: null,
//   defects: [],
//   remarks: "",
//   defectImageFile: null,
//   defectImageUrl: null
// };

// const SCCPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("firstOutputHT");

//   const [htFormData, setHtFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [fuFormData, setFuFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [dailyTestingFormData, setDailyTestingFormData] = useState({
//     ...initialSharedStateDailyTesting
//   });
//   const [dailyHTQCFormData, setDailyHTQCFormData] = useState({
//     ...initialDailyHTQCState
//   });
//   const [dailyFUQCFormData, setDailyFUQCFormData] = useState({
//     ...initialDailyFUQCState
//   });
//   const [htInspectionReportData, setHtInspectionReportData] = useState({
//     ...initialHTInspectionReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
//       if (currentDataForImage.machineNo) {
//         imageFormData.append("machineNo", currentDataForImage.machineNo);
//       }
//       imageFormData.append(
//         "color",
//         currentDataForImage.color || "UNKNOWN_COLOR"
//       );
//       imageFormData.append("imageType", imageTypeIdentifierForUpload);
//       imageFormData.append(
//         "inspectionDate",
//         currentDataForImage.inspectionDate instanceof Date
//           ? currentDataForImage.inspectionDate.toISOString().split("T")[0]
//           : String(
//               currentDataForImage.inspectionDate ||
//                 new Date().toISOString().split("T")[0]
//             ).split("T")[0]
//       );
//       if (
//         imageTypeIdentifierForUpload.startsWith("htDefect-") &&
//         currentDataForImage.batchNo
//       ) {
//         imageFormData.append("batchNo", currentDataForImage.batchNo);
//       }
//       const imgRes = await axios.post(
//         `${API_BASE_URL}/api/scc/upload-image`,
//         imageFormData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );
//       if (!imgRes.data.success) {
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifierForUpload} image.`
//           )
//         );
//       }
//       return imgRes.data;
//     },
//     [t]
//   );

//   const tabs = useMemo(
//     () => [
//       {
//         id: "firstOutputHT",
//         labelKey: "scc.tabs.firstOutputHT",
//         icon: <FileText size={16} />,
//         formType: "HT",
//         data: htFormData,
//         setter: setHtFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "firstOutputFU",
//         labelKey: "scc.tabs.firstOutputFU",
//         icon: <FileText size={16} />,
//         formType: "FU",
//         data: fuFormData,
//         setter: setFuFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "dailyTesting",
//         labelKey: "scc.tabs.dailyTesting",
//         icon: <ThermometerSun size={16} />,
//         formType: "DailyTesting",
//         data: dailyTestingFormData,
//         setter: setDailyTestingFormData,
//         component: SCCDailyTesting,
//         disabled: false
//       },
//       {
//         id: "dailyHTQC",
//         labelKey: "scc.tabs.dailyHTQC",
//         icon: <CheckSquare size={16} />,
//         formType: "DailyHTQC",
//         data: dailyHTQCFormData,
//         setter: setDailyHTQCFormData,
//         component: DailyHTQC,
//         disabled: false
//       },
//       {
//         id: "dailyFUQC",
//         labelKey: "scc.tabs.dailyFUQC",
//         icon: <ShieldCheck size={16} />,
//         formType: "DailyFUQC",
//         data: dailyFUQCFormData,
//         setter: setDailyFUQCFormData,
//         component: DailyFUQC,
//         disabled: false
//       },
//       {
//         id: "htInspection",
//         labelKey: "scc.tabs.htInspection",
//         icon: <Eye size={16} />,
//         formType: "HTInspectionReport",
//         data: htInspectionReportData,
//         setter: setHtInspectionReportData,
//         component: HTInspectionReport,
//         disabled: false
//       }
//     ],
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData,
//       t
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let currentSetter,
//         endpoint,
//         successMessageKey,
//         initialStateForReset,
//         payloadToSend;

//       const formDataToProcess =
//         specificPayload ||
//         (formTypeToSubmit === "HT"
//           ? htFormData
//           : formTypeToSubmit === "FU"
//           ? fuFormData
//           : formTypeToSubmit === "DailyTesting"
//           ? dailyTestingFormData
//           : formTypeToSubmit === "DailyHTQC"
//           ? dailyHTQCFormData
//           : formTypeToSubmit === "DailyFUQC"
//           ? dailyFUQCFormData
//           : formTypeToSubmit === "HTInspectionReport"
//           ? htInspectionReportData
//           : {});

//       // Define initialStateForReset for each form type, preserving the inspectionDate from formDataToProcess
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         currentSetter =
//           formTypeToSubmit === "HT" ? setHtFormData : setFuFormData;
//         endpoint =
//           formTypeToSubmit === "HT"
//             ? "/api/scc/ht-first-output"
//             : "/api/scc/fu-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = {
//           ...initialSharedStateFirstOutput,
//           inspectionDate: formDataToProcess.inspectionDate
//         };
//       } else if (formTypeToSubmit === "DailyTesting") {
//         currentSetter = setDailyTestingFormData;
//         endpoint = "/api/scc/daily-testing";
//         successMessageKey = "sccdaily.reportSavedSuccess";
//         initialStateForReset = {
//           ...initialSharedStateDailyTesting,
//           inspectionDate: formDataToProcess.inspectionDate
//         };
//       } else if (formTypeToSubmit === "DailyHTQC") {
//         currentSetter = setDailyHTQCFormData;
//         endpoint = "/api/scc/daily-htfu-test";
//         successMessageKey = "sccDailyHTQC.reportSavedSuccess";
//         initialStateForReset = {
//           ...initialDailyHTQCState,
//           inspectionDate: formDataToProcess.inspectionDate
//         };
//       } else if (formTypeToSubmit === "DailyFUQC") {
//         currentSetter = setDailyFUQCFormData;
//         endpoint = "/api/scc/daily-fuqc-test";
//         successMessageKey = "sccDailyFUQC.reportSavedSuccess";
//         initialStateForReset = {
//           ...initialDailyFUQCState,
//           inspectionDate: formDataToProcess.inspectionDate
//         };
//       } else if (formTypeToSubmit === "HTInspectionReport") {
//         currentSetter = setHtInspectionReportData;
//         endpoint = "/api/scc/ht-inspection-report";
//         successMessageKey = "sccHTInspection.reportSavedSuccess";
//         initialStateForReset = {
//           ...initialHTInspectionReportState,
//           inspectionDate: formDataToProcess.inspectionDate
//         };
//       } else {
//         console.error("Unknown form type:", formTypeToSubmit);
//         Swal.fire(t("scc.error"), "Unknown form type.", "error");
//         return;
//       }

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return;
//       }

//       // Basic Validation (using formDataToProcess)
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasicMachine"),
//             "warning"
//           );
//           return;
//         }
//       } else if (formTypeToSubmit === "HTInspectionReport") {
//         if (
//           !formDataToProcess ||
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.batchNo ||
//           formDataToProcess.totalPcs === null ||
//           formDataToProcess.totalPcs <= 0
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccHTInspection.validation.fillBasicPayload"),
//             "warning"
//           );
//           return;
//         }
//       } else if (formTypeToSubmit === "DailyTesting") {
//         if (
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.machineNo
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasicMachine"),
//             "warning"
//           );
//           return;
//         }
//       } else if (
//         formTypeToSubmit === "DailyHTQC" ||
//         formTypeToSubmit === "DailyFUQC"
//       ) {
//         if (
//           !formDataToProcess ||
//           !formDataToProcess.inspectionDate ||
//           !formDataToProcess.machineNo ||
//           !formDataToProcess.moNo ||
//           !formDataToProcess.color ||
//           !formDataToProcess.currentInspection
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               formTypeToSubmit === "DailyHTQC"
//                 ? "sccDailyHTQC.validation.fillBasicPayload"
//                 : "sccDailyFUQC.validation.fillBasicPayload"
//             ),
//             "warning"
//           );
//           return;
//         }
//       }

//       let formIsValid = true;
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !formDataToProcess.standardSpecification ||
//           formDataToProcess.standardSpecification.length === 0
//         ) {
//           formIsValid = false;
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validation.specsRequired"),
//             "warning"
//           );
//         } else {
//           const firstSpec = formDataToProcess.standardSpecification[0];
//           if (
//             !firstSpec.timeSec ||
//             !firstSpec.tempC ||
//             !firstSpec.pressure ||
//             !firstSpec.tempOffset
//           ) {
//             formIsValid = false;
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t(
//                 "scc.validation.firstSpecFieldsRequired",
//                 "Time, Temp, Temp Offset, and Pressure are required for the first specification."
//               ),
//               "warning"
//             );
//           }
//           if (formIsValid && formDataToProcess.showSecondHeatSpec) {
//             if (formDataToProcess.standardSpecification.length < 2) {
//               formIsValid = false;
//               Swal.fire(
//                 t("scc.validationErrorTitle"),
//                 t(
//                   "scc.validation.secondSpecMissing",
//                   "2nd Heat Specification data is missing."
//                 ),
//                 "warning"
//               );
//             } else {
//               const secondSpec = formDataToProcess.standardSpecification[1];
//               if (
//                 !secondSpec.timeSec ||
//                 !secondSpec.tempC ||
//                 !secondSpec.pressure ||
//                 !secondSpec.tempOffset
//               ) {
//                 formIsValid = false;
//                 Swal.fire(
//                   t("scc.validationErrorTitle"),
//                   t(
//                     "scc.validation.secondSpecFieldsRequired",
//                     "Time, Temp, Temp Offset, and Pressure are required for the 2nd Heat Specification."
//                   ),
//                   "warning"
//                 );
//               }
//             }
//           }
//         }
//         if (
//           formIsValid &&
//           !formDataToProcess.referenceSampleImageUrl &&
//           !formDataToProcess.referenceSampleImageFile
//         ) {
//           formIsValid = false;
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validation.refImageRequired"),
//             "warning"
//           );
//         }
//       }
//       if (!formIsValid) return;

//       setIsSubmitting(true);
//       try {
//         let finalImageUrls = {};
//         let imageTypeIdentifier = "";
//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           if (formDataToProcess.referenceSampleImageFile) {
//             imageTypeIdentifier = `referenceSample-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.referenceSampleImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.referenceSampleImage = imgData.filePath;
//           } else {
//             finalImageUrls.referenceSampleImage =
//               formDataToProcess.referenceSampleImageUrl;
//           }
//           if (formDataToProcess.afterWashImageFile) {
//             imageTypeIdentifier = `afterWash-${formDataToProcess.machineNo}-${formTypeToSubmit}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.afterWashImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.afterWashImage = imgData.filePath;
//           } else {
//             finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
//           }
//         } else if (formTypeToSubmit === "DailyTesting") {
//           if (formDataToProcess.afterWashImageFile) {
//             imageTypeIdentifier = `afterWashDaily-${formDataToProcess.machineNo}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.afterWashImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.afterWashImage = imgData.filePath;
//           } else {
//             finalImageUrls.afterWashImage = formDataToProcess.afterWashImageUrl;
//           }
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           if (formDataToProcess.defectImageFile) {
//             imageTypeIdentifier = `htDefect-${formDataToProcess.machineNo}-${formDataToProcess.moNo}-${formDataToProcess.color}-${formDataToProcess.batchNo}`;
//             const imgData = await uploadSccImage(
//               formDataToProcess.defectImageFile,
//               formDataToProcess,
//               imageTypeIdentifier
//             );
//             finalImageUrls.defectImageUrl = imgData.filePath;
//           } else {
//             finalImageUrls.defectImageUrl = formDataToProcess.defectImageUrl;
//           }
//         }

//         const basePayload = {
//           _id: formDataToProcess._id || undefined,
//           inspectionDate: formDataToProcess.inspectionDate,
//           machineNo: formDataToProcess.machineNo,
//           moNo: formDataToProcess.moNo,
//           buyer: formDataToProcess.buyer,
//           buyerStyle: formDataToProcess.buyerStyle,
//           color: formDataToProcess.color,
//           remarks: formDataToProcess.remarks?.trim() || "NA",
//           emp_id: user.emp_id,
//           emp_kh_name: user.kh_name || "N/A",
//           emp_eng_name: user.eng_name || "N/A",
//           emp_dept_name: user.dept_name || "N/A",
//           emp_sect_name: user.sect_name || "N/A",
//           emp_job_title: user.job_title || "N/A",
//           inspectionTime: `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`
//         };

//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           payloadToSend = {
//             ...basePayload,
//             referenceSampleImage: finalImageUrls.referenceSampleImage,
//             afterWashImage: finalImageUrls.afterWashImage,
//             standardSpecification: formDataToProcess.standardSpecification
//               .filter((spec) => spec.timeSec || spec.tempC || spec.pressure)
//               .map((spec) => {
//                 const tempOffsetVal = parseFloat(spec.tempOffset) || 0;
//                 return {
//                   type: spec.type,
//                   method: spec.method,
//                   timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                   tempC: spec.tempC ? Number(spec.tempC) : null,
//                   tempOffsetMinus:
//                     tempOffsetVal < 0
//                       ? tempOffsetVal
//                       : tempOffsetVal !== 0
//                       ? -Math.abs(tempOffsetVal)
//                       : 0,
//                   tempOffsetPlus:
//                     tempOffsetVal > 0
//                       ? tempOffsetVal
//                       : tempOffsetVal !== 0
//                       ? Math.abs(tempOffsetVal)
//                       : 0,
//                   pressure: spec.pressure ? Number(spec.pressure) : null,
//                   status: spec.status,
//                   remarks: spec.remarks?.trim() || "NA"
//                 };
//               })
//           };
//         } else if (formTypeToSubmit === "DailyTesting") {
//           payloadToSend = {
//             ...basePayload,
//             standardSpecifications: {
//               tempC: formDataToProcess.standardSpecifications.tempC
//                 ? Number(formDataToProcess.standardSpecifications.tempC)
//                 : null,
//               timeSec: formDataToProcess.standardSpecifications.timeSec
//                 ? Number(formDataToProcess.standardSpecifications.timeSec)
//                 : null,
//               pressure: formDataToProcess.standardSpecifications.pressure
//                 ? Number(formDataToProcess.standardSpecifications.pressure)
//                 : null
//             },
//             numberOfRejections: formDataToProcess.numberOfRejections || 0,
//             parameterAdjustmentRecords: (
//               formDataToProcess.parameterAdjustmentRecords || []
//             ).map((rec) => ({
//               rejectionNo: rec.rejectionNo,
//               adjustedTempC:
//                 rec.adjustedTempC !== null && rec.adjustedTempC !== ""
//                   ? Number(rec.adjustedTempC)
//                   : null,
//               adjustedTimeSec:
//                 rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
//                   ? Number(rec.adjustedTimeSec)
//                   : null,
//               adjustedPressure:
//                 rec.adjustedPressure !== null && rec.adjustedPressure !== ""
//                   ? Number(rec.adjustedPressure)
//                   : null
//             })),
//             finalResult: formDataToProcess.finalResult || "Pending",
//             afterWashImage: finalImageUrls.afterWashImage
//           };
//         } else if (
//           formTypeToSubmit === "DailyHTQC" ||
//           formTypeToSubmit === "DailyFUQC"
//         ) {
//           payloadToSend = { ...formDataToProcess };
//           if (
//             formTypeToSubmit === "DailyHTQC" &&
//             (payloadToSend.stretchTestResult === "Pass" ||
//               payloadToSend.stretchTestResult === "Pending")
//           ) {
//             payloadToSend.stretchTestRejectReasons = [];
//           }
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           payloadToSend = {
//             ...formDataToProcess,
//             defectImageUrl: finalImageUrls.defectImageUrl,
//             defectImageFile: undefined,
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A"
//           };
//         }

//         const response = await axios.post(
//           `${API_BASE_URL}${endpoint}`,
//           payloadToSend
//         );
//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );
//         const updatedRecord = response.data.data;

//         // State Update Logic
//         if (
//           formTypeToSubmit === "HT" ||
//           formTypeToSubmit === "FU" ||
//           formTypeToSubmit === "DailyTesting"
//         ) {
//           currentSetter({
//             ...initialStateForReset
//           });
//         } else if (
//           formTypeToSubmit === "DailyHTQC" ||
//           formTypeToSubmit === "DailyFUQC" ||
//           formTypeToSubmit === "HTInspectionReport"
//         ) {
//           currentSetter((prevData) => ({
//             ...initialStateForReset,
//             ...updatedRecord,
//             inspectionDate: new Date(updatedRecord.inspectionDate),
//             ...(formTypeToSubmit === "DailyFUQC" && {
//               temp_offset:
//                 updatedRecord.temp_offset !== undefined
//                   ? updatedRecord.temp_offset
//                   : DEFAULT_TEMP_OFFSET_FUQC
//             }),
//             ...(formTypeToSubmit === "DailyHTQC" && {
//               stretchTestRejectReasons:
//                 updatedRecord.stretchTestRejectReasons || []
//             })
//           }));
//         }
//       } catch (error) {
//         console.error(
//           t("scc.errorSubmittingLog"),
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting");
//         Swal.fire(t("scc.error"), errorMessage, "error");
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [
//       user,
//       t,
//       uploadSccImage,
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData
//     ]
//   );

//   if (authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.loadingUser", "Loading user data...")}
//       </div>
//     );
//   }
//   if (!user && !authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.noUserFound", "User not found. Please log in.")}
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
//       <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>
//         <div className="flex flex-wrap justify-center border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none ${
//                 activeTab === tab.id
//                   ? "border-b-2 border-indigo-500 text-indigo-600"
//                   : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {tab.icon}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-3 sm:p-4 md:p-5 lg:p-6">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType}
//                 key={`${activeTab}-${activeTabData.formType}`}
//                 formData={activeTabData.data}
//                 onFormDataChange={activeTabData.setter}
//                 onFormSubmit={handleFormSubmit}
//                 isSubmitting={isSubmitting}
//               />
//             )}
//           {activeTabData && activeTabData.disabled && (
//             <div className="text-center py-10 text-gray-500">
//               <Settings2 size={48} className="mx-auto mb-4 text-gray-400" />
//               <p className="text-xl">{t(activeTabData.labelKey)}</p>
//               <p>
//                 {t(
//                   "scc.tabUnderConstruction",
//                   "This section is under construction."
//                 )}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SCCPage;

// SCCPage.jsx
// import axios from "axios";
// import {
//   CheckSquare,
//   Eye,
//   FileText,
//   Settings2,
//   ShieldCheck,
//   ThermometerSun
// } from "lucide-react";
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC"; // This is your NEW DailyHTQC
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const DEFAULT_TEMP_OFFSET_FUQC = 5;

// // Initial states for other forms (can remain as they are if unchanged)
// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [
//     {
//       type: "first",
//       method: "",
//       timeSec: "",
//       tempC: "",
//       tempOffset: "5",
//       pressure: "",
//       status: "Pass",
//       remarks: ""
//     }
//   ],
//   showSecondHeatSpec: false,
//   referenceSampleImageFile: null,
//   referenceSampleImageUrl: null,
//   afterWashImageFile: null,
//   afterWashImageUrl: null,
//   remarks: ""
// };

// const initialSharedStateDailyTesting = {
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   machineNo: "",
//   standardSpecifications: { tempC: null, timeSec: null, pressure: null },
//   numberOfRejections: 0,
//   parameterAdjustmentRecords: [],
//   finalResult: "Pending",
//   remarks: "",
//   afterWashImageFile: null,
//   afterWashImageUrl: null
// };

// // NEW: Simplified initial state for DailyHTQC in SCCPage, as DailyHTQC manages most of its own state.
// // This 'formData' prop for DailyHTQC will mostly be a placeholder or for very high-level shared info if any.
// // The NEW DailyHTQC component you created largely manages its own internal state.
// const initialDailyHTQCState = {
//   // This state might become vestigial or used for extremely high-level props.
//   // The new DailyHTQC is quite self-contained.
//   // We keep inspectionDate here as it's a common theme for forms.
//   inspectionDate: new Date()
// };

// const initialDailyFUQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null,
//   temp_offset: DEFAULT_TEMP_OFFSET_FUQC,
//   inspections: [],
//   remarks: ""
// };

// const initialHTInspectionReportState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   batchNo: "",
//   totalBundle: null,
//   totalPcs: null,
//   defects: [],
//   remarks: "",
//   defectImageFile: null,
//   defectImageUrl: null
// };

// const SCCPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("dailyHTQC"); // Default to new HTQC for testing

//   const [htFormData, setHtFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [fuFormData, setFuFormData] = useState({
//     ...initialSharedStateFirstOutput
//   });
//   const [dailyTestingFormData, setDailyTestingFormData] = useState({
//     ...initialSharedStateDailyTesting
//   });
//   // Use the new simplified initial state for dailyHTQCFormData
//   const [dailyHTQCFormData, setDailyHTQCFormData] = useState({
//     ...initialDailyHTQCState
//   });
//   const [dailyFUQCFormData, setDailyFUQCFormData] = useState({
//     ...initialDailyFUQCState
//   });
//   const [htInspectionReportData, setHtInspectionReportData] = useState({
//     ...initialHTInspectionReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // uploadSccImage can remain the same if used by other forms
//   const uploadSccImage = useCallback(
//     async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
//       if (currentDataForImage.machineNo) {
//         imageFormData.append("machineNo", currentDataForImage.machineNo);
//       }
//       imageFormData.append(
//         "color",
//         currentDataForImage.color || "UNKNOWN_COLOR"
//       );
//       imageFormData.append("imageType", imageTypeIdentifierForUpload);
//       imageFormData.append(
//         "inspectionDate",
//         currentDataForImage.inspectionDate instanceof Date
//           ? currentDataForImage.inspectionDate.toISOString().split("T")[0]
//           : String(
//               currentDataForImage.inspectionDate ||
//                 new Date().toISOString().split("T")[0]
//             ).split("T")[0]
//       );
//       if (
//         imageTypeIdentifierForUpload.startsWith("htDefect-") &&
//         currentDataForImage.batchNo
//       ) {
//         imageFormData.append("batchNo", currentDataForImage.batchNo);
//       }
//       const imgRes = await axios.post(
//         `${API_BASE_URL}/api/scc/upload-image`,
//         imageFormData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );
//       if (!imgRes.data.success) {
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifierForUpload} image.`
//           )
//         );
//       }
//       return imgRes.data;
//     },
//     [t]
//   );

//   const tabs = useMemo(
//     () => [
//       {
//         id: "firstOutputHT",
//         labelKey: "scc.tabs.firstOutputHT",
//         icon: <FileText size={16} />,
//         formType: "HT",
//         data: htFormData,
//         setter: setHtFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "firstOutputFU",
//         labelKey: "scc.tabs.firstOutputFU",
//         icon: <FileText size={16} />,
//         formType: "FU",
//         data: fuFormData,
//         setter: setFuFormData,
//         component: SCCFirstOutputForm,
//         disabled: false
//       },
//       {
//         id: "dailyTesting",
//         labelKey: "scc.tabs.dailyTesting",
//         icon: <ThermometerSun size={16} />,
//         formType: "DailyTesting",
//         data: dailyTestingFormData,
//         setter: setDailyTestingFormData,
//         component: SCCDailyTesting,
//         disabled: false
//       },
//       {
//         id: "dailyHTQC", // Your new DailyHTQC component
//         labelKey: "scc.tabs.dailyHTQC",
//         icon: <CheckSquare size={16} />,
//         formType: "DailyHTQCNew", // Use a distinct formType if needed, or handle actions within DailyHTQC itself
//         data: dailyHTQCFormData, // This formData might be minimal now
//         setter: setDailyHTQCFormData,
//         component: DailyHTQC, // Point to your NEW DailyHTQC component
//         disabled: false
//       },
//       {
//         id: "dailyFUQC",
//         labelKey: "scc.tabs.dailyFUQC",
//         icon: <ShieldCheck size={16} />,
//         formType: "DailyFUQC",
//         data: dailyFUQCFormData,
//         setter: setDailyFUQCFormData,
//         component: DailyFUQC,
//         disabled: false
//       },
//       {
//         id: "htInspection",
//         labelKey: "scc.tabs.htInspection",
//         icon: <Eye size={16} />,
//         formType: "HTInspectionReport",
//         data: htInspectionReportData,
//         setter: setHtInspectionReportData,
//         component: HTInspectionReport,
//         disabled: false
//       }
//     ],
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData, // Note: if dailyHTQCFormData is very simple, this dependency might not trigger re-renders as expected for DailyHTQC changes.
//       // The `key` prop on the component might be more effective for re-initialization if needed.
//       dailyFUQCFormData,
//       htInspectionReportData
//       // t, // t is not needed in deps array as labelKey is just a string
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let endpoint;
//       let successMessageKey;
//       let payloadToSend = specificPayload; // Default to using specificPayload if provided
//       let httpMethod = "post"; // Default to POST

//       // This flag will indicate if the child component (DailyHTQC) will handle its own refresh
//       let childHandlesRefresh = false;

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return false; // Indicate failure
//       }

//       // Determine endpoint and success message based on formTypeToSubmit
//       // The new DailyHTQC will send "registerMachine" or "submitSlotInspections" as formTypeToSubmit
//       switch (formTypeToSubmit) {
//         case "HT":
//           endpoint = "/api/scc/ht-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           // payloadToSend is constructed below for non-DailyHTQCNew forms
//           break;
//         case "FU":
//           endpoint = "/api/scc/fu-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           break;
//         case "DailyTesting":
//           endpoint = "/api/scc/daily-testing";
//           successMessageKey = "sccdaily.reportSavedSuccess";
//           break;
//         case "registerMachine": // New action from DailyHTQC
//           endpoint = "/api/scc/daily-htfu/register-machine";
//           successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           // payloadToSend is already specificPayload
//           break;
//         case "submitSlotInspections": // New action from DailyHTQC
//           endpoint = "/api/scc/daily-htfu/submit-slot-inspections";
//           successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           // payloadToSend is already specificPayload
//           break;
//         case "DailyFUQC": // Assuming DailyFUQC uses the old way for now
//           endpoint = "/api/scc/daily-fuqc-test";
//           successMessageKey = "sccDailyFUQC.reportSavedSuccess";
//           break;
//         case "HTInspectionReport":
//           endpoint = "/api/scc/ht-inspection-report";
//           successMessageKey = "sccHTInspection.reportSavedSuccess";
//           break;
//         default:
//           console.error(
//             "Unknown form type in handleFormSubmit:",
//             formTypeToSubmit
//           );
//           Swal.fire(t("scc.error"), "Unknown form type.", "error");
//           return false; // Indicate failure
//       }

//       // If not using specificPayload (i.e., for older forms), construct formDataToProcess
//       const formDataToProcess = specificPayload
//         ? null
//         : formTypeToSubmit === "HT"
//         ? htFormData
//         : formTypeToSubmit === "FU"
//         ? fuFormData
//         : formTypeToSubmit === "DailyTesting"
//         ? dailyTestingFormData
//         : formTypeToSubmit === "DailyFUQC"
//         ? dailyFUQCFormData
//         : formTypeToSubmit === "HTInspectionReport"
//         ? htInspectionReportData
//         : {}; // Fallback to empty object, though specificPayload should cover new DailyHTQC

//       // Perform validations and payload construction for forms NOT handled by specificPayload directly
//       if (!childHandlesRefresh && formDataToProcess) {
//         // --- VALIDATION LOGIC (copied and adapted from your original code) ---
//         // This section handles validation and payload construction for forms other than the new DailyHTQC actions
//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           if (
//             !formDataToProcess.inspectionDate ||
//             !formDataToProcess.machineNo ||
//             !formDataToProcess.moNo ||
//             !formDataToProcess.color
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("scc.validationErrorBasicMachine"),
//               "warning"
//             );
//             return false;
//           }
//           // ... (rest of HT/FU validation and image upload logic)
//           // This part needs to be carefully managed. If image uploads are involved, this logic needs to stay.
//           // For simplicity in this example, I'm assuming image upload logic is self-contained or handled elsewhere if needed.
//         } else if (formTypeToSubmit === "DailyTesting") {
//           if (
//             !formDataToProcess.inspectionDate ||
//             !formDataToProcess.moNo ||
//             !formDataToProcess.color ||
//             !formDataToProcess.machineNo
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("scc.validationErrorBasicMachine"),
//               "warning"
//             );
//             return false;
//           }
//         } else if (formTypeToSubmit === "DailyFUQC") {
//           if (
//             !formDataToProcess ||
//             !formDataToProcess.inspectionDate ||
//             !formDataToProcess.machineNo ||
//             !formDataToProcess.moNo ||
//             !formDataToProcess.color ||
//             !formDataToProcess.currentInspection
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("sccDailyFUQC.validation.fillBasicPayload"),
//               "warning"
//             );
//             return false;
//           }
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           if (
//             !formDataToProcess ||
//             !formDataToProcess.inspectionDate ||
//             !formDataToProcess.machineNo ||
//             !formDataToProcess.moNo ||
//             !formDataToProcess.color ||
//             !formDataToProcess.batchNo ||
//             formDataToProcess.totalPcs === null ||
//             formDataToProcess.totalPcs <= 0
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("sccHTInspection.validation.fillBasicPayload"),
//               "warning"
//             );
//             return false;
//           }
//         }
//         // --- END VALIDATION LOGIC ---

//         // --- PAYLOAD CONSTRUCTION for non-childHandlesRefresh forms (copied & adapted) ---
//         // This assumes user object is available and contains necessary emp_ fields
//         const basePayloadForOldForms = {
//           _id: formDataToProcess._id || undefined,
//           inspectionDate: formDataToProcess.inspectionDate,
//           machineNo: formDataToProcess.machineNo,
//           moNo: formDataToProcess.moNo,
//           buyer: formDataToProcess.buyer,
//           buyerStyle: formDataToProcess.buyerStyle,
//           color: formDataToProcess.color,
//           remarks: formDataToProcess.remarks?.trim() || "NA",
//           emp_id: user.emp_id,
//           emp_kh_name: user.kh_name || "N/A",
//           emp_eng_name: user.eng_name || "N/A",
//           emp_dept_name: user.dept_name || "N/A",
//           emp_sect_name: user.sect_name || "N/A",
//           emp_job_title: user.job_title || "N/A",
//           inspectionTime: `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`
//         };

//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           // Handle image uploads for HT/FU if necessary (omitted for brevity, use your existing logic)
//           payloadToSend = {
//             ...basePayloadForOldForms
//             // ... (referenceSampleImage, afterWashImage, standardSpecification processing)
//             // This part needs your original image handling and spec processing logic
//           };
//         } else if (formTypeToSubmit === "DailyTesting") {
//           payloadToSend = {
//             ...basePayloadForOldForms
//             // ... (standardSpecifications, numberOfRejections, parameterAdjustmentRecords, finalResult, afterWashImage)
//           };
//         } else if (formTypeToSubmit === "DailyFUQC") {
//           payloadToSend = { ...formDataToProcess }; // DailyFUQC might send its full payload structure
//         } else if (formTypeToSubmit === "HTInspectionReport") {
//           payloadToSend = {
//             ...formDataToProcess,
//             // ... (defectImageUrl processing)
//             emp_id: user.emp_id // ensure user info
//           };
//         }
//         // --- END PAYLOAD CONSTRUCTION ---
//       }

//       if (!payloadToSend) {
//         console.error("Payload is undefined for form type:", formTypeToSubmit);
//         Swal.fire(
//           t("scc.error"),
//           "Internal error: Payload not constructed.",
//           "error"
//         );
//         return false;
//       }

//       setIsSubmitting(true);
//       try {
//         const response = await axios({
//           method: httpMethod,
//           url: `${API_BASE_URL}${endpoint}`,
//           data: payloadToSend
//         });

//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );

//         // State Update Logic
//         if (!childHandlesRefresh) {
//           const updatedRecord = response.data.data;
//           let currentSetter;
//           let initialStateForReset;

//           // Determine setter and initial state for reset for older forms
//           if (formTypeToSubmit === "HT") {
//             currentSetter = setHtFormData;
//             initialStateForReset = initialSharedStateFirstOutput;
//           } else if (formTypeToSubmit === "FU") {
//             currentSetter = setFuFormData;
//             initialStateForReset = initialSharedStateFirstOutput;
//           } else if (formTypeToSubmit === "DailyTesting") {
//             currentSetter = setDailyTestingFormData;
//             initialStateForReset = initialSharedStateDailyTesting;
//           } else if (formTypeToSubmit === "DailyFUQC") {
//             currentSetter = setDailyFUQCFormData;
//             initialStateForReset = initialDailyFUQCState;
//           } else if (formTypeToSubmit === "HTInspectionReport") {
//             currentSetter = setHtInspectionReportData;
//             initialStateForReset = initialHTInspectionReportState;
//           }

//           if (currentSetter && initialStateForReset) {
//             // Preserve inspectionDate if it's part of the initial state
//             const resetState = { ...initialStateForReset };
//             if ("inspectionDate" in formDataToProcess) {
//               resetState.inspectionDate = formDataToProcess.inspectionDate;
//             }

//             if (
//               formTypeToSubmit === "DailyFUQC" ||
//               formTypeToSubmit === "HTInspectionReport"
//             ) {
//               // These might benefit from merging updatedRecord
//               currentSetter((prev) => ({
//                 ...resetState, // Reset with preserved date
//                 ...updatedRecord,
//                 inspectionDate: new Date(updatedRecord.inspectionDate), // Ensure Date object
//                 ...(formTypeToSubmit === "DailyFUQC" && {
//                   temp_offset:
//                     updatedRecord.temp_offset !== undefined
//                       ? updatedRecord.temp_offset
//                       : DEFAULT_TEMP_OFFSET_FUQC
//                 })
//               }));
//             } else {
//               currentSetter(resetState);
//             }
//           }
//         }
//         return true; // Indicate success
//       } catch (error) {
//         console.error(
//           `${t("scc.errorSubmittingLog")} (Type: ${formTypeToSubmit})`,
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting");
//         Swal.fire(t("scc.error"), errorMessage, "error");
//         return false; // Indicate failure
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [
//       user,
//       t,
//       uploadSccImage, // Keep if other forms use it
//       // The direct formData dependencies (htFormData, etc.) are less critical here if specificPayload is used for new DailyHTQC
//       // and older forms construct their payload from their respective states.
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyFUQCFormData,
//       htInspectionReportData // Keep for older form payload construction
//     ]
//   );

//   if (authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.loadingUser", "Loading user data...")}
//       </div>
//     );
//   }
//   if (!user && !authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.noUserFound", "User not found. Please log in.")}
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
//       <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>
//         <div className="flex flex-wrap justify-center border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none ${
//                 activeTab === tab.id
//                   ? "border-b-2 border-indigo-500 text-indigo-600"
//                   : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {tab.icon}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-3 sm:p-4 md:p-5 lg:p-6">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType} // For DailyHTQC, this might be "DailyHTQCNew" or similar identifier
//                 key={`${activeTab}-${
//                   activeTabData.formType
//                 }-${activeTabData.data.inspectionDate?.toISOString()}`} // Added inspectionDate to key for potential re-mount on date change
//                 formData={activeTabData.data}
//                 onFormDataChange={activeTabData.setter}
//                 onFormSubmit={handleFormSubmit} // This now returns true/false
//                 isSubmitting={isSubmitting}
//               />
//             )}
//           {activeTabData && activeTabData.disabled && (
//             <div className="text-center py-10 text-gray-500">
//               <Settings2 size={48} className="mx-auto mb-4 text-gray-400" />
//               <p className="text-xl">{t(activeTabData.labelKey)}</p>
//               <p>
//                 {t(
//                   "scc.tabUnderConstruction",
//                   "This section is under construction."
//                 )}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SCCPage;

// SCCPage.jsx
import axios from "axios";
import {
  CheckSquare,
  Eye,
  FileText,
  Settings2,
  ShieldCheck,
  ThermometerSun
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import DailyFUQC from "../components/inspection/scc/DailyFUQC";
import DailyHTQC from "../components/inspection/scc/DailyHTQC";
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
  showSecondHeatSpec: false,
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
  inspectionDate: new Date()
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
      if (currentDataForImage.machineNo)
        imageFormData.append("machineNo", currentDataForImage.machineNo);
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
      if (!imgRes.data.success)
        throw new Error(
          t(
            "scc.errorUploadingImageGeneric",
            `Failed to upload ${imageTypeIdentifierForUpload} image.`
          )
        );
      return imgRes.data;
    },
    [t]
  );

  const tabs = useMemo(
    () =>
      [
        {
          id: "firstOutputHT",
          labelKey: "scc.tabs.firstOutputHT",
          icon: <FileText size={16} />,
          formType: "HT",
          data: htFormData,
          setter: setHtFormData,
          component: SCCFirstOutputForm
        },
        {
          id: "firstOutputFU",
          labelKey: "scc.tabs.firstOutputFU",
          icon: <FileText size={16} />,
          formType: "FU",
          data: fuFormData,
          setter: setFuFormData,
          component: SCCFirstOutputForm
        },
        {
          id: "dailyTesting",
          labelKey: "scc.tabs.dailyTesting",
          icon: <ThermometerSun size={16} />,
          formType: "DailyTesting",
          data: dailyTestingFormData,
          setter: setDailyTestingFormData,
          component: SCCDailyTesting
        },
        {
          id: "dailyHTQC",
          labelKey: "scc.tabs.dailyHTQC",
          icon: <CheckSquare size={16} />,
          formType: "DailyHTQCNew",
          data: dailyHTQCFormData,
          setter: setDailyHTQCFormData,
          component: DailyHTQC
        },
        {
          id: "dailyFUQC",
          labelKey: "scc.tabs.dailyFUQC",
          icon: <ShieldCheck size={16} />,
          formType: "DailyFUQC",
          data: dailyFUQCFormData,
          setter: setDailyFUQCFormData,
          component: DailyFUQC
        },
        {
          id: "htInspection",
          labelKey: "scc.tabs.htInspection",
          icon: <Eye size={16} />,
          formType: "HTInspectionReport",
          data: htInspectionReportData,
          setter: setHtInspectionReportData,
          component: HTInspectionReport
        }
      ].map((tab) => ({ ...tab, disabled: false })),
    [
      htFormData,
      fuFormData,
      dailyTestingFormData,
      dailyHTQCFormData,
      dailyFUQCFormData,
      htInspectionReportData
    ]
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const CurrentFormComponent = activeTabData?.component;

  const handleFormSubmit = useCallback(
    async (formTypeToSubmit, specificPayload = null) => {
      let endpoint;
      let successMessageKey;
      let payloadToSend = specificPayload;
      let httpMethod = "post";
      let childHandlesRefresh = false;
      let currentSetterForReset = null;
      let initialStateForReset = null;

      if (!user) {
        Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
        return false;
      }

      const formDataToProcess = specificPayload
        ? null
        : formTypeToSubmit === "HT"
        ? htFormData
        : formTypeToSubmit === "FU"
        ? fuFormData
        : formTypeToSubmit === "DailyTesting"
        ? dailyTestingFormData
        : formTypeToSubmit === "DailyFUQC"
        ? dailyFUQCFormData
        : formTypeToSubmit === "HTInspectionReport"
        ? htInspectionReportData
        : {};

      switch (formTypeToSubmit) {
        case "HT":
          endpoint = "/api/scc/ht-first-output";
          successMessageKey = "scc.dataSavedSuccess";
          currentSetterForReset = setHtFormData;
          initialStateForReset = initialSharedStateFirstOutput;
          break;
        case "FU":
          endpoint = "/api/scc/fu-first-output";
          successMessageKey = "scc.dataSavedSuccess";
          currentSetterForReset = setFuFormData;
          initialStateForReset = initialSharedStateFirstOutput;
          break;
        case "DailyTesting":
          endpoint = "/api/scc/daily-testing";
          successMessageKey = "sccdaily.reportSavedSuccess";
          currentSetterForReset = setDailyTestingFormData;
          initialStateForReset = initialSharedStateDailyTesting;
          break;
        case "registerMachine":
          endpoint = "/api/scc/daily-htfu/register-machine";
          successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
          childHandlesRefresh = true;
          break;
        case "submitSlotInspection":
          endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
          successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
          childHandlesRefresh = true;
          break;
        case "DailyFUQC":
          endpoint = "/api/scc/daily-fuqc-test";
          successMessageKey = "sccDailyFUQC.reportSavedSuccess";
          currentSetterForReset = setDailyFUQCFormData;
          initialStateForReset = initialDailyFUQCState;
          break;
        case "HTInspectionReport":
          endpoint = "/api/scc/ht-inspection-report";
          successMessageKey = "sccHTInspection.reportSavedSuccess";
          currentSetterForReset = setHtInspectionReportData;
          initialStateForReset = initialHTInspectionReportState;
          break;
        default:
          console.error("Unknown form type:", formTypeToSubmit);
          Swal.fire(t("scc.error"), "Unknown form type.", "error");
          return false;
      }

      if (!childHandlesRefresh && formDataToProcess) {
        // --- VALIDATION FOR OLDER FORMS ---
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
            return false;
          }
          if (
            !formDataToProcess.standardSpecification ||
            formDataToProcess.standardSpecification.length === 0 ||
            !formDataToProcess.standardSpecification[0].timeSec ||
            !formDataToProcess.standardSpecification[0].tempC ||
            !formDataToProcess.standardSpecification[0].pressure ||
            !formDataToProcess.standardSpecification[0].tempOffset
          ) {
            Swal.fire(
              t("scc.validationErrorTitle"),
              t("scc.validation.firstSpecFieldsRequired"),
              "warning"
            );
            return false;
          }
          if (
            formDataToProcess.showSecondHeatSpec &&
            (formDataToProcess.standardSpecification.length < 2 ||
              !formDataToProcess.standardSpecification[1].timeSec ||
              !formDataToProcess.standardSpecification[1].tempC ||
              !formDataToProcess.standardSpecification[1].pressure ||
              !formDataToProcess.standardSpecification[1].tempOffset)
          ) {
            Swal.fire(
              t("scc.validationErrorTitle"),
              t("scc.validation.secondSpecFieldsRequired"),
              "warning"
            );
            return false;
          }
          if (
            !formDataToProcess.referenceSampleImageUrl &&
            !formDataToProcess.referenceSampleImageFile
          ) {
            Swal.fire(
              t("scc.validationErrorTitle"),
              t("scc.validation.refImageRequired"),
              "warning"
            );
            return false;
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
            return false;
          }
        } else if (formTypeToSubmit === "DailyFUQC") {
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
              t("sccDailyFUQC.validation.fillBasicPayload"),
              "warning"
            );
            return false;
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
            return false;
          }
        }

        // --- PAYLOAD CONSTRUCTION FOR OLDER FORMS (with image handling restored) ---
        setIsSubmitting(true); // Set submitting true before async operations like image upload
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
              finalImageUrls.afterWashImage =
                formDataToProcess.afterWashImageUrl;
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
              finalImageUrls.afterWashImage =
                formDataToProcess.afterWashImageUrl;
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

          const basePayloadForOldForms = {
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
            inspectionTime: `${String(new Date().getHours()).padStart(
              2,
              "0"
            )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
              new Date().getSeconds()
            ).padStart(2, "0")}`
          };

          if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            payloadToSend = {
              ...basePayloadForOldForms,
              referenceSampleImage: finalImageUrls.referenceSampleImage,
              afterWashImage: finalImageUrls.afterWashImage,
              standardSpecification: formDataToProcess.standardSpecification
                .filter((spec) => spec.timeSec || spec.tempC || spec.pressure)
                .map((spec) => {
                  const tempOffsetVal = parseFloat(spec.tempOffset) || 0;
                  return {
                    type: spec.type,
                    method: spec.method,
                    timeSec: spec.timeSec ? Number(spec.timeSec) : null,
                    tempC: spec.tempC ? Number(spec.tempC) : null,
                    tempOffsetMinus:
                      tempOffsetVal < 0
                        ? tempOffsetVal
                        : tempOffsetVal !== 0
                        ? -Math.abs(tempOffsetVal)
                        : 0,
                    tempOffsetPlus:
                      tempOffsetVal > 0
                        ? tempOffsetVal
                        : tempOffsetVal !== 0
                        ? Math.abs(tempOffsetVal)
                        : 0,
                    pressure: spec.pressure ? Number(spec.pressure) : null,
                    status: spec.status,
                    remarks: spec.remarks?.trim() || "NA"
                  };
                })
            };
          } else if (formTypeToSubmit === "DailyTesting") {
            payloadToSend = {
              ...basePayloadForOldForms,
              standardSpecifications: {
                tempC: formDataToProcess.standardSpecifications.tempC
                  ? Number(formDataToProcess.standardSpecifications.tempC)
                  : null,
                timeSec: formDataToProcess.standardSpecifications.timeSec
                  ? Number(formDataToProcess.standardSpecifications.timeSec)
                  : null,
                pressure: formDataToProcess.standardSpecifications.pressure
                  ? Number(formDataToProcess.standardSpecifications.pressure)
                  : null
              },
              numberOfRejections: formDataToProcess.numberOfRejections || 0,
              parameterAdjustmentRecords: (
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
              })),
              finalResult: formDataToProcess.finalResult || "Pending",
              afterWashImage: finalImageUrls.afterWashImage
            };
          } else if (formTypeToSubmit === "DailyFUQC") {
            payloadToSend = { ...formDataToProcess }; // It already contains currentInspection and user info
          } else if (formTypeToSubmit === "HTInspectionReport") {
            payloadToSend = {
              ...formDataToProcess, // This now includes the basePayloadForOldForms fields
              defectImageUrl: finalImageUrls.defectImageUrl,
              defectImageFile: undefined // Don't send file object
            };
          }
        } catch (imageUploadError) {
          console.error("Error during image upload:", imageUploadError);
          Swal.fire(
            t("scc.error"),
            t("scc.errorUploadingImage", "Failed to upload image."),
            "error"
          );
          setIsSubmitting(false);
          return false;
        }
      }

      if (!payloadToSend) {
        Swal.fire(
          t("scc.error"),
          "Internal error: Payload not constructed.",
          "error"
        );
        setIsSubmitting(false); // Ensure submitting is reset if payload construction fails early
        return false;
      }

      // If already set by image upload logic, don't reset it here for older forms
      if (!isSubmitting && !childHandlesRefresh) setIsSubmitting(true);
      else if (!isSubmitting && childHandlesRefresh) setIsSubmitting(true);

      try {
        const response = await axios({
          method: httpMethod,
          url: `${API_BASE_URL}${endpoint}`,
          data: payloadToSend
        });
        Swal.fire(
          t("scc.success"),
          response.data.message || t(successMessageKey),
          "success"
        );

        if (
          !childHandlesRefresh &&
          currentSetterForReset &&
          initialStateForReset
        ) {
          const updatedRecord = response.data.data;
          let baseDate =
            formDataToProcess?.inspectionDate ||
            payloadToSend?.inspectionDate ||
            new Date();

          const resetState = {
            ...initialStateForReset,
            inspectionDate:
              baseDate instanceof Date ? baseDate : new Date(baseDate) // Ensure it's a Date object
          };

          if (updatedRecord && typeof updatedRecord === "object") {
            currentSetterForReset((prev) => ({
              ...resetState,
              ...updatedRecord,
              inspectionDate: new Date(updatedRecord.inspectionDate),
              ...(formTypeToSubmit === "DailyFUQC" && {
                temp_offset:
                  updatedRecord.temp_offset !== undefined
                    ? updatedRecord.temp_offset
                    : DEFAULT_TEMP_OFFSET_FUQC
              }),
              ...((formTypeToSubmit === "HT" || formTypeToSubmit === "FU") && {
                referenceSampleImageFile: null,
                afterWashImageFile: null,
                standardSpecification:
                  updatedRecord.standardSpecification ||
                  initialSharedStateFirstOutput.standardSpecification // Ensure specs are present
              }),
              ...(formTypeToSubmit === "HTInspectionReport" && {
                defectImageFile: null
              })
            }));
          } else {
            // If no updatedRecord, just reset
            currentSetterForReset(resetState);
          }
        }
        return true;
      } catch (error) {
        console.error(
          `${t("scc.errorSubmittingLog")} (Type: ${formTypeToSubmit})`,
          error.response?.data || error.message || error
        );
        Swal.fire(
          t("scc.error"),
          error.response?.data?.message ||
            error.message ||
            t("scc.errorSubmitting"),
          "error"
        );
        return false;
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
      dailyFUQCFormData,
      htInspectionReportData
    ]
  );

  if (authLoading)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
  if (!user && !authLoading)
    return <div className="p-6 text-center">{t("scc.noUserFound")}</div>;

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
                key={`${activeTab}-${activeTabData.formType}-${
                  activeTabData.data?.inspectionDate?.toISOString() || "no-date"
                }`}
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
              <p>{t("scc.tabUnderConstruction")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SCCPage;
