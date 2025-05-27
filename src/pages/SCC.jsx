// import axios from "axios";
// import {
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
//   inspectionDate: new Date(), // This will be overridden by the preserved date on reset
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
//   defectImageFile: null, // Will be reset to null
//   defectImageUrl: null, // Will be reset to null
//   aqlData: {
//     sampleSizeLetterCode: "",
//     sampleSize: null,
//     acceptDefect: null,
//     rejectDefect: null
//   },
//   defectsQty: 0,
//   result: "Pending"
// };

// const SCCPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("firstOutputHT"); // Or your preferred default

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
//         }
//       ].map((tab) => ({ ...tab, disabled: false })),
//     [
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       dailyFUQCFormData,
//       htInspectionReportData
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let endpoint;
//       let successMessageKey;
//       let payloadToSend = null;
//       let httpMethod = "post";
//       let childHandlesRefresh = false;
//       let currentSetterForReset = null;
//       let initialStateForReset = null;

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return false;
//       }

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
//           payloadToSend = specificPayload;
//           childHandlesRefresh = true;
//           break;
//         case "submitSlotInspection":
//           endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
//           successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
//           payloadToSend = specificPayload;
//           childHandlesRefresh = true;
//           break;
//         case "registerFUQCMachine":
//           endpoint = "/api/scc/daily-fuqc/register-machine";
//           successMessageKey = "sccDailyFUQC.machineRegisteredSuccess";
//           payloadToSend = specificPayload;
//           childHandlesRefresh = true;
//           break;
//         case "submitFUQCSlotInspection":
//           endpoint = "/api/scc/daily-fuqc/submit-slot-inspection";
//           successMessageKey = "sccDailyFUQC.slotInspectionSubmittedSuccess";
//           payloadToSend = specificPayload;
//           childHandlesRefresh = true;
//           break;
//         case "HTInspectionReport":
//           endpoint = "/api/scc/ht-inspection-report";
//           successMessageKey = "sccHTInspection.reportSavedSuccess";
//           currentSetterForReset = setHtInspectionReportData;
//           initialStateForReset = initialHTInspectionReportState;
//           if (!specificPayload) {
//             Swal.fire(
//               t("scc.error"),
//               "HTInspectionReport data is missing.",
//               "error"
//             );
//             return false;
//           }
//           break;
//         default:
//           console.error("Unknown form type in SCCPage:", formTypeToSubmit);
//           Swal.fire(t("scc.error"), "Unknown form type.", "error");
//           return false;
//       }

//       setIsSubmitting(true);

//       try {
//         if (!payloadToSend) {
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           const currentUserInfo = {
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A",
//             inspectionTime
//           };

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
//               ...currentUserInfo,
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
//               ...currentUserInfo,
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
//           } else if (formTypeToSubmit === "HTInspectionReport") {
//             const reportDataFromChild = specificPayload;
//             if (
//               !reportDataFromChild.inspectionDate ||
//               !reportDataFromChild.machineNo ||
//               !reportDataFromChild.moNo ||
//               !reportDataFromChild.color ||
//               !reportDataFromChild.batchNo ||
//               !reportDataFromChild.tableNo ||
//               reportDataFromChild.actualLayers === undefined ||
//               reportDataFromChild.actualLayers === null ||
//               Number(reportDataFromChild.actualLayers) <= 0 ||
//               reportDataFromChild.totalBundle === undefined ||
//               reportDataFromChild.totalBundle === null ||
//               Number(reportDataFromChild.totalBundle) <= 0 ||
//               reportDataFromChild.totalPcs === undefined ||
//               reportDataFromChild.totalPcs === null ||
//               Number(reportDataFromChild.totalPcs) <= 0 ||
//               !reportDataFromChild.aqlData ||
//               reportDataFromChild.aqlData.sampleSize === null ||
//               reportDataFromChild.aqlData.sampleSize <= 0
//             ) {
//               Swal.fire(
//                 t("scc.validationErrorTitle"),
//                 t("sccHTInspection.validation.fillBasicPayload") + " (SCCPage)",
//                 "warning"
//               );
//               throw new Error("Validation failed for HT Inspection Report.");
//             }
//             let finalDefectImageUrl = reportDataFromChild.defectImageUrl;
//             if (reportDataFromChild.defectImageFile) {
//               const imageTypeIdentifier = `htDefect-${reportDataFromChild.machineNo}-${reportDataFromChild.moNo}-${reportDataFromChild.color}-${reportDataFromChild.batchNo}`;
//               const imgData = await uploadSccImage(
//                 reportDataFromChild.defectImageFile,
//                 reportDataFromChild,
//                 imageTypeIdentifier
//               );
//               finalDefectImageUrl = imgData.filePath;
//             }
//             payloadToSend = {
//               ...reportDataFromChild,
//               defectImageUrl: finalDefectImageUrl,
//               ...currentUserInfo
//             };
//             delete payloadToSend.defectImageFile;
//           }
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
//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );

//         if (
//           !childHandlesRefresh &&
//           currentSetterForReset &&
//           initialStateForReset
//         ) {
//           const updatedRecord = response.data.data;
//           const submittedInspectionDate = payloadToSend.inspectionDate;
//           const preservedDate =
//             submittedInspectionDate instanceof Date
//               ? submittedInspectionDate
//               : new Date(submittedInspectionDate);

//           if (formTypeToSubmit === "HTInspectionReport") {
//             // For HT Inspection Report, reset everything to initial state except the date.
//             // _id is also reset to null, assuming each submission is a new record.
//             // If you intend to update the SAME record and just clear fields, this logic would differ.
//             // Based on "resetting after submit", implies new/clean form.
//             currentSetterForReset({
//               ...initialHTInspectionReportState, // Spread all initial values (includes null for defectImageFile & defectImageUrl)
//               inspectionDate: preservedDate // Only override the inspectionDate
//               // If the server returns an _id for the *newly created* record and you want to store it
//               // (e.g., if user might immediately want to edit *this specific newly saved* record),
//               // you could do: _id: updatedRecord?._id || null,
//               // But for a "clean slate except date" after successful save, usually _id is also cleared.
//             });
//           } else {
//             const resetStateForOtherForms = {
//               ...initialStateForReset,
//               inspectionDate: preservedDate
//             };
//             if (updatedRecord && typeof updatedRecord === "object") {
//               currentSetterForReset({
//                 ...resetStateForOtherForms,
//                 ...updatedRecord,
//                 inspectionDate: new Date(updatedRecord.inspectionDate),
//                 ...((formTypeToSubmit === "HT" ||
//                   formTypeToSubmit === "FU") && {
//                   referenceSampleImageFile: null,
//                   afterWashImageFile: null
//                 }),
//                 ...(formTypeToSubmit === "DailyTesting" && {
//                   afterWashImageFile: null
//                 })
//               });
//             } else {
//               currentSetterForReset(resetStateForOtherForms);
//             }
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
//       dailyTestingFormData /* No setters needed in deps */
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
// import ElasticReport from "../components/inspection/scc/ElasticReport"; // Import new component
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
//   inspectionDate: new Date() // Child component DailyHTQC manages its own detailed state
// };

// const initialDailyFUQCState = {
//   inspectionDate: new Date() // Child component DailyFUQC manages its own detailed state
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

// // Initial state for the new Elastic Report tab (can be minimal if child manages complex state)
// const initialElasticReportState = {
//   inspectionDate: new Date() // Child component ElasticReport manages its own detailed state
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
//   }); // New state

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
//       // Add specific identifiers for Elastic Report if needed
//       // if (imageTypeIdentifierForUpload.startsWith("elastic-")) { ... }

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
//           formType: "DailyHTQCContainer", // This indicates parent handles submit types for child
//           data: dailyHTQCFormData,
//           setter: setDailyHTQCFormData,
//           component: DailyHTQC
//         },
//         {
//           id: "dailyFUQC",
//           labelKey: "scc.tabs.dailyFUQC",
//           icon: <ShieldCheck size={16} />,
//           formType: "DailyFUQCContainer", // This indicates parent handles submit types for child
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
//         // New Elastic Report Tab
//         {
//           id: "elasticReport",
//           labelKey: "scc.tabs.elasticReport", // Add this key to your i18n files
//           icon: <Activity size={16} />, // Using Activity icon, choose another if preferred
//           formType: "ElasticReportContainer", // Parent handles submit types
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
//       elasticReportData // Add new state to dependency array
//     ]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let endpoint;
//       let successMessageKey;
//       let payloadToSend = specificPayload; // Start with specificPayload if provided
//       let httpMethod = "post";
//       let childHandlesRefresh = false; // True if child component will refresh its own data display after submit
//       let currentSetterForReset = null;
//       let initialStateForReset = null;

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return false;
//       }

//       const commonUserInfo = {
//         // Define common user info once
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
//         case "registerMachine": // For DailyHTQC
//           endpoint = "/api/scc/daily-htfu/register-machine";
//           successMessageKey = "sccDailyHTQC.machineRegisteredSuccess";
//           // payloadToSend is already specificPayload from child
//           childHandlesRefresh = true; // DailyHTQC will call fetchRegisteredMachinesForDate
//           break;
//         case "submitSlotInspection": // For DailyHTQC
//           endpoint = "/api/scc/daily-htfu/submit-slot-inspection";
//           successMessageKey = "sccDailyHTQC.slotInspectionSubmittedSuccess";
//           // payloadToSend is already specificPayload from child
//           childHandlesRefresh = true; // DailyHTQC will call fetchRegisteredMachinesForDate
//           break;
//         case "registerFUQCMachine": // For DailyFUQC
//           endpoint = "/api/scc/daily-fuqc/register-machine";
//           successMessageKey = "sccDailyFUQC.machineRegisteredSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "submitFUQCSlotInspection": // For DailyFUQC
//           endpoint = "/api/scc/daily-fuqc/submit-slot-inspection";
//           successMessageKey = "sccDailyFUQC.slotInspectionSubmittedSuccess";
//           childHandlesRefresh = true;
//           break;
//         case "HTInspectionReport":
//           endpoint = "/api/scc/ht-inspection-report";
//           successMessageKey = "sccHTInspection.reportSavedSuccess";
//           currentSetterForReset = setHtInspectionReportData;
//           initialStateForReset = initialHTInspectionReportState;
//           // specificPayload comes from HTInspectionReport component
//           break;
//         // New cases for Elastic Report
//         case "registerElasticMachine":
//           endpoint = "/api/scc/elastic-report/register-machine";
//           successMessageKey = "sccElasticReport.machineRegisteredSuccess";
//           // specificPayload from child
//           childHandlesRefresh = true; // ElasticReport will call fetchRegisteredMachinesForElasticReport
//           break;
//         case "submitElasticSlotInspection":
//           endpoint = "/api/scc/elastic-report/submit-slot-inspection";
//           successMessageKey = "sccElasticReport.slotInspectionSubmittedSuccess";
//           // specificPayload from child
//           childHandlesRefresh = true; // ElasticReport will call fetchRegisteredMachinesForElasticReport
//           break;
//         default:
//           console.error("Unknown form type in SCCPage:", formTypeToSubmit);
//           Swal.fire(t("scc.error"), "Unknown form type.", "error");
//           return false;
//       }

//       setIsSubmitting(true);

//       try {
//         // Payload construction if not already provided by child (for HT, FU, DailyTesting, HTInspectionReport)
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
//             // ... (validation for HT/FU as before)
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
//             // ... (validation for DailyTesting as before)
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
//           // For HTInspectionReport, specificPayload is expected to be populated by the child.
//           // If it's not, and this block is reached, an error will be thrown later.
//         }

//         // For HTInspectionReport, which *does* pass specificPayload but still needs image upload logic here.
//         if (formTypeToSubmit === "HTInspectionReport" && specificPayload) {
//           const reportDataFromChild = specificPayload;
//           // ... (validation for HTInspectionReport as before)
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
//           // Add user info and update image URL to the payload that came from child
//           const inspectionTime = `${String(new Date().getHours()).padStart(
//             2,
//             "0"
//           )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
//             new Date().getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             ...reportDataFromChild,
//             defectImageUrl: finalDefectImageUrl,
//             ...commonUserInfo, // Add common user info
//             inspectionTime // Add inspection time
//           };
//           delete payloadToSend.defectImageFile; // Remove file object before sending
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
//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );

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
//               // If server returns the updated record, you might want to merge it here too
//               // _id: response.data.data?._id || null,
//               afterWashImageFile: null // Reset file input
//             });
//           } else if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             currentSetterForReset({
//               ...initialSharedStateFirstOutput,
//               inspectionDate: preservedDate,
//               // _id: response.data.data?._id || null,
//               referenceSampleImageFile: null,
//               afterWashImageFile: null
//             });
//           } else {
//             // Generic reset for other forms if needed
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
//       dailyTestingFormData // Removed setters from deps as they are stable
//       // htInspectionReportData, elasticReportData are not directly used for payload creation here,
//       // their data comes via specificPayload for HTInspectionReport or is handled by child for ElasticReport.
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
//                 formType={activeTabData.formType} // This is 'ElasticReportContainer', 'DailyHTQCContainer' etc.
//                 key={`${activeTab}-${activeTabData.formType}-${
//                   activeTabData.data?._id ||
//                   activeTabData.data?.inspectionDate?.toISOString() ||
//                   "no-id-date"
//                 }`}
//                 formData={activeTabData.data} // This is initialElasticReportState, initialDailyHTQCState etc.
//                 onFormDataChange={activeTabData.setter} // Not directly used by DailyHTQC or ElasticReport if they manage internal state for forms
//                 onFormSubmit={handleFormSubmit} // Passed to child
//                 isSubmitting={isSubmitting} // Passed to child
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
  ThermometerSun,
  Loader2
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
        // ** ADDED CASE for DailyHTQC Test Results **
        case "updateDailyHTFUTestResult":
          endpoint = `/api/scc/daily-htfu/update-test-result/${specificPayload.dailyTestingDocId}`;
          httpMethod = "put";
          // Success message is handled by child or use a generic one if needed here.
          // e.g. successMessageKey = "sccDailyHTQC.testResultUpdatedSuccess";
          childHandlesRefresh = true; // DailyHTQC component will refresh its data
          if (!specificPayload || !specificPayload.dailyTestingDocId) {
            Swal.fire(
              t("scc.error"),
              "Test result data or Document ID is missing for Daily HT/FU Test.",
              "error"
            );
            setIsSubmitting(false);
            return false;
          }
          // payloadToSend is already specificPayload
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
          setIsSubmitting(false); // Ensure loader stops
          return false;
      }

      setIsSubmitting(true);

      try {
        if (!specificPayload) {
          // This block handles forms where SCCPage constructs the payload
          const inspectionTime = `${String(new Date().getHours()).padStart(
            2,
            "0"
          )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
            new Date().getSeconds()
          ).padStart(2, "0")}`;
          const currentUserInfoWithTime = { ...commonUserInfo, inspectionTime };

          if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            const formData =
              formTypeToSubmit === "HT" ? htFormData : fuFormData;
            if (
              !formData.inspectionDate ||
              !formData.machineNo ||
              !formData.moNo ||
              !formData.color ||
              !formData.standardSpecification ||
              formData.standardSpecification.length === 0 ||
              !formData.standardSpecification[0].timeSec ||
              !formData.standardSpecification[0].tempC ||
              !formData.standardSpecification[0].pressure ||
              formData.standardSpecification[0].tempOffset === undefined ||
              (formData.showSecondHeatSpec &&
                (formData.standardSpecification.length < 2 ||
                  !formData.standardSpecification[1].timeSec ||
                  !formData.standardSpecification[1].tempC ||
                  !formData.standardSpecification[1].pressure ||
                  formData.standardSpecification[1].tempOffset ===
                    undefined)) ||
              (!formData.referenceSampleImageUrl &&
                !formData.referenceSampleImageFile)
            ) {
              Swal.fire(
                t("scc.validationErrorTitle"),
                t(
                  formTypeToSubmit === "HT"
                    ? "scc.validation.firstSpecFieldsRequired"
                    : "scc.validation.secondSpecFieldsRequired"
                ),
                "warning"
              );
              throw new Error("Validation failed for HT/FU First Output.");
            }
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
              referenceSampleImage: finalImageUrls.referenceSampleImage,
              afterWashImage: finalImageUrls.afterWashImage,
              standardSpecification: formData.standardSpecification
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
            const formData = dailyTestingFormData;
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
          }
        }

        if (formTypeToSubmit === "HTInspectionReport" && specificPayload) {
          const reportDataFromChild = specificPayload;
          if (
            !reportDataFromChild.inspectionDate ||
            !reportDataFromChild.machineNo ||
            !reportDataFromChild.moNo ||
            !reportDataFromChild.color ||
            !reportDataFromChild.batchNo ||
            !reportDataFromChild.tableNo ||
            reportDataFromChild.actualLayers === undefined ||
            reportDataFromChild.actualLayers === null ||
            Number(reportDataFromChild.actualLayers) <= 0 ||
            reportDataFromChild.totalBundle === undefined ||
            reportDataFromChild.totalBundle === null ||
            Number(reportDataFromChild.totalBundle) <= 0 ||
            reportDataFromChild.totalPcs === undefined ||
            reportDataFromChild.totalPcs === null ||
            Number(reportDataFromChild.totalPcs) <= 0 ||
            !reportDataFromChild.aqlData ||
            reportDataFromChild.aqlData.sampleSize === null ||
            reportDataFromChild.aqlData.sampleSize <= 0
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
          const inspectionTime = `${String(new Date().getHours()).padStart(
            2,
            "0"
          )}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(
            new Date().getSeconds()
          ).padStart(2, "0")}`;
          payloadToSend = {
            ...reportDataFromChild,
            defectImageUrl: finalDefectImageUrl,
            ...commonUserInfo,
            inspectionTime
          };
          delete payloadToSend.defectImageFile;
        }
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
        // For "updateDailyHTFUTestResult", success message is handled by child.
        // For other types, show a generic success or the one defined by successMessageKey.
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
          const submittedInspectionDate = payloadToSend.inspectionDate;
          const preservedDate =
            submittedInspectionDate instanceof Date
              ? submittedInspectionDate
              : new Date(submittedInspectionDate);
          if (formTypeToSubmit === "HTInspectionReport") {
            currentSetterForReset({
              ...initialHTInspectionReportState,
              inspectionDate: preservedDate
            });
          } else if (formTypeToSubmit === "DailyTesting") {
            currentSetterForReset({
              ...initialSharedStateDailyTesting,
              inspectionDate: preservedDate,
              afterWashImageFile: null
            });
          } else if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
            currentSetterForReset({
              ...initialSharedStateFirstOutput,
              inspectionDate: preservedDate,
              referenceSampleImageFile: null,
              afterWashImageFile: null
            });
          } else {
            currentSetterForReset({
              ...initialStateForReset,
              inspectionDate: preservedDate
            });
          }
        }
        return true; // Indicate success to child component
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
        return false; // Indicate failure
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, t, uploadSccImage, htFormData, fuFormData, dailyTestingFormData]
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
                  activeTabData.data?._id ||
                  activeTabData.data?.inspectionDate?.toISOString() ||
                  "no-id-date"
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
