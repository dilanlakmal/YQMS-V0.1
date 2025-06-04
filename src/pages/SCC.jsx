// import axios from "axios";
// import {
//   Activity, // Icon for Elastic Report
//   CheckSquare,
//   Eye,
//   FileText,
//   Settings2,
//   ShieldCheck,
//   ThermometerSun,
//   Loader2
// } from "lucide-react";
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC";
// import ElasticReport from "../components/inspection/scc/ElasticReport";
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [],
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
//   inspectionDate: new Date()
// };

// const initialDailyFUQCState = {
//   inspectionDate: new Date()
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
//   tableNo: "",
//   actualLayers: null,
//   totalBundle: null,
//   totalPcs: null,
//   defects: [],
//   remarks: "",
//   defectImageFile: null,
//   defectImageUrl: null,
//   aqlData: {
//     sampleSizeLetterCode: "",
//     sampleSize: null,
//     acceptDefect: null,
//     rejectDefect: null
//   },
//   defectsQty: 0,
//   result: "Pending"
// };

// const initialElasticReportState = {
//   inspectionDate: new Date()
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
//   const [elasticReportData, setElasticReportData] = useState({
//     ...initialElasticReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
//       if (currentDataForImage.machineNo)
//         imageFormData.append("machineNo", currentDataForImage.machineNo);
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
//         {
//           headers: { "Content-Type": "multipart/form-data" }
//         }
//       );
//       if (!imgRes.data.success)
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifierForUpload} image.`
//           )
//         );
//       return imgRes.data;
//     },
//     [t]
//   );

//   const tabs = useMemo(
//     () =>
//       [
//         {
//           id: "firstOutputHT",
//           labelKey: "scc.tabs.firstOutputHT",
//           icon: <FileText size={16} />,
//           formType: "HT",
//           data: htFormData,
//           setter: setHtFormData,
//           component: SCCFirstOutputForm
//         },
//         {
//           id: "firstOutputFU",
//           labelKey: "scc.tabs.firstOutputFU",
//           icon: <FileText size={16} />,
//           formType: "FU",
//           data: fuFormData,
//           setter: setFuFormData,
//           component: SCCFirstOutputForm
//         },
//         {
//           id: "dailyTesting",
//           labelKey: "scc.tabs.dailyTesting",
//           icon: <ThermometerSun size={16} />,
//           formType: "DailyTesting",
//           data: dailyTestingFormData,
//           setter: setDailyTestingFormData,
//           component: SCCDailyTesting
//         },
//         {
//           id: "dailyHTQC",
//           labelKey: "scc.tabs.dailyHTQC",
//           icon: <CheckSquare size={16} />,
//           formType: "DailyHTQCContainer",
//           data: dailyHTQCFormData,
//           setter: setDailyHTQCFormData,
//           component: DailyHTQC
//         },
//         {
//           id: "dailyFUQC",
//           labelKey: "scc.tabs.dailyFUQC",
//           icon: <ShieldCheck size={16} />,
//           formType: "DailyFUQCContainer",
//           data: dailyFUQCFormData,
//           setter: setDailyFUQCFormData,
//           component: DailyFUQC
//         },
//         {
//           id: "htInspection",
//           labelKey: "scc.tabs.htInspection",
//           icon: <Eye size={16} />,
//           formType: "HTInspectionReport",
//           data: htInspectionReportData,
//           setter: setHtInspectionReportData,
//           component: HTInspectionReport
//         },
//         {
//           id: "elasticReport",
//           labelKey: "scc.tabs.elasticReport",
//           icon: <Activity size={16} />,
//           formType: "ElasticReportContainer",
//           data: elasticReportData,
//           setter: setElasticReportData,
//           component: ElasticReport
//         }
//       ].map((tab) => ({ ...tab, disabled: false })),
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData,
//       elasticReportData
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let endpoint;
//       let successMessageKey;
//       let payloadToSend = specificPayload;
//       let httpMethod = "post";
//       let childHandlesRefresh = false;
//       let currentSetterForReset = null;
//       let initialStateForReset = null;

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return false;
//       }

//       const commonUserInfo = {
//         emp_id: user.emp_id,
//         emp_kh_name: user.kh_name || "N/A",
//         emp_eng_name: user.eng_name || "N/A",
//         emp_dept_name: user.dept_name || "N/A",
//         emp_sect_name: user.sect_name || "N/A",
//         emp_job_title: user.job_title || "N/A"
//       };

//       switch (formTypeToSubmit) {
//         case "HT":
//           endpoint = "/api/scc/ht-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           currentSetterForReset = setHtFormData;
//           initialStateForReset = initialSharedStateFirstOutput;
//           break;
//         case "FU":
//           endpoint = "/api/scc/fu-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           currentSetterForReset = setFuFormData;
//           initialStateForReset = initialSharedStateFirstOutput;
//           break;
//         case "DailyTesting":
//           endpoint = "/api/scc/daily-testing";
//           successMessageKey = "sccdaily.reportSavedSuccess";
//           currentSetterForReset = setDailyTestingFormData;
//           initialStateForReset = initialSharedStateDailyTesting;
//           break;
//         case "registerMachine":
//           endpoint = "/api/scc/daily-htfu/register-machine";
//           successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitSlotInspection":
//           endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
//           successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         // ** ADDED CASE for DailyHTQC Test Results **
//         case "updateDailyHTFUTestResult":
//           endpoint = `/api/scc/daily-htfu/update-test-result/${specificPayload.dailyTestingDocId}`;
//           httpMethod = "put";
//           // Success message is handled by child or use a generic one if needed here.
//           // e.g. successMessageKey = "sccDailyHTQC.testResultUpdatedSuccess";
//           childHandlesRefresh = true; // DailyHTQC component will refresh its data
//           if (!specificPayload || !specificPayload.dailyTestingDocId) {
//             Swal.fire(
//               t("scc.error"),
//               "Test result data or Document ID is missing for Daily HT/FU Test.",
//               "error"
//             );
//             setIsSubmitting(false);
//             return false;
//           }
//           // payloadToSend is already specificPayload
//           break;
//         case "registerFUQCMachine":
//           endpoint = "/api/scc/daily-fuqc/register-machine";
//           successMessageKey = "sccDailyFUQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitFUQCSlotInspection":
//           endpoint = "/api/scc/daily-fuqc/submit-slot-inspection";
//           successMessageKey = "sccDailyFUQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "HTInspectionReport":
//           endpoint = "/api/scc/ht-inspection-report";
//           successMessageKey = "sccHTInspection.reportSavedSuccess";
//           currentSetterForReset = setHtInspectionReportData;
//           initialStateForReset = initialHTInspectionReportState;
//           break;
//         case "registerElasticMachine":
//           endpoint = "/api/scc/elastic-report/register-machine";
//           successMessageKey = "sccElasticReport.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitElasticSlotInspection":
//           endpoint = "/api/scc/elastic-report/submit-slot-inspection";
//           successMessageKey = "sccElasticReport.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         default:
//           console.error("Unknown form type in SCCPage:", formTypeToSubmit);
//           Swal.fire(t("scc.error"), "Unknown form type.", "error");
//           setIsSubmitting(false); // Ensure loader stops
//           return false;
//       }

//       setIsSubmitting(true);

//       try {
//         if (!specificPayload) {
//           // This block handles forms where SCCPage constructs the payload
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           const currentUserInfoWithTime = { ...commonUserInfo, inspectionTime };

//           if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             const formData =
//               formTypeToSubmit === "HT" ? htFormData : fuFormData;
//             if (
//               !formData.inspectionDate ||
//               !formData.machineNo ||
//               !formData.moNo ||
//               !formData.color ||
//               !formData.standardSpecification ||
//               formData.standardSpecification.length === 0 ||
//               !formData.standardSpecification[0].timeSec ||
//               !formData.standardSpecification[0].tempC ||
//               !formData.standardSpecification[0].pressure ||
//               formData.standardSpecification[0].tempOffset === undefined ||
//               (formData.showSecondHeatSpec &&
//                 (formData.standardSpecification.length < 2 ||
//                   !formData.standardSpecification[1].timeSec ||
//                   !formData.standardSpecification[1].tempC ||
//                   !formData.standardSpecification[1].pressure ||
//                   formData.standardSpecification[1].tempOffset ===
//                     undefined)) ||
//               (!formData.referenceSampleImageUrl &&
//                 !formData.referenceSampleImageFile)
//             ) {
//               Swal.fire(
//                 t("scc.validationErrorTitle"),
//                 t(
//                   formTypeToSubmit === "HT"
//                     ? "scc.validation.firstSpecFieldsRequired"
//                     : "scc.validation.secondSpecFieldsRequired"
//                 ),
//                 "warning"
//               );
//               throw new Error("Validation failed for HT/FU First Output.");
//             }
//             let finalImageUrls = {
//               referenceSampleImage: formData.referenceSampleImageUrl,
//               afterWashImage: formData.afterWashImageUrl
//             };
//             if (formData.referenceSampleImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.referenceSampleImageFile,
//                 formData,
//                 `referenceSample-${formData.machineNo}-${formTypeToSubmit}`
//               );
//               finalImageUrls.referenceSampleImage = imgData.filePath;
//             }
//             if (formData.afterWashImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.afterWashImageFile,
//                 formData,
//                 `afterWash-${formData.machineNo}-${formTypeToSubmit}`
//               );
//               finalImageUrls.afterWashImage = imgData.filePath;
//             }
//             payloadToSend = {
//               _id: formData._id || undefined,
//               inspectionDate: formData.inspectionDate,
//               machineNo: formData.machineNo,
//               moNo: formData.moNo,
//               buyer: formData.buyer,
//               buyerStyle: formData.buyerStyle,
//               color: formData.color,
//               remarks: formData.remarks?.trim() || "NA",
//               ...currentUserInfoWithTime,
//               referenceSampleImage: finalImageUrls.referenceSampleImage,
//               afterWashImage: finalImageUrls.afterWashImage,
//               standardSpecification: formData.standardSpecification
//                 .filter((spec) => spec.timeSec || spec.tempC || spec.pressure)
//                 .map((spec) => {
//                   const tempOffsetVal = parseFloat(spec.tempOffset) || 0;
//                   return {
//                     type: spec.type,
//                     method: spec.method,
//                     timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                     tempC: spec.tempC ? Number(spec.tempC) : null,
//                     tempOffsetMinus:
//                       tempOffsetVal < 0
//                         ? tempOffsetVal
//                         : tempOffsetVal !== 0
//                         ? -Math.abs(tempOffsetVal)
//                         : 0,
//                     tempOffsetPlus:
//                       tempOffsetVal > 0
//                         ? tempOffsetVal
//                         : tempOffsetVal !== 0
//                         ? Math.abs(tempOffsetVal)
//                         : 0,
//                     pressure: spec.pressure ? Number(spec.pressure) : null,
//                     status: spec.status,
//                     remarks: spec.remarks?.trim() || "NA"
//                   };
//                 })
//             };
//           } else if (formTypeToSubmit === "DailyTesting") {
//             const formData = dailyTestingFormData;
//             if (
//               !formData.inspectionDate ||
//               !formData.moNo ||
//               !formData.color ||
//               !formData.machineNo
//             ) {
//               Swal.fire(
//                 t("scc.validationErrorTitle"),
//                 t("scc.validationErrorBasicMachine"),
//                 "warning"
//               );
//               throw new Error("Validation failed for Daily Testing.");
//             }
//             let finalAfterWashImageUrl = formData.afterWashImageUrl;
//             if (formData.afterWashImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.afterWashImageFile,
//                 formData,
//                 `afterWashDaily-${formData.machineNo}`
//               );
//               finalAfterWashImageUrl = imgData.filePath;
//             }
//             payloadToSend = {
//               _id: formData._id || undefined,
//               inspectionDate: formData.inspectionDate,
//               machineNo: formData.machineNo,
//               moNo: formData.moNo,
//               buyer: formData.buyer,
//               buyerStyle: formData.buyerStyle,
//               color: formData.color,
//               remarks: formData.remarks?.trim() || "NA",
//               ...currentUserInfoWithTime,
//               standardSpecifications: {
//                 tempC: formData.standardSpecifications.tempC
//                   ? Number(formData.standardSpecifications.tempC)
//                   : null,
//                 timeSec: formData.standardSpecifications.timeSec
//                   ? Number(formData.standardSpecifications.timeSec)
//                   : null,
//                 pressure: formData.standardSpecifications.pressure
//                   ? Number(formData.standardSpecifications.pressure)
//                   : null
//               },
//               numberOfRejections: formData.numberOfRejections || 0,
//               parameterAdjustmentRecords: (
//                 formData.parameterAdjustmentRecords || []
//               ).map((rec) => ({
//                 rejectionNo: rec.rejectionNo,
//                 adjustedTempC:
//                   rec.adjustedTempC !== null && rec.adjustedTempC !== ""
//                     ? Number(rec.adjustedTempC)
//                     : null,
//                 adjustedTimeSec:
//                   rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
//                     ? Number(rec.adjustedTimeSec)
//                     : null,
//                 adjustedPressure:
//                   rec.adjustedPressure !== null && rec.adjustedPressure !== ""
//                     ? Number(rec.adjustedPressure)
//                     : null
//               })),
//               finalResult: formData.finalResult || "Pending",
//               afterWashImage: finalAfterWashImageUrl
//             };
//           }
//         }

//         if (formTypeToSubmit === "HTInspectionReport" && specificPayload) {
//           const reportDataFromChild = specificPayload;
//           if (
//             !reportDataFromChild.inspectionDate ||
//             !reportDataFromChild.machineNo ||
//             !reportDataFromChild.moNo ||
//             !reportDataFromChild.color ||
//             !reportDataFromChild.batchNo ||
//             !reportDataFromChild.tableNo ||
//             reportDataFromChild.actualLayers === undefined ||
//             reportDataFromChild.actualLayers === null ||
//             Number(reportDataFromChild.actualLayers) <= 0 ||
//             reportDataFromChild.totalBundle === undefined ||
//             reportDataFromChild.totalBundle === null ||
//             Number(reportDataFromChild.totalBundle) <= 0 ||
//             reportDataFromChild.totalPcs === undefined ||
//             reportDataFromChild.totalPcs === null ||
//             Number(reportDataFromChild.totalPcs) <= 0 ||
//             !reportDataFromChild.aqlData ||
//             reportDataFromChild.aqlData.sampleSize === null ||
//             reportDataFromChild.aqlData.sampleSize <= 0
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("sccHTInspection.validation.fillBasicPayload") + " (SCCPage)",
//               "warning"
//             );
//             throw new Error("Validation failed for HT Inspection Report.");
//           }
//           let finalDefectImageUrl = reportDataFromChild.defectImageUrl;
//           if (reportDataFromChild.defectImageFile) {
//             const imageTypeIdentifier = `htDefect-${reportDataFromChild.machineNo}-${reportDataFromChild.moNo}-${reportDataFromChild.color}-${reportDataFromChild.batchNo}`;
//             const imgData = await uploadSccImage(
//               reportDataFromChild.defectImageFile,
//               reportDataFromChild,
//               imageTypeIdentifier
//             );
//             finalDefectImageUrl = imgData.filePath;
//           }
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             ...reportDataFromChild,
//             defectImageUrl: finalDefectImageUrl,
//             ...commonUserInfo,
//             inspectionTime
//           };
//           delete payloadToSend.defectImageFile;
//         }
//       } catch (error) {
//         console.error(
//           `Error during payload preparation for ${formTypeToSubmit}:`,
//           error.message,
//           error
//         );
//         if (!Swal.isVisible()) {
//           Swal.fire(
//             t("scc.error"),
//             error.message || t("scc.errorPreparingData"),
//             "error"
//           );
//         }
//         setIsSubmitting(false);
//         return false;
//       }

//       if (!payloadToSend) {
//         console.error(
//           "SCCPage: Payload is null before API call for formType:",
//           formTypeToSubmit
//         );
//         Swal.fire(
//           t("scc.error"),
//           "Internal error: Payload was not constructed.",
//           "error"
//         );
//         setIsSubmitting(false);
//         return false;
//       }

//       try {
//         const response = await axios({
//           method: httpMethod,
//           url: `${API_BASE_URL}${endpoint}`,
//           data: payloadToSend
//         });
//         // For "updateDailyHTFUTestResult", success message is handled by child.
//         // For other types, show a generic success or the one defined by successMessageKey.
//         if (
//           formTypeToSubmit !== "updateDailyHTFUTestResult" &&
//           successMessageKey
//         ) {
//           Swal.fire(
//             t("scc.success"),
//             response.data.message || t(successMessageKey),
//             "success"
//           );
//         } else if (formTypeToSubmit !== "updateDailyHTFUTestResult") {
//           Swal.fire(
//             t("scc.success"),
//             response.data.message || "Operation successful!",
//             "success"
//           );
//         }

//         if (
//           !childHandlesRefresh &&
//           currentSetterForReset &&
//           initialStateForReset
//         ) {
//           const submittedInspectionDate = payloadToSend.inspectionDate;
//           const preservedDate =
//             submittedInspectionDate instanceof Date
//               ? submittedInspectionDate
//               : new Date(submittedInspectionDate);
//           if (formTypeToSubmit === "HTInspectionReport") {
//             currentSetterForReset({
//               ...initialHTInspectionReportState,
//               inspectionDate: preservedDate
//             });
//           } else if (formTypeToSubmit === "DailyTesting") {
//             currentSetterForReset({
//               ...initialSharedStateDailyTesting,
//               inspectionDate: preservedDate,
//               afterWashImageFile: null
//             });
//           } else if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             currentSetterForReset({
//               ...initialSharedStateFirstOutput,
//               inspectionDate: preservedDate,
//               referenceSampleImageFile: null,
//               afterWashImageFile: null
//             });
//           } else {
//             currentSetterForReset({
//               ...initialStateForReset,
//               inspectionDate: preservedDate
//             });
//           }
//         }
//         return true; // Indicate success to child component
//       } catch (error) {
//         console.error(
//           `${t("scc.errorSubmittingLog")} (Type: ${formTypeToSubmit})`,
//           error.response?.data || error.message || error
//         );
//         Swal.fire(
//           t("scc.error"),
//           error.response?.data?.message ||
//             error.message ||
//             t("scc.errorSubmitting"),
//           "error"
//         );
//         return false; // Indicate failure
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [user, t, uploadSccImage, htFormData, fuFormData, dailyTestingFormData]
//   );

//   if (authLoading)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
//   if (!user && !authLoading)
//     return <div className="p-6 text-center">{t("scc.noUserFound")}</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6">
//       <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 pt-4 md:pt-6 pb-3 md:pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>
//         <div className="flex flex-wrap justify-center border-b border-gray-200 text-xs sm:text-sm">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-2.5 sm:px-3 sm:py-3 focus:outline-none ${
//                 activeTab === tab.id
//                   ? "border-b-2 border-indigo-500 text-indigo-600"
//                   : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {React.cloneElement(tab.icon, { size: 14 })}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-2 sm:p-3 md:p-4 lg:p-5">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType}
//                 key={`${activeTab}-${activeTabData.formType}-${
//                   activeTabData.data?._id ||
//                   activeTabData.data?.inspectionDate?.toISOString() ||
//                   "no-id-date"
//                 }`}
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
//               <p>{t("scc.tabUnderConstruction")}</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SCCPage;

// import axios from "axios";
// import {
//   Activity, // Icon for Elastic Report
//   CheckSquare,
//   Eye,
//   FileText,
//   Settings2,
//   ShieldCheck,
//   ThermometerSun
// } from "lucide-react"; // Loader2 is already imported in SCCFirstOutputForm, not needed here directly unless used elsewhere
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC";
// import ElasticReport from "../components/inspection/scc/ElasticReport";
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [], // Will be populated with initialSpecState items by child
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
//   inspectionDate: new Date()
// };

// const initialDailyFUQCState = {
//   inspectionDate: new Date()
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
//   tableNo: "",
//   actualLayers: null,
//   totalBundle: null,
//   totalPcs: null,
//   defects: [],
//   remarks: "",
//   defectImageFile: null,
//   defectImageUrl: null,
//   aqlData: {
//     sampleSizeLetterCode: "",
//     sampleSize: null,
//     acceptDefect: null,
//     rejectDefect: null
//   },
//   defectsQty: 0,
//   result: "Pending"
// };

// const initialElasticReportState = {
//   inspectionDate: new Date()
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
//   const [elasticReportData, setElasticReportData] = useState({
//     ...initialElasticReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentDataForImage, imageTypeIdentifierForUpload) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentDataForImage.moNo || "UNKNOWN_MO");
//       if (currentDataForImage.machineNo)
//         imageFormData.append("machineNo", currentDataForImage.machineNo);
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
//         {
//           headers: { "Content-Type": "multipart/form-data" }
//         }
//       );
//       if (!imgRes.data.success)
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifierForUpload} image.`
//           )
//         );
//       return imgRes.data;
//     },
//     [t]
//   );

//   const tabs = useMemo(
//     () =>
//       [
//         {
//           id: "firstOutputHT",
//           labelKey: "scc.tabs.firstOutputHT",
//           icon: <FileText size={16} />,
//           formType: "HT",
//           data: htFormData,
//           setter: setHtFormData,
//           component: SCCFirstOutputForm
//         },
//         {
//           id: "firstOutputFU",
//           labelKey: "scc.tabs.firstOutputFU",
//           icon: <FileText size={16} />,
//           formType: "FU",
//           data: fuFormData,
//           setter: setFuFormData,
//           component: SCCFirstOutputForm
//         },
//         {
//           id: "dailyTesting",
//           labelKey: "scc.tabs.dailyTesting",
//           icon: <ThermometerSun size={16} />,
//           formType: "DailyTesting",
//           data: dailyTestingFormData,
//           setter: setDailyTestingFormData,
//           component: SCCDailyTesting
//         },
//         {
//           id: "dailyHTQC",
//           labelKey: "scc.tabs.dailyHTQC",
//           icon: <CheckSquare size={16} />,
//           formType: "DailyHTQCContainer",
//           data: dailyHTQCFormData,
//           setter: setDailyHTQCFormData,
//           component: DailyHTQC
//         },
//         {
//           id: "dailyFUQC",
//           labelKey: "scc.tabs.dailyFUQC",
//           icon: <ShieldCheck size={16} />,
//           formType: "DailyFUQCContainer",
//           data: dailyFUQCFormData,
//           setter: setDailyFUQCFormData,
//           component: DailyFUQC
//         },
//         {
//           id: "htInspection",
//           labelKey: "scc.tabs.htInspection",
//           icon: <Eye size={16} />,
//           formType: "HTInspectionReport",
//           data: htInspectionReportData,
//           setter: setHtInspectionReportData,
//           component: HTInspectionReport
//         },
//         {
//           id: "elasticReport",
//           labelKey: "scc.tabs.elasticReport",
//           icon: <Activity size={16} />,
//           formType: "ElasticReportContainer",
//           data: elasticReportData,
//           setter: setElasticReportData,
//           component: ElasticReport
//         }
//       ].map((tab) => ({ ...tab, disabled: false })),
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData,
//       elasticReportData
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let endpoint;
//       let successMessageKey;
//       let payloadToSend = specificPayload;
//       let httpMethod = "post";
//       let childHandlesRefresh = false;
//       let currentSetterForReset = null;
//       let initialStateForReset = null;

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return false;
//       }

//       const commonUserInfo = {
//         emp_id: user.emp_id,
//         emp_kh_name: user.kh_name || "N/A",
//         emp_eng_name: user.eng_name || "N/A",
//         emp_dept_name: user.dept_name || "N/A",
//         emp_sect_name: user.sect_name || "N/A",
//         emp_job_title: user.job_title || "N/A"
//       };

//       switch (formTypeToSubmit) {
//         case "HT":
//           endpoint = "/api/scc/ht-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           currentSetterForReset = setHtFormData;
//           initialStateForReset = initialSharedStateFirstOutput;
//           break;
//         case "FU":
//           endpoint = "/api/scc/fu-first-output";
//           successMessageKey = "scc.dataSavedSuccess";
//           currentSetterForReset = setFuFormData;
//           initialStateForReset = initialSharedStateFirstOutput;
//           break;
//         case "DailyTesting":
//           endpoint = "/api/scc/daily-testing";
//           successMessageKey = "sccdaily.reportSavedSuccess";
//           currentSetterForReset = setDailyTestingFormData;
//           initialStateForReset = initialSharedStateDailyTesting;
//           break;
//         case "registerMachine":
//           endpoint = "/api/scc/daily-htfu/register-machine";
//           successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitSlotInspection":
//           endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
//           successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "updateDailyHTFUTestResult":
//           endpoint = `/api/scc/daily-htfu/update-test-result/${specificPayload.dailyTestingDocId}`;
//           httpMethod = "put";
//           childHandlesRefresh = true;
//           if (!specificPayload || !specificPayload.dailyTestingDocId) {
//             Swal.fire(
//               t("scc.error"),
//               "Test result data or Document ID is missing for Daily HT/FU Test.",
//               "error"
//             );
//             setIsSubmitting(false);
//             return false;
//           }
//           break;
//         case "registerFUQCMachine":
//           endpoint = "/api/scc/daily-fuqc/register-machine";
//           successMessageKey = "sccDailyFUQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitFUQCSlotInspection":
//           endpoint = "/api/scc/daily-fuqc/submit-slot-inspection";
//           successMessageKey = "sccDailyFUQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "HTInspectionReport":
//           endpoint = "/api/scc/ht-inspection-report";
//           successMessageKey = "sccHTInspection.reportSavedSuccess";
//           currentSetterForReset = setHtInspectionReportData;
//           initialStateForReset = initialHTInspectionReportState;
//           break;
//         case "registerElasticMachine":
//           endpoint = "/api/scc/elastic-report/register-machine";
//           successMessageKey = "sccElasticReport.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitElasticSlotInspection":
//           endpoint = "/api/scc/elastic-report/submit-slot-inspection";
//           successMessageKey = "sccElasticReport.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         default:
//           console.error("Unknown form type in SCCPage:", formTypeToSubmit);
//           Swal.fire(t("scc.error"), "Unknown form type.", "error");
//           setIsSubmitting(false);
//           return false;
//       }

//       setIsSubmitting(true);

//       try {
//         if (!specificPayload) {
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           const currentUserInfoWithTime = { ...commonUserInfo, inspectionTime };

//           if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             const formData =
//               formTypeToSubmit === "HT" ? htFormData : fuFormData;
//             const firstSpec = formData.standardSpecification?.[0];
//             const secondSpec = formData.showSecondHeatSpec
//               ? formData.standardSpecification?.[1]
//               : null;

//             const isSpecValid = (spec) => {
//               if (!spec) return false;
//               const baseValid =
//                 spec.timeSec && spec.tempC && spec.tempOffset !== undefined;
//               if (formTypeToSubmit === "HT") {
//                 return baseValid && spec.pressure;
//               }
//               return baseValid; // For FU, pressure is not required in spec
//             };

//             const areAllFieldsFilled =
//               formData.inspectionDate &&
//               formData.machineNo &&
//               formData.moNo &&
//               formData.color &&
//               formData.standardSpecification?.length > 0 &&
//               isSpecValid(firstSpec) &&
//               (formData.showSecondHeatSpec ? isSpecValid(secondSpec) : true);

//             const areImagesUploaded =
//               (formData.referenceSampleImageUrl ||
//                 formData.referenceSampleImageFile) &&
//               (formData.afterWashImageUrl || formData.afterWashImageFile);

//             if (!areAllFieldsFilled || !areImagesUploaded) {
//               let message = t("scc.validation.fillAllRequiredFieldsAndImages");
//               if (!areAllFieldsFilled && areImagesUploaded) {
//                 message = t(
//                   formTypeToSubmit === "HT"
//                     ? "scc.validation.firstSpecFieldsRequiredHT"
//                     : "scc.validation.firstSpecFieldsRequiredFU"
//                 );
//               } else if (areAllFieldsFilled && !areImagesUploaded) {
//                 if (
//                   !(
//                     formData.referenceSampleImageUrl ||
//                     formData.referenceSampleImageFile
//                   )
//                 ) {
//                   message = t("scc.validation.referenceSampleRequired");
//                 } else {
//                   message = t("scc.validation.afterWashRequired");
//                 }
//               }
//               Swal.fire(t("scc.validationErrorTitle"), message, "warning");
//               throw new Error(
//                 "Validation failed for HT/FU First Output. Check required fields and images."
//               );
//             }

//             let finalImageUrls = {
//               referenceSampleImage: formData.referenceSampleImageUrl,
//               afterWashImage: formData.afterWashImageUrl
//             };
//             if (formData.referenceSampleImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.referenceSampleImageFile,
//                 formData,
//                 `referenceSample-${formData.machineNo}-${formTypeToSubmit}`
//               );
//               finalImageUrls.referenceSampleImage = imgData.filePath;
//             }
//             if (formData.afterWashImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.afterWashImageFile,
//                 formData,
//                 `afterWash-${formData.machineNo}-${formTypeToSubmit}`
//               );
//               finalImageUrls.afterWashImage = imgData.filePath;
//             }

//             payloadToSend = {
//               _id: formData._id || undefined,
//               inspectionDate: formData.inspectionDate,
//               machineNo: formData.machineNo,
//               moNo: formData.moNo,
//               buyer: formData.buyer,
//               buyerStyle: formData.buyerStyle,
//               color: formData.color,
//               remarks: formData.remarks?.trim() || "NA",
//               ...currentUserInfoWithTime,
//               referenceSampleImage: finalImageUrls.referenceSampleImage,
//               afterWashImage: finalImageUrls.afterWashImage,
//               standardSpecification: formData.standardSpecification
//                 .filter((spec) => {
//                   // Filter based on essential fields, considering formType for pressure
//                   if (formTypeToSubmit === "HT") {
//                     return spec.timeSec || spec.tempC || spec.pressure;
//                   }
//                   return spec.timeSec || spec.tempC; // For FU, pressure is not a criteria
//                 })
//                 .map((spec) => {
//                   const tempOffsetVal = parseFloat(spec.tempOffset) || 0;
//                   const mappedSpec = {
//                     type: spec.type,
//                     method: spec.method,
//                     timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                     tempC: spec.tempC ? Number(spec.tempC) : null,
//                     tempOffsetMinus:
//                       tempOffsetVal < 0
//                         ? tempOffsetVal
//                         : tempOffsetVal !== 0
//                         ? -Math.abs(tempOffsetVal)
//                         : 0,
//                     tempOffsetPlus:
//                       tempOffsetVal > 0
//                         ? tempOffsetVal
//                         : tempOffsetVal !== 0
//                         ? Math.abs(tempOffsetVal)
//                         : 0,
//                     status: spec.status,
//                     remarks: spec.remarks?.trim() || "NA"
//                   };
//                   if (formTypeToSubmit === "HT") {
//                     mappedSpec.pressure = spec.pressure
//                       ? Number(spec.pressure)
//                       : null;
//                   }
//                   // For FU, pressure field is simply not added to mappedSpec
//                   return mappedSpec;
//                 })
//             };
//           } else if (formTypeToSubmit === "DailyTesting") {
//             const formData = dailyTestingFormData;
//             if (
//               !formData.inspectionDate ||
//               !formData.moNo ||
//               !formData.color ||
//               !formData.machineNo
//             ) {
//               Swal.fire(
//                 t("scc.validationErrorTitle"),
//                 t("scc.validationErrorBasicMachine"),
//                 "warning"
//               );
//               throw new Error("Validation failed for Daily Testing.");
//             }
//             let finalAfterWashImageUrl = formData.afterWashImageUrl;
//             if (formData.afterWashImageFile) {
//               const imgData = await uploadSccImage(
//                 formData.afterWashImageFile,
//                 formData,
//                 `afterWashDaily-${formData.machineNo}`
//               );
//               finalAfterWashImageUrl = imgData.filePath;
//             }
//             payloadToSend = {
//               _id: formData._id || undefined,
//               inspectionDate: formData.inspectionDate,
//               machineNo: formData.machineNo,
//               moNo: formData.moNo,
//               buyer: formData.buyer,
//               buyerStyle: formData.buyerStyle,
//               color: formData.color,
//               remarks: formData.remarks?.trim() || "NA",
//               ...currentUserInfoWithTime,
//               standardSpecifications: {
//                 tempC: formData.standardSpecifications.tempC
//                   ? Number(formData.standardSpecifications.tempC)
//                   : null,
//                 timeSec: formData.standardSpecifications.timeSec
//                   ? Number(formData.standardSpecifications.timeSec)
//                   : null,
//                 pressure: formData.standardSpecifications.pressure
//                   ? Number(formData.standardSpecifications.pressure)
//                   : null
//               },
//               numberOfRejections: formData.numberOfRejections || 0,
//               parameterAdjustmentRecords: (
//                 formData.parameterAdjustmentRecords || []
//               ).map((rec) => ({
//                 rejectionNo: rec.rejectionNo,
//                 adjustedTempC:
//                   rec.adjustedTempC !== null && rec.adjustedTempC !== ""
//                     ? Number(rec.adjustedTempC)
//                     : null,
//                 adjustedTimeSec:
//                   rec.adjustedTimeSec !== null && rec.adjustedTimeSec !== ""
//                     ? Number(rec.adjustedTimeSec)
//                     : null,
//                 adjustedPressure:
//                   rec.adjustedPressure !== null && rec.adjustedPressure !== ""
//                     ? Number(rec.adjustedPressure)
//                     : null
//               })),
//               finalResult: formData.finalResult || "Pending",
//               afterWashImage: finalAfterWashImageUrl
//             };
//           }
//         }

//         if (formTypeToSubmit === "HTInspectionReport" && specificPayload) {
//           const reportDataFromChild = specificPayload;
//           if (
//             !reportDataFromChild.inspectionDate ||
//             !reportDataFromChild.machineNo ||
//             !reportDataFromChild.moNo ||
//             !reportDataFromChild.color ||
//             !reportDataFromChild.batchNo ||
//             !reportDataFromChild.tableNo ||
//             reportDataFromChild.actualLayers === undefined ||
//             reportDataFromChild.actualLayers === null ||
//             Number(reportDataFromChild.actualLayers) <= 0 ||
//             reportDataFromChild.totalBundle === undefined ||
//             reportDataFromChild.totalBundle === null ||
//             Number(reportDataFromChild.totalBundle) <= 0 ||
//             reportDataFromChild.totalPcs === undefined ||
//             reportDataFromChild.totalPcs === null ||
//             Number(reportDataFromChild.totalPcs) <= 0 ||
//             !reportDataFromChild.aqlData ||
//             reportDataFromChild.aqlData.sampleSize === null ||
//             reportDataFromChild.aqlData.sampleSize <= 0
//           ) {
//             Swal.fire(
//               t("scc.validationErrorTitle"),
//               t("sccHTInspection.validation.fillBasicPayload") + " (SCCPage)",
//               "warning"
//             );
//             throw new Error("Validation failed for HT Inspection Report.");
//           }
//           let finalDefectImageUrl = reportDataFromChild.defectImageUrl;
//           if (reportDataFromChild.defectImageFile) {
//             const imageTypeIdentifier = `htDefect-${reportDataFromChild.machineNo}-${reportDataFromChild.moNo}-${reportDataFromChild.color}-${reportDataFromChild.batchNo}`;
//             const imgData = await uploadSccImage(
//               reportDataFromChild.defectImageFile,
//               reportDataFromChild,
//               imageTypeIdentifier
//             );
//             finalDefectImageUrl = imgData.filePath;
//           }
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             ...reportDataFromChild,
//             defectImageUrl: finalDefectImageUrl,
//             ...commonUserInfo,
//             inspectionTime
//           };
//           delete payloadToSend.defectImageFile;
//         }
//       } catch (error) {
//         console.error(
//           `Error during payload preparation for ${formTypeToSubmit}:`,
//           error.message,
//           error
//         );
//         if (!Swal.isVisible()) {
//           Swal.fire(
//             t("scc.error"),
//             error.message || t("scc.errorPreparingData"),
//             "error"
//           );
//         }
//         setIsSubmitting(false);
//         return false;
//       }

//       if (!payloadToSend) {
//         console.error(
//           "SCCPage: Payload is null before API call for formType:",
//           formTypeToSubmit
//         );
//         Swal.fire(
//           t("scc.error"),
//           "Internal error: Payload was not constructed.",
//           "error"
//         );
//         setIsSubmitting(false);
//         return false;
//       }

//       try {
//         const response = await axios({
//           method: httpMethod,
//           url: `${API_BASE_URL}${endpoint}`,
//           data: payloadToSend
//         });

//         if (
//           formTypeToSubmit !== "updateDailyHTFUTestResult" &&
//           successMessageKey
//         ) {
//           Swal.fire(
//             t("scc.success"),
//             response.data.message || t(successMessageKey),
//             "success"
//           );
//         } else if (formTypeToSubmit !== "updateDailyHTFUTestResult") {
//           Swal.fire(
//             t("scc.success"),
//             response.data.message || "Operation successful!",
//             "success"
//           );
//         }

//         if (
//           !childHandlesRefresh &&
//           currentSetterForReset &&
//           initialStateForReset
//         ) {
//           const submittedInspectionDate = payloadToSend.inspectionDate;
//           const preservedDate =
//             submittedInspectionDate instanceof Date
//               ? submittedInspectionDate
//               : new Date(submittedInspectionDate);
//           if (formTypeToSubmit === "HTInspectionReport") {
//             currentSetterForReset({
//               ...initialHTInspectionReportState,
//               inspectionDate: preservedDate
//             });
//           } else if (formTypeToSubmit === "DailyTesting") {
//             currentSetterForReset({
//               ...initialSharedStateDailyTesting,
//               inspectionDate: preservedDate,
//               afterWashImageFile: null // Reset file
//             });
//           } else if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             currentSetterForReset({
//               ...initialSharedStateFirstOutput,
//               inspectionDate: preservedDate,
//               referenceSampleImageFile: null, // Reset files
//               afterWashImageFile: null
//             });
//           } else {
//             currentSetterForReset({
//               ...initialStateForReset,
//               inspectionDate: preservedDate
//             });
//           }
//         }
//         return true;
//       } catch (error) {
//         console.error(
//           `${t("scc.errorSubmittingLog")} (Type: ${formTypeToSubmit})`,
//           error.response?.data || error.message || error
//         );
//         Swal.fire(
//           t("scc.error"),
//           error.response?.data?.message ||
//             error.message ||
//             t("scc.errorSubmitting"),
//           "error"
//         );
//         return false;
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
//       setHtFormData, // Added setters to dependency array
//       setFuFormData,
//       setDailyTestingFormData,
//       setHtInspectionReportData
//     ]
//   );

//   if (authLoading)
//     return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
//   if (!user && !authLoading)
//     return <div className="p-6 text-center">{t("scc.noUserFound")}</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6">
//       <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 pt-4 md:pt-6 pb-3 md:pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>
//         <div className="flex flex-wrap justify-center border-b border-gray-200 text-xs sm:text-sm">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-2.5 sm:px-3 sm:py-3 focus:outline-none ${
//                 activeTab === tab.id
//                   ? "border-b-2 border-indigo-500 text-indigo-600"
//                   : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {React.cloneElement(tab.icon, { size: 14 })}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-2 sm:p-3 md:p-4 lg:p-5">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType}
//                 key={`${activeTab}-${activeTabData.formType}-${
//                   activeTabData.data?._id ||
//                   activeTabData.data?.inspectionDate?.toISOString() ||
//                   "no-id-date"
//                 }`}
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
//               <p>{t("scc.tabUnderConstruction")}</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SCCPage;

import axios from "axios";
import {
  Activity, // Icon for Elastic Report
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
import ElasticReport from "../components/inspection/scc/ElasticReport";
import HTInspectionReport from "../components/inspection/scc/HTInspectionReport";
import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

const initialSharedStateFirstOutput = {
  _id: null,
  inspectionDate: new Date(),
  machineNo: "",
  moNo: "",
  buyer: "",
  buyerStyle: "",
  color: "",
  standardSpecification: [], // Will be populated with initialSpecState items by child
  showSecondHeatSpec: false,
  referenceSampleImageFile: null,
  referenceSampleImageUrl: null,
  afterWashImageFile: null,
  afterWashImageUrl: null,
  remarks: "",
  operatorData: null // <-- ADDED THIS: To hold fetched operator details
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
  inspectionDate: new Date()
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
  tableNo: "",
  actualLayers: null,
  totalBundle: null,
  totalPcs: null,
  defects: [],
  remarks: "",
  defectImageFile: null,
  defectImageUrl: null,
  aqlData: {
    sampleSizeLetterCode: "",
    sampleSize: null,
    acceptDefect: null,
    rejectDefect: null
  },
  defectsQty: 0,
  result: "Pending"
};

const initialElasticReportState = {
  inspectionDate: new Date()
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
  const [elasticReportData, setElasticReportData] = useState({
    ...initialElasticReportState
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
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
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
          formType: "DailyHTQCContainer",
          data: dailyHTQCFormData,
          setter: setDailyHTQCFormData,
          component: DailyHTQC
        },
        {
          id: "dailyFUQC",
          labelKey: "scc.tabs.dailyFUQC",
          icon: <ShieldCheck size={16} />,
          formType: "DailyFUQCContainer",
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
        },
        {
          id: "elasticReport",
          labelKey: "scc.tabs.elasticReport",
          icon: <Activity size={16} />,
          formType: "ElasticReportContainer",
          data: elasticReportData,
          setter: setElasticReportData,
          component: ElasticReport
        }
      ].map((tab) => ({ ...tab, disabled: false })),
    [
      htFormData,
      fuFormData,
      dailyTestingFormData,
      dailyHTQCFormData,
      dailyFUQCFormData,
      htInspectionReportData,
      elasticReportData
    ]
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const CurrentFormComponent = activeTabData?.component;

  const handleFormSubmit = useCallback(
    async (formTypeToSubmit, formDataFromChild = null) => {
      let endpoint;
      let successMessageKey;
      let payloadToSend = formDataFromChild; // For HT/FU, this will be the form data. For others, it might be specific.
      let httpMethod = "post";
      let childHandlesRefresh = false;
      let currentSetterForReset = null;
      let initialStateForReset = null;

      if (!user) {
        Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
        return false;
      }

      const commonUserInfo = {
        emp_id: user.emp_id,
        emp_kh_name: user.kh_name || "N/A",
        emp_eng_name: user.eng_name || "N/A",
        emp_dept_name: user.dept_name || "N/A",
        emp_sect_name: user.sect_name || "N/A",
        emp_job_title: user.job_title || "N/A"
      };

      switch (formTypeToSubmit) {
        case "HT":
          endpoint = "/api/scc/ht-first-output";
          successMessageKey = "scc.dataSavedSuccess";
          currentSetterForReset = setHtFormData;
          initialStateForReset = initialSharedStateFirstOutput;
          // payloadToSend is already formDataFromChild which includes operatorData
          break;
        case "FU":
          endpoint = "/api/scc/fu-first-output";
          successMessageKey = "scc.dataSavedSuccess";
          currentSetterForReset = setFuFormData;
          initialStateForReset = initialSharedStateFirstOutput;
          // payloadToSend is already formDataFromChild which includes operatorData
          break;
        case "DailyTesting":
          endpoint = "/api/scc/daily-testing";
          successMessageKey = "sccdaily.reportSavedSuccess";
          currentSetterForReset = setDailyTestingFormData;
          initialStateForReset = initialSharedStateDailyTesting;
          if (!payloadToSend) payloadToSend = dailyTestingFormData; // Use state if no specific payload from child
          break;
        case "registerMachine":
          endpoint = "/api/scc/daily-htfu/register-machine";
          successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
          childHandlesRefresh = true;
          // payloadToSend for these child-specific actions IS formDataFromChild/specificPayload
          break;
        case "submitSlotInspection":
          endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
          successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
          childHandlesRefresh = true;
          break;
        case "updateDailyHTFUTestResult":
          // Ensure payloadToSend (formDataFromChild) has dailyTestingDocId
          if (!payloadToSend || !payloadToSend.dailyTestingDocId) {
            Swal.fire(
              t("scc.error"),
              "Test result data or Document ID is missing.",
              "error"
            );
            setIsSubmitting(false);
            return false;
          }
          endpoint = `/api/scc/daily-htfu/update-test-result/${payloadToSend.dailyTestingDocId}`;
          httpMethod = "put";
          childHandlesRefresh = true;
          break;
        case "registerFUQCMachine":
          endpoint = "/api/scc/daily-fuqc/register-machine";
          successMessageKey = "sccDailyFUQC.machineRegisteredSuccess";
          childHandlesRefresh = true;
          break;
        case "submitFUQCSlotInspection":
          endpoint = "/api/scc/daily-fuqc/submit-slot-inspection";
          successMessageKey = "sccDailyFUQC.slotInspectionSubmittedSuccess";
          childHandlesRefresh = true;
          break;
        case "HTInspectionReport":
          endpoint = "/api/scc/ht-inspection-report";
          successMessageKey = "sccHTInspection.reportSavedSuccess";
          currentSetterForReset = setHtInspectionReportData;
          initialStateForReset = initialHTInspectionReportState;
          // payloadToSend is formDataFromChild / specificPayload
          break;
        case "registerElasticMachine":
          endpoint = "/api/scc/elastic-report/register-machine";
          successMessageKey = "sccElasticReport.machineRegisteredSuccess";
          childHandlesRefresh = true;
          break;
        case "submitElasticSlotInspection":
          endpoint = "/api/scc/elastic-report/submit-slot-inspection";
          successMessageKey = "sccElasticReport.slotInspectionSubmittedSuccess";
          childHandlesRefresh = true;
          break;
        default:
          console.error("Unknown form type in SCCPage:", formTypeToSubmit);
          Swal.fire(t("scc.error"), "Unknown form type.", "error");
          setIsSubmitting(false);
          return false;
      }

      setIsSubmitting(true);

      try {
        // Payload Preparation for forms handled directly by SCCPage (not HT/FU anymore here for primary fields)
        const inspectionTime = `${String(new Date().getHours()).padStart(
          2,
          "0"
        )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
          new Date().getSeconds()
        ).padStart(2, "0")}`;
        const currentUserInfoWithTime = { ...commonUserInfo, inspectionTime };

        if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
          const formData = payloadToSend; // This is formDataFromChild

          // Validation Logic (ensure it's comprehensive)
          const firstSpec = formData.standardSpecification?.[0];
          const secondSpec = formData.showSecondHeatSpec
            ? formData.standardSpecification?.[1]
            : null;
          const isSpecValid = (spec) => {
            if (!spec) return false;
            const baseValid =
              spec.timeSec && spec.tempC && spec.tempOffset !== undefined;
            return formTypeToSubmit === "HT"
              ? baseValid && spec.pressure
              : baseValid;
          };
          const areAllFieldsFilled =
            formData.inspectionDate &&
            formData.machineNo &&
            formData.moNo &&
            formData.color &&
            formData.standardSpecification?.length > 0 &&
            isSpecValid(firstSpec) &&
            (formData.showSecondHeatSpec ? isSpecValid(secondSpec) : true);
          const areImagesUploaded =
            (formData.referenceSampleImageUrl ||
              formData.referenceSampleImageFile) &&
            (formData.afterWashImageUrl || formData.afterWashImageFile);

          if (!areAllFieldsFilled || !areImagesUploaded) {
            let message = t("scc.validation.fillAllRequiredFieldsAndImages");
            if (!areAllFieldsFilled && areImagesUploaded) {
              message = t(
                formTypeToSubmit === "HT"
                  ? "scc.validation.firstSpecFieldsRequiredHT"
                  : "scc.validation.firstSpecFieldsRequiredFU"
              );
            } else if (areAllFieldsFilled && !areImagesUploaded) {
              if (
                !(
                  formData.referenceSampleImageUrl ||
                  formData.referenceSampleImageFile
                )
              ) {
                message = t("scc.validation.referenceSampleRequired");
              } else {
                message = t("scc.validation.afterWashRequired");
              }
            }
            Swal.fire(t("scc.validationErrorTitle"), message, "warning");
            throw new Error("Validation failed for HT/FU First Output.");
          }

          // Image Uploads
          let finalImageUrls = {
            referenceSampleImage: formData.referenceSampleImageUrl,
            afterWashImage: formData.afterWashImageUrl
          };
          if (formData.referenceSampleImageFile) {
            const imgData = await uploadSccImage(
              formData.referenceSampleImageFile,
              formData,
              `referenceSample-${formData.machineNo}-${formTypeToSubmit}`
            );
            finalImageUrls.referenceSampleImage = imgData.filePath;
          }
          if (formData.afterWashImageFile) {
            const imgData = await uploadSccImage(
              formData.afterWashImageFile,
              formData,
              `afterWash-${formData.machineNo}-${formTypeToSubmit}`
            );
            finalImageUrls.afterWashImage = imgData.filePath;
          }

          // Final payload construction for HT/FU
          payloadToSend = {
            _id: formData._id || undefined,
            inspectionDate: formData.inspectionDate, // Already a Date object from child
            machineNo: formData.machineNo,
            moNo: formData.moNo,
            buyer: formData.buyer,
            buyerStyle: formData.buyerStyle,
            color: formData.color,
            remarks: formData.remarks?.trim() || "NA",
            ...currentUserInfoWithTime, // Inspector details
            operatorData: formData.operatorData || null, // Include operatorData
            referenceSampleImage: finalImageUrls.referenceSampleImage,
            afterWashImage: finalImageUrls.afterWashImage,
            standardSpecification: formData.standardSpecification
              .filter((spec) => {
                if (formTypeToSubmit === "HT")
                  return spec.timeSec || spec.tempC || spec.pressure;
                return spec.timeSec || spec.tempC;
              })
              .map((spec) => {
                const tempOffsetVal = parseFloat(spec.tempOffset) || 0;
                const mappedSpec = {
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
                  status: spec.status,
                  remarks: spec.remarks?.trim() || "NA"
                };
                if (formTypeToSubmit === "HT") {
                  mappedSpec.pressure = spec.pressure
                    ? Number(spec.pressure)
                    : null;
                }
                return mappedSpec;
              })
          };
        } else if (formTypeToSubmit === "DailyTesting") {
          const formData = payloadToSend; // This is dailyTestingFormData or specificPayload
          if (
            !formData.inspectionDate ||
            !formData.moNo ||
            !formData.color ||
            !formData.machineNo
          ) {
            Swal.fire(
              t("scc.validationErrorTitle"),
              t("scc.validationErrorBasicMachine"),
              "warning"
            );
            throw new Error("Validation failed for Daily Testing.");
          }
          let finalAfterWashImageUrl = formData.afterWashImageUrl;
          if (formData.afterWashImageFile) {
            const imgData = await uploadSccImage(
              formData.afterWashImageFile,
              formData,
              `afterWashDaily-${formData.machineNo}`
            );
            finalAfterWashImageUrl = imgData.filePath;
          }
          payloadToSend = {
            _id: formData._id || undefined,
            inspectionDate: formData.inspectionDate,
            machineNo: formData.machineNo,
            moNo: formData.moNo,
            buyer: formData.buyer,
            buyerStyle: formData.buyerStyle,
            color: formData.color,
            remarks: formData.remarks?.trim() || "NA",
            ...currentUserInfoWithTime,
            standardSpecifications: {
              tempC: formData.standardSpecifications.tempC
                ? Number(formData.standardSpecifications.tempC)
                : null,
              timeSec: formData.standardSpecifications.timeSec
                ? Number(formData.standardSpecifications.timeSec)
                : null,
              pressure: formData.standardSpecifications.pressure
                ? Number(formData.standardSpecifications.pressure)
                : null
            },
            numberOfRejections: formData.numberOfRejections || 0,
            parameterAdjustmentRecords: (
              formData.parameterAdjustmentRecords || []
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
            finalResult: formData.finalResult || "Pending",
            afterWashImage: finalAfterWashImageUrl
          };
        } else if (formTypeToSubmit === "HTInspectionReport" && payloadToSend) {
          const reportDataFromChild = payloadToSend;
          if (
            !reportDataFromChild.inspectionDate ||
            !reportDataFromChild.machineNo ||
            /* ... other validations */ !reportDataFromChild.aqlData?.sampleSize
          ) {
            Swal.fire(
              t("scc.validationErrorTitle"),
              t("sccHTInspection.validation.fillBasicPayload") + " (SCCPage)",
              "warning"
            );
            throw new Error("Validation failed for HT Inspection Report.");
          }
          let finalDefectImageUrl = reportDataFromChild.defectImageUrl;
          if (reportDataFromChild.defectImageFile) {
            const imageTypeIdentifier = `htDefect-${reportDataFromChild.machineNo}-${reportDataFromChild.moNo}-${reportDataFromChild.color}-${reportDataFromChild.batchNo}`;
            const imgData = await uploadSccImage(
              reportDataFromChild.defectImageFile,
              reportDataFromChild,
              imageTypeIdentifier
            );
            finalDefectImageUrl = imgData.filePath;
          }
          payloadToSend = {
            ...reportDataFromChild,
            defectImageUrl: finalDefectImageUrl,
            ...commonUserInfo, // Add inspector info
            inspectionTime: reportDataFromChild.inspectionTime || inspectionTime // Use time from child if available, else current
          };
          delete payloadToSend.defectImageFile;
        }
        // For other simple cases like registerMachine, payloadToSend is already formDataFromChild/specificPayload
        // and usually doesn't need this extensive construction. The backend expects the simple payload.
      } catch (error) {
        console.error(
          `Error during payload preparation for ${formTypeToSubmit}:`,
          error.message,
          error
        );
        if (!Swal.isVisible()) {
          Swal.fire(
            t("scc.error"),
            error.message || t("scc.errorPreparingData"),
            "error"
          );
        }
        setIsSubmitting(false);
        return false;
      }

      if (!payloadToSend) {
        console.error(
          "SCCPage: Payload is null before API call for formType:",
          formTypeToSubmit
        );
        Swal.fire(
          t("scc.error"),
          "Internal error: Payload was not constructed.",
          "error"
        );
        setIsSubmitting(false);
        return false;
      }

      try {
        const response = await axios({
          method: httpMethod,
          url: `${API_BASE_URL}${endpoint}`,
          data: payloadToSend
        });
        if (
          formTypeToSubmit !== "updateDailyHTFUTestResult" &&
          successMessageKey
        ) {
          Swal.fire(
            t("scc.success"),
            response.data.message || t(successMessageKey),
            "success"
          );
        } else if (formTypeToSubmit !== "updateDailyHTFUTestResult") {
          Swal.fire(
            t("scc.success"),
            response.data.message || "Operation successful!",
            "success"
          );
        }

        if (
          !childHandlesRefresh &&
          currentSetterForReset &&
          initialStateForReset
        ) {
          const submittedInspectionDate = payloadToSend.inspectionDate; // Use payloadToSend which has the date
          const preservedDate =
            submittedInspectionDate instanceof Date
              ? submittedInspectionDate
              : new Date(submittedInspectionDate || Date.now());

          let resetState = {
            ...initialStateForReset,
            inspectionDate: preservedDate
          };
          // Specific resets for file inputs or other fields
          if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            resetState.referenceSampleImageFile = null;
            resetState.afterWashImageFile = null;
            // operatorData is part of initialSharedStateFirstOutput, so it will be reset to null
          } else if (formTypeToSubmit === "DailyTesting") {
            resetState.afterWashImageFile = null;
          }
          // For HTInspectionReport, initialHTInspectionReportState handles reset
          currentSetterForReset(resetState);
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
      // Form data states are used if specificPayload/formDataFromChild is not provided for some types
      htFormData,
      fuFormData,
      dailyTestingFormData,
      // Setters are needed for resetting
      setHtFormData,
      setFuFormData,
      setDailyTestingFormData,
      setHtInspectionReportData
    ]
  );

  if (authLoading)
    return <div className="p-6 text-center">{t("scc.loadingUser")}</div>;
  if (!user && !authLoading)
    return <div className="p-6 text-center">{t("scc.noUserFound")}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 pt-4 md:pt-6 pb-3 md:pb-4 text-center border-b">
          {t("scc.title", "SCC Inspection (HT/FU)")}
        </h1>
        <div className="flex flex-wrap justify-center border-b border-gray-200 text-xs sm:text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-2.5 sm:px-3 sm:py-3 focus:outline-none ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {React.cloneElement(tab.icon, { size: 14 })}
              <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
            </button>
          ))}
        </div>
        <div className="p-2 sm:p-3 md:p-4 lg:p-5">
          {CurrentFormComponent &&
            activeTabData &&
            !activeTabData.disabled &&
            user && (
              <CurrentFormComponent
                formType={activeTabData.formType}
                key={`${activeTab}-${activeTabData.formType}-${
                  activeTabData.data?._id || "new"
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
