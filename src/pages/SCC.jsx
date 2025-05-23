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
// import DailyHTQC from "../components/inspection/scc/DailyHTQC"; // Import the new component
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [], // For HT/FU First Output
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
//   standardSpecifications: { tempC: null, timeSec: null, pressure: null }, // For Daily Testing
//   cycleWashingResults: [],
//   numberOfRejections: 0,
//   finalResult: "Pending",
//   remarks: "",
//   afterWashImageFile: null,
//   afterWashImageUrl: null
// };

// const initialDailyHTQCState = {
//   _id: null, // Will store the MongoDB _id of the DailyTestingHTFU document
//   inspectionDate: new Date(),
//   machineNo: "",
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null, // Base required temperature from HT/FU First Output
//   baseReqTime: null, // Base required time
//   baseReqPressure: null, // Base required pressure
//   inspections: [], // This will be an array of submitted inspection slot data
//   // The child component (DailyHTQC) will manage the detailed structure
//   // for UI and compile this array for submission.
//   stretchTestResult: "Pending",
//   washingTestResult: "Pending",
//   isStretchWashingTestDone: false // To track if these tests have been definitively set
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

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentData, imageTypeIdentifier) => {
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentData.moNo);
//       imageFormData.append("color", currentData.color);
//       imageFormData.append("imageType", imageTypeIdentifier);
//       imageFormData.append(
//         "inspectionDate",
//         currentData.inspectionDate instanceof Date
//           ? currentData.inspectionDate.toISOString().split("T")[0]
//           : String(currentData.inspectionDate).split("T")[0] // Handle if already string
//       );
//       const imgRes = await axios.post(
//         `${API_BASE_URL}/api/scc/upload-image`,
//         imageFormData
//       );
//       if (!imgRes.data.success) {
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifier} image.`
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
//         disabled: true // Keeping disabled as per original
//       },
//       {
//         id: "htInspection",
//         labelKey: "scc.tabs.htInspection",
//         icon: <Eye size={16} />,
//         disabled: true // Keeping disabled as per original
//       }
//     ],
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [htFormData, fuFormData, dailyTestingFormData, dailyHTQCFormData, t]
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let currentFormData,
//         currentSetter,
//         endpoint,
//         successMessageKey,
//         initialStateForReset,
//         payloadToSend;

//       // Determine which form data, setter, and endpoint to use
//       if (formTypeToSubmit === "HT") {
//         currentFormData = htFormData;
//         currentSetter = setHtFormData;
//         endpoint = "/api/scc/ht-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "FU") {
//         currentFormData = fuFormData;
//         currentSetter = setFuFormData;
//         endpoint = "/api/scc/fu-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "DailyTesting") {
//         currentFormData = dailyTestingFormData;
//         currentSetter = setDailyTestingFormData;
//         endpoint = "/api/scc/daily-testing";
//         successMessageKey = "sccdaily.reportSavedSuccess";
//         initialStateForReset = initialSharedStateDailyTesting;
//       } else if (formTypeToSubmit === "DailyHTQC") {
//         // For DailyHTQC, the specificPayload from the child component is crucial.
//         // The `currentFormData` variable will essentially be this `specificPayload`.
//         // `dailyHTQCFormData` (parent state) acts as the initial data source for the child.
//         currentFormData = specificPayload || dailyHTQCFormData; // Use specificPayload for submission logic
//         currentSetter = setDailyHTQCFormData;
//         endpoint = "/api/scc/daily-htfu-test"; // New endpoint
//         successMessageKey = "sccDailyHTQC.reportSavedSuccess"; // New translation key
//         initialStateForReset = initialDailyHTQCState; // New initial state
//       } else {
//         console.error("Unknown form type in SCCPage submit:", formTypeToSubmit);
//         Swal.fire(t("scc.error"), "Unknown form type.", "error");
//         return;
//       }

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return;
//       }

//       // === Basic Validation (common part) ===
//       // DailyHTQC manages its more complex validation internally before calling handleFormSubmit.
//       // So, we only do basic checks here for other forms, or ensure DailyHTQC payload is present.
//       if (formTypeToSubmit !== "DailyHTQC") {
//         if (
//           !currentFormData.inspectionDate ||
//           !currentFormData.moNo ||
//           !currentFormData.color
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasic"),
//             "warning"
//           );
//           return;
//         }
//       } else {
//         // For DailyHTQC, the currentFormData IS the specificPayload
//         if (
//           !currentFormData ||
//           !currentFormData.inspectionDate ||
//           !currentFormData.machineNo ||
//           !currentFormData.moNo ||
//           !currentFormData.color ||
//           !currentFormData.currentInspection
//         ) {
//           // This basic check on specificPayload content can be more elaborate
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               "sccDailyHTQC.validation.fillBasicPayload",
//               "Essential data missing in submission."
//             ),
//             "warning"
//           );
//           return;
//         }
//       }

//       // === Form-Specific Validation (already detailed in original SCCPage) ===
//       let formIsValid = true;
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !currentFormData.standardSpecification ||
//           currentFormData.standardSpecification.length < 2
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecIntegrity"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         const firstSpec = currentFormData.standardSpecification?.[0];
//         const afterHatSpec = currentFormData.standardSpecification?.[1];
//         if (
//           formIsValid &&
//           (!firstSpec?.timeSec || !firstSpec?.tempC || !firstSpec?.pressure)
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecFirst"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         if (
//           formIsValid &&
//           firstSpec?.status === "Reject" &&
//           (!afterHatSpec?.timeSec ||
//             !afterHatSpec?.tempC ||
//             !afterHatSpec?.pressure)
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecAfterHat"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         if (
//           formIsValid &&
//           !currentFormData.referenceSampleImageUrl &&
//           !currentFormData.referenceSampleImageFile
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorRefSample"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//       } else if (formTypeToSubmit === "DailyTesting") {
//         if (!currentFormData.machineNo) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccdaily.validationErrorMachineNo"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         const specs = currentFormData.standardSpecifications;
//         if (
//           formIsValid &&
//           (specs?.tempC === null ||
//             specs?.tempC === "" ||
//             specs?.timeSec === null ||
//             specs?.timeSec === "" ||
//             specs?.pressure === null ||
//             specs?.pressure === "")
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccdaily.validationErrorDailySpecs"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//       }
//       // Note: DailyHTQC's specific validations are handled within its component.
//       // This `formIsValid` check here primarily applies to the other forms.
//       if (!formIsValid && formTypeToSubmit !== "DailyHTQC") return;

//       setIsSubmitting(true);
//       try {
//         let imageUrls = {
//           referenceSample: currentFormData.referenceSampleImageUrl,
//           afterWash: currentFormData.afterWashImageUrl
//         };
//         let payloadSpecifics = {};

//         // Image handling and specific payload construction for HT/FU and DailyTesting
//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           if (currentFormData.referenceSampleImageFile) {
//             /* ... upload ... */ imageUrls.referenceSample = (
//               await uploadSccImage(
//                 currentFormData.referenceSampleImageFile,
//                 currentFormData,
//                 `referenceSample-${formTypeToSubmit}`
//               )
//             ).filePath;
//           }
//           if (currentFormData.afterWashImageFile) {
//             /* ... upload ... */ imageUrls.afterWash = (
//               await uploadSccImage(
//                 currentFormData.afterWashImageFile,
//                 currentFormData,
//                 `afterWash-${formTypeToSubmit}`
//               )
//             ).filePath;
//           }
//           payloadSpecifics = {
//             /* ... standardSpecification mapping ... */
//             referenceSampleImage: imageUrls.referenceSample,
//             afterWashImage: imageUrls.afterWash,
//             standardSpecification: currentFormData.standardSpecification.map(
//               (spec) => ({
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
//                 pressure: spec.pressure || null,
//                 status: spec.status,
//                 remarks: spec.remarks?.trim() || "NA"
//               })
//             )
//           };
//         } else if (formTypeToSubmit === "DailyTesting") {
//           if (currentFormData.afterWashImageFile) {
//             /* ... upload ... */ imageUrls.afterWash = (
//               await uploadSccImage(
//                 currentFormData.afterWashImageFile,
//                 currentFormData,
//                 "afterWashDaily"
//               )
//             ).filePath;
//           }
//           payloadSpecifics = {
//             /* ... daily testing specific fields ... */
//             machineNo: currentFormData.machineNo,
//             standardSpecifications: {
//               tempC: currentFormData.standardSpecifications.tempC
//                 ? Number(currentFormData.standardSpecifications.tempC)
//                 : null,
//               timeSec: currentFormData.standardSpecifications.timeSec
//                 ? Number(currentFormData.standardSpecifications.timeSec)
//                 : null,
//               pressure: currentFormData.standardSpecifications.pressure || null
//             },
//             cycleWashingResults: currentFormData.cycleWashingResults || [],
//             numberOfRejections: currentFormData.numberOfRejections || 0,
//             finalResult: currentFormData.finalResult || "Pending",
//             afterWashImage: imageUrls.afterWash
//           };
//         }

//         // Construct the final payload
//         if (formTypeToSubmit === "DailyHTQC") {
//           // The specificPayload *is* the payload for DailyHTQC, already structured by the child.
//           // It should include user details from the child.
//           payloadToSend = { ...currentFormData }; // currentFormData here IS specificPayload
//         } else {
//           // For other forms, build payload as before
//           const now = new Date();
//           const inspectionTime = `${String(now.getHours()).padStart(
//             2,
//             "0"
//           )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//             now.getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             _id: currentFormData._id || undefined,
//             inspectionDate: currentFormData.inspectionDate,
//             moNo: currentFormData.moNo,
//             buyer: currentFormData.buyer,
//             buyerStyle: currentFormData.buyerStyle,
//             color: currentFormData.color,
//             remarks: currentFormData.remarks?.trim() || "NA",
//             ...payloadSpecifics,
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A",
//             inspectionTime: inspectionTime
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

//         // Update state after successful submission
//         if (formTypeToSubmit === "DailyHTQC") {
//           // For DailyHTQC, we need to update the parent's state based on the returned record.
//           // The child component (DailyHTQC.jsx) will manage its detailed 'slotsDetailed' state
//           // internally by re-fetching or using the 'updatedRecord'.
//           // The parent just needs to hold the main record fields.
//           currentSetter({
//             ...initialDailyHTQCState, // Start with a clean slate for non-persistent fields
//             _id: updatedRecord._id,
//             inspectionDate: new Date(updatedRecord.inspectionDate), // Ensure it's a Date object
//             machineNo: updatedRecord.machineNo,
//             moNo: updatedRecord.moNo,
//             buyer: updatedRecord.buyer,
//             buyerStyle: updatedRecord.buyerStyle,
//             color: updatedRecord.color,
//             baseReqTemp: updatedRecord.baseReqTemp,
//             baseReqTime: updatedRecord.baseReqTime,
//             baseReqPressure: updatedRecord.baseReqPressure,
//             inspections: updatedRecord.inspections || [], // Store the submitted inspections array
//             stretchTestResult: updatedRecord.stretchTestResult,
//             washingTestResult: updatedRecord.washingTestResult,
//             isStretchWashingTestDone: updatedRecord.isStretchWashingTestDone
//           });
//           // The DailyHTQC component itself should use its useEffects watching `formData` (which is `dailyHTQCFormData`)
//           // to refresh its internal detailed view, or it might trigger a re-fetch.
//         } else {
//           // Existing reset logic for other forms
//           let stateUpdate = {
//             ...initialStateForReset,
//             _id: updatedRecord._id,
//             moNo: updatedRecord.moNo,
//             color: updatedRecord.color,
//             buyer: currentFormData.buyer, // Persist buyer/style as they are not in all backend responses
//             buyerStyle: currentFormData.buyerStyle,
//             inspectionDate: new Date(updatedRecord.inspectionDate), // Ensure Date object
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
//                 remarks: spec.remarks === "NA" ? "" : spec.remarks
//               }));
//             stateUpdate.referenceSampleImageUrl =
//               updatedRecord.referenceSampleImage;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           } else if (formTypeToSubmit === "DailyTesting") {
//             stateUpdate.machineNo = updatedRecord.machineNo;
//             stateUpdate.standardSpecifications =
//               updatedRecord.standardSpecifications;
//             stateUpdate.cycleWashingResults = updatedRecord.cycleWashingResults;
//             stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
//             stateUpdate.finalResult = updatedRecord.finalResult;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           }
//           currentSetter(stateUpdate);
//         }
//       } catch (error) {
//         console.error(
//           t("scc.errorSubmittingLog", "Error submitting form:"),
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting", "Failed to submit data.");
//         Swal.fire(t("scc.error"), errorMessage, "error");
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     // Dependencies for useCallback:
//     // Include all state variables that are *conditionally selected* inside the callback.
//     // Also include stable functions like `user`, `t`, `uploadSccImage`.
//     [
//       user,
//       t,
//       uploadSccImage,
//       htFormData,
//       fuFormData,
//       dailyTestingFormData,
//       dailyHTQCFormData,
//       setHtFormData,
//       setFuFormData,
//       setDailyTestingFormData,
//       setDailyHTQCFormData
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
//       {/* Increased max-width for DailyHTQC table, adjust as needed */}
//       <div className="max-w-5xl lg:max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>

//         <div className="flex flex-wrap justify-center border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none
//                 ${
//                   activeTab === tab.id
//                     ? "border-b-2 border-indigo-500 text-indigo-600"
//                     : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }
//                 ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {tab.icon}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>

//         {/* Reduced padding for more content space, adjust as needed */}
//         <div className="p-3 sm:p-4 md:p-5">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType} // Pass formType
//                 key={activeTabData.id} // Crucial for re-rendering/resetting child form state on tab change
//                 formData={activeTabData.data}
//                 onFormDataChange={activeTabData.setter} // This setter updates the parent's state
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

// import axios from "axios";
// import {
//   CheckSquare,
//   Eye,
//   FileText,
//   Settings2,
//   ShieldCheck, // Keep ShieldCheck for FUQC
//   ThermometerSun
// } from "lucide-react";
// import React, { useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DailyHTQC from "../components/inspection/scc/DailyHTQC";
// import DailyFUQC from "../components/inspection/scc/DailyFUQC"; // Import the new component
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";
// import HTInspectionReport from "../components/inspection/scc/HTInspectionReport"; // Import new component

// const initialSharedStateFirstOutput = {
//   _id: null,
//   inspectionDate: new Date(),
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
//   cycleWashingResults: [],
//   numberOfRejections: 0,
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
//   washingTestResult: "Pending",
//   isStretchWashingTestDone: false
// };

// // New initial state for DailyFUQC
// const initialDailyFUQCState = {
//   _id: null,
//   inspectionDate: new Date(),
//   machineNo: "", // Will be one of '001'-'005'
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   baseReqTemp: null, // Only temperature needed from FU First Output
//   inspections: [], // Array of { inspectionNo, timeSlotKey, temp_req, result }
//   remarks: "" // Optional remarks
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
//   // aqlData will be fetched and managed within HTInspectionReport component initially
//   // defectsQty and result are derived
//   defects: [],
//   remarks: "",
//   defectImageFile: null, // For holding the File object before upload
//   defectImageUrl: null // For holding the preview or existing image URL
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
//   // New state for DailyFUQC
//   const [dailyFUQCFormData, setDailyFUQCFormData] = useState({
//     ...initialDailyFUQCState
//   });

//   const [htInspectionReportData, setHtInspectionReportData] = useState({
//     ...initialHTInspectionReportState
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const uploadSccImage = useCallback(
//     async (file, currentData, imageTypeIdentifier) => {
//       // ... (same as your existing uploadSccImage function)
//       const imageFormData = new FormData();
//       imageFormData.append("imageFile", file);
//       imageFormData.append("moNo", currentData.moNo);
//       imageFormData.append("color", currentData.color);
//       imageFormData.append("imageType", imageTypeIdentifier);
//       imageFormData.append(
//         "inspectionDate",
//         currentData.inspectionDate instanceof Date
//           ? currentData.inspectionDate.toISOString().split("T")[0]
//           : String(currentData.inspectionDate).split("T")[0]
//       );
//       const imgRes = await axios.post(
//         `${API_BASE_URL}/api/scc/upload-image`,
//         imageFormData
//       );
//       if (!imgRes.data.success) {
//         throw new Error(
//           t(
//             "scc.errorUploadingImageGeneric",
//             `Failed to upload ${imageTypeIdentifier} image.`
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
//       // Updated DailyFUQC tab
//       {
//         id: "dailyFUQC",
//         labelKey: "scc.tabs.dailyFUQC",
//         icon: <ShieldCheck size={16} />, // Using ShieldCheck as requested
//         formType: "DailyFUQC",
//         data: dailyFUQCFormData,
//         setter: setDailyFUQCFormData,
//         component: DailyFUQC,
//         disabled: false // Enable this tab
//       },
//       {
//         // Updated HT Inspection tab
//         id: "htInspection",
//         labelKey: "scc.tabs.htInspection",
//         icon: <Eye size={16} />, // Or a more fitting icon like ListChecks
//         formType: "HTInspectionReport",
//         data: htInspectionReportData,
//         setter: setHtInspectionReportData,
//         component: HTInspectionReport,
//         disabled: false // Enable this tab
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
//     ] // Added dailyFUQCFormData
//   );

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component;

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit, specificPayload = null) => {
//       let currentFormData,
//         currentSetter,
//         endpoint,
//         successMessageKey,
//         initialStateForReset,
//         payloadToSend;

//       if (formTypeToSubmit === "HT") {
//         currentFormData = htFormData;
//         currentSetter = setHtFormData;
//         endpoint = "/api/scc/ht-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "FU") {
//         currentFormData = fuFormData;
//         currentSetter = setFuFormData;
//         endpoint = "/api/scc/fu-first-output";
//         successMessageKey = "scc.dataSavedSuccess";
//         initialStateForReset = initialSharedStateFirstOutput;
//       } else if (formTypeToSubmit === "DailyTesting") {
//         currentFormData = dailyTestingFormData;
//         currentSetter = setDailyTestingFormData;
//         endpoint = "/api/scc/daily-testing";
//         successMessageKey = "sccdaily.reportSavedSuccess";
//         initialStateForReset = initialSharedStateDailyTesting;
//       } else if (formTypeToSubmit === "DailyHTQC") {
//         currentFormData = specificPayload || dailyHTQCFormData;
//         currentSetter = setDailyHTQCFormData;
//         endpoint = "/api/scc/daily-htfu-test";
//         successMessageKey = "sccDailyHTQC.reportSavedSuccess";
//         initialStateForReset = initialDailyHTQCState;
//       } else if (formTypeToSubmit === "DailyFUQC") {
//         // New case for DailyFUQC
//         currentFormData = specificPayload || dailyFUQCFormData;
//         currentSetter = setDailyFUQCFormData;
//         endpoint = "/api/scc/daily-fuqc-test"; // New endpoint
//         successMessageKey = "sccDailyFUQC.reportSavedSuccess"; // New translation key
//         initialStateForReset = initialDailyFUQCState; // New initial state
//       } else if (formTypeToSubmit === "HTInspectionReport") {
//         currentFormData = specificPayload || htInspectionReportData; // specificPayload comes from HTInspectionReport.jsx
//         currentSetter = setHtInspectionReportData;
//         endpoint = "/api/scc/ht-inspection-report";
//         successMessageKey = "sccHTInspection.reportSavedSuccess";
//         initialStateForReset = initialHTInspectionReportState;
//       } else {
//         console.error("Unknown form type in SCCPage submit:", formTypeToSubmit);
//         Swal.fire(t("scc.error"), "Unknown form type.", "error");
//         return;
//       }

//       if (!user) {
//         Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
//         return;
//       }

//       // Basic Validation
//       if (
//         formTypeToSubmit !== "DailyHTQC" &&
//         formTypeToSubmit !== "DailyFUQC"
//       ) {
//         if (
//           !currentFormData.inspectionDate ||
//           !currentFormData.moNo ||
//           !currentFormData.color
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorBasic"),
//             "warning"
//           );
//           return;
//         }
//       } else {
//         // For DailyHTQC and DailyFUQC, payload is specificPayload
//         if (
//           !currentFormData ||
//           !currentFormData.inspectionDate ||
//           !currentFormData.machineNo ||
//           !currentFormData.moNo ||
//           !currentFormData.color ||
//           !currentFormData.currentInspection
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               formTypeToSubmit === "DailyHTQC"
//                 ? "sccDailyHTQC.validation.fillBasicPayload"
//                 : "sccDailyFUQC.validation.fillBasicPayload",
//               "Essential data missing in submission."
//             ),
//             "warning"
//           );
//           return;
//         }
//       }

//       // Form-Specific Validation
//       let formIsValid = true;
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         // ... (existing HT/FU validation)
//         if (
//           !currentFormData.standardSpecification ||
//           currentFormData.standardSpecification.length < 2
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecIntegrity"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         const firstSpec = currentFormData.standardSpecification?.[0];
//         const afterHatSpec = currentFormData.standardSpecification?.[1];
//         if (
//           formIsValid &&
//           (!firstSpec?.timeSec || !firstSpec?.tempC || !firstSpec?.pressure)
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecFirst"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         if (
//           formIsValid &&
//           firstSpec?.status === "Reject" &&
//           (!afterHatSpec?.timeSec ||
//             !afterHatSpec?.tempC ||
//             !afterHatSpec?.pressure)
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorSpecAfterHat"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         if (
//           formIsValid &&
//           !currentFormData.referenceSampleImageUrl &&
//           !currentFormData.referenceSampleImageFile
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("scc.validationErrorRefSample"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//       } else if (formTypeToSubmit === "DailyTesting") {
//         // ... (existing DailyTesting validation)
//         if (!currentFormData.machineNo) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccdaily.validationErrorMachineNo"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         const specs = currentFormData.standardSpecifications;
//         if (
//           formIsValid &&
//           (specs?.tempC === null ||
//             specs?.tempC === "" ||
//             specs?.timeSec === null ||
//             specs?.timeSec === "" ||
//             specs?.pressure === null ||
//             specs?.pressure === "")
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccdaily.validationErrorDailySpecs"),
//             "warning"
//           );
//           formIsValid = false;
//         }
//       }
//       // DailyHTQC/DailyFUQC validation mostly handled in child.
//       if (
//         !formIsValid &&
//         formTypeToSubmit !== "DailyHTQC" &&
//         formTypeToSubmit !== "DailyFUQC"
//       )
//         return;

//       setIsSubmitting(true);
//       try {
//         let imageUrls = {
//           referenceSample: currentFormData.referenceSampleImageUrl,
//           afterWash: currentFormData.afterWashImageUrl
//         };
//         let payloadSpecifics = {};

//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           // ... (image upload and payload for HT/FU)
//           if (currentFormData.referenceSampleImageFile) {
//             imageUrls.referenceSample = (
//               await uploadSccImage(
//                 currentFormData.referenceSampleImageFile,
//                 currentFormData,
//                 `referenceSample-${formTypeToSubmit}`
//               )
//             ).filePath;
//           }
//           if (currentFormData.afterWashImageFile) {
//             imageUrls.afterWash = (
//               await uploadSccImage(
//                 currentFormData.afterWashImageFile,
//                 currentFormData,
//                 `afterWash-${formTypeToSubmit}`
//               )
//             ).filePath;
//           }
//           payloadSpecifics = {
//             referenceSampleImage: imageUrls.referenceSample,
//             afterWashImage: imageUrls.afterWash,
//             standardSpecification: currentFormData.standardSpecification.map(
//               (spec) => ({
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
//                 pressure: spec.pressure || null,
//                 status: spec.status,
//                 remarks: spec.remarks?.trim() || "NA"
//               })
//             )
//           };
//         } else if (formTypeToSubmit === "DailyTesting") {
//           // ... (image upload and payload for DailyTesting)
//           if (currentFormData.afterWashImageFile) {
//             imageUrls.afterWash = (
//               await uploadSccImage(
//                 currentFormData.afterWashImageFile,
//                 currentFormData,
//                 "afterWashDaily"
//               )
//             ).filePath;
//           }
//           payloadSpecifics = {
//             machineNo: currentFormData.machineNo,
//             standardSpecifications: {
//               tempC: currentFormData.standardSpecifications.tempC
//                 ? Number(currentFormData.standardSpecifications.tempC)
//                 : null,
//               timeSec: currentFormData.standardSpecifications.timeSec
//                 ? Number(currentFormData.standardSpecifications.timeSec)
//                 : null,
//               pressure: currentFormData.standardSpecifications.pressure || null
//             },
//             cycleWashingResults: currentFormData.cycleWashingResults || [],
//             numberOfRejections: currentFormData.numberOfRejections || 0,
//             finalResult: currentFormData.finalResult || "Pending",
//             afterWashImage: imageUrls.afterWash
//           };
//         }

//         if (
//           formTypeToSubmit === "DailyHTQC" ||
//           formTypeToSubmit === "DailyFUQC"
//         ) {
//           payloadToSend = { ...currentFormData }; // specificPayload is already structured
//         } else {
//           const now = new Date();
//           const inspectionTime = `${String(now.getHours()).padStart(
//             2,
//             "0"
//           )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//             now.getSeconds()
//           ).padStart(2, "0")}`;
//           payloadToSend = {
//             _id: currentFormData._id || undefined,
//             inspectionDate: currentFormData.inspectionDate,
//             moNo: currentFormData.moNo,
//             buyer: currentFormData.buyer,
//             buyerStyle: currentFormData.buyerStyle,
//             color: currentFormData.color,
//             remarks: currentFormData.remarks?.trim() || "NA",
//             ...payloadSpecifics,
//             emp_id: user.emp_id,
//             emp_kh_name: user.kh_name || "N/A",
//             emp_eng_name: user.eng_name || "N/A",
//             emp_dept_name: user.dept_name || "N/A",
//             emp_sect_name: user.sect_name || "N/A",
//             emp_job_title: user.job_title || "N/A",
//             inspectionTime: inspectionTime
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

//         if (formTypeToSubmit === "DailyHTQC") {
//           currentSetter({
//             ...initialDailyHTQCState,
//             _id: updatedRecord._id,
//             inspectionDate: new Date(updatedRecord.inspectionDate),
//             machineNo: updatedRecord.machineNo,
//             moNo: updatedRecord.moNo,
//             buyer: updatedRecord.buyer,
//             buyerStyle: updatedRecord.buyerStyle,
//             color: updatedRecord.color,
//             baseReqTemp: updatedRecord.baseReqTemp,
//             baseReqTime: updatedRecord.baseReqTime,
//             baseReqPressure: updatedRecord.baseReqPressure,
//             inspections: updatedRecord.inspections || [],
//             stretchTestResult: updatedRecord.stretchTestResult,
//             washingTestResult: updatedRecord.washingTestResult,
//             isStretchWashingTestDone: updatedRecord.isStretchWashingTestDone
//           });
//         } else if (formTypeToSubmit === "DailyFUQC") {
//           // Handle state update for DailyFUQC
//           currentSetter({
//             ...initialDailyFUQCState,
//             _id: updatedRecord._id,
//             inspectionDate: new Date(updatedRecord.inspectionDate),
//             machineNo: updatedRecord.machineNo,
//             moNo: updatedRecord.moNo,
//             buyer: updatedRecord.buyer,
//             buyerStyle: updatedRecord.buyerStyle,
//             color: updatedRecord.color,
//             baseReqTemp: updatedRecord.baseReqTemp,
//             inspections: updatedRecord.inspections || [],
//             remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks
//           });
//         } else {
//           let stateUpdate = {
//             ...initialStateForReset,
//             _id: updatedRecord._id,
//             moNo: updatedRecord.moNo,
//             color: updatedRecord.color,
//             buyer: currentFormData.buyer,
//             buyerStyle: currentFormData.buyerStyle,
//             inspectionDate: new Date(updatedRecord.inspectionDate),
//             remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks
//           };

//           if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//             // ... (existing state update for HT/FU)
//             stateUpdate.standardSpecification =
//               updatedRecord.standardSpecification.map((spec) => ({
//                 ...spec,
//                 tempOffset:
//                   spec.tempOffsetPlus !== 0
//                     ? String(spec.tempOffsetPlus)
//                     : spec.tempOffsetMinus !== 0
//                     ? String(spec.tempOffsetMinus)
//                     : "0",
//                 remarks: spec.remarks === "NA" ? "" : spec.remarks
//               }));
//             stateUpdate.referenceSampleImageUrl =
//               updatedRecord.referenceSampleImage;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           } else if (formTypeToSubmit === "DailyTesting") {
//             // ... (existing state update for DailyTesting)
//             stateUpdate.machineNo = updatedRecord.machineNo;
//             stateUpdate.standardSpecifications =
//               updatedRecord.standardSpecifications;
//             stateUpdate.cycleWashingResults = updatedRecord.cycleWashingResults;
//             stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
//             stateUpdate.finalResult = updatedRecord.finalResult;
//             stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//           }
//           currentSetter(stateUpdate);
//         }
//       } catch (error) {
//         console.error(
//           t("scc.errorSubmittingLog", "Error submitting form:"),
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting", "Failed to submit data.");
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
//       dailyFUQCFormData, // Added
//       setHtFormData,
//       setFuFormData,
//       setDailyTestingFormData,
//       setDailyHTQCFormData,
//       setDailyFUQCFormData // Added
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
//       <div className="max-w-5xl lg:max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pt-6 pb-4 text-center border-b">
//           {t("scc.title", "SCC Inspection (HT/FU)")}
//         </h1>

//         <div className="flex flex-wrap justify-center border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => !tab.disabled && setActiveTab(tab.id)}
//               disabled={tab.disabled}
//               className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none
//                 ${
//                   activeTab === tab.id
//                     ? "border-b-2 border-indigo-500 text-indigo-600"
//                     : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }
//                 ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//             >
//               {tab.icon}
//               <span>{t(tab.labelKey, tab.labelKey.split(".").pop())}</span>
//             </button>
//           ))}
//         </div>
//         <div className="p-3 sm:p-4 md:p-5">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 formType={activeTabData.formType}
//                 key={activeTabData.id}
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

import axios from "axios";
import {
  CheckSquare,
  Eye, // Original icon for HT Inspection
  FileText,
  ListChecks, // Alternative icon if you prefer
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
import HTInspectionReport from "../components/inspection/scc/HTInspectionReport"; // Import new component
import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";

const initialSharedStateFirstOutput = {
  _id: null,
  inspectionDate: new Date(),
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
  cycleWashingResults: [],
  numberOfRejections: 0,
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
  defectImageFile: null, // For holding the File object before upload
  defectImageUrl: null // For holding the preview or existing image URL
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
      // Special handling for HTInspectionReport to include batchNo
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
        icon: <Eye size={16} />, // Using original Eye icon
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
      let currentFormData,
        currentSetter,
        endpoint,
        successMessageKey,
        initialStateForReset,
        payloadToSend;

      if (formTypeToSubmit === "HT") {
        currentFormData = htFormData;
        currentSetter = setHtFormData;
        endpoint = "/api/scc/ht-first-output";
        successMessageKey = "scc.dataSavedSuccess";
        initialStateForReset = initialSharedStateFirstOutput;
      } else if (formTypeToSubmit === "FU") {
        currentFormData = fuFormData;
        currentSetter = setFuFormData;
        endpoint = "/api/scc/fu-first-output";
        successMessageKey = "scc.dataSavedSuccess";
        initialStateForReset = initialSharedStateFirstOutput;
      } else if (formTypeToSubmit === "DailyTesting") {
        currentFormData = dailyTestingFormData;
        currentSetter = setDailyTestingFormData;
        endpoint = "/api/scc/daily-testing";
        successMessageKey = "sccdaily.reportSavedSuccess";
        initialStateForReset = initialSharedStateDailyTesting;
      } else if (formTypeToSubmit === "DailyHTQC") {
        currentFormData = specificPayload || dailyHTQCFormData;
        currentSetter = setDailyHTQCFormData;
        endpoint = "/api/scc/daily-htfu-test";
        successMessageKey = "sccDailyHTQC.reportSavedSuccess";
        initialStateForReset = initialDailyHTQCState;
      } else if (formTypeToSubmit === "DailyFUQC") {
        currentFormData = specificPayload || dailyFUQCFormData;
        currentSetter = setDailyFUQCFormData;
        endpoint = "/api/scc/daily-fuqc-test";
        successMessageKey = "sccDailyFUQC.reportSavedSuccess";
        initialStateForReset = initialDailyFUQCState;
      } else if (formTypeToSubmit === "HTInspectionReport") {
        currentFormData = specificPayload || htInspectionReportData;
        currentSetter = setHtInspectionReportData;
        endpoint = "/api/scc/ht-inspection-report";
        successMessageKey = "sccHTInspection.reportSavedSuccess";
        initialStateForReset = initialHTInspectionReportState;
      } else {
        console.error("Unknown form type in SCCPage submit:", formTypeToSubmit);
        Swal.fire(t("scc.error"), "Unknown form type.", "error");
        return;
      }

      if (!user) {
        Swal.fire(t("scc.error"), t("scc.userNotLoggedIn"), "error");
        return;
      }

      // Basic Validation (Child components should perform detailed validation before calling this)
      if (formTypeToSubmit === "HTInspectionReport") {
        if (
          !currentFormData ||
          !currentFormData.inspectionDate ||
          !currentFormData.machineNo ||
          !currentFormData.moNo ||
          !currentFormData.color ||
          !currentFormData.batchNo ||
          currentFormData.totalPcs === null ||
          currentFormData.totalPcs <= 0
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              "sccHTInspection.validation.fillBasicPayload",
              "Essential data missing or invalid for HT Inspection submission."
            ),
            "warning"
          );
          return;
        }
      } else if (
        formTypeToSubmit !== "DailyHTQC" &&
        formTypeToSubmit !== "DailyFUQC"
      ) {
        if (
          !currentFormData.inspectionDate ||
          !currentFormData.moNo ||
          !currentFormData.color
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validationErrorBasic"),
            "warning"
          );
          return;
        }
      } else {
        // For DailyHTQC and DailyFUQC
        if (
          !currentFormData ||
          !currentFormData.inspectionDate ||
          !currentFormData.machineNo ||
          !currentFormData.moNo ||
          !currentFormData.color ||
          !currentFormData.currentInspection
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              formTypeToSubmit === "DailyHTQC"
                ? "sccDailyHTQC.validation.fillBasicPayload"
                : "sccDailyFUQC.validation.fillBasicPayload",
              "Essential data missing in submission."
            ),
            "warning"
          );
          return;
        }
      }

      // Form-Specific Validation (Example, more would be in child components)
      let formIsValid = true;
      if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
        if (
          !currentFormData.standardSpecification ||
          currentFormData.standardSpecification.length < 2
        ) {
          formIsValid = false; /* ... Swal ... */
        }
        // ... other HT/FU validations ...
        if (
          formIsValid &&
          !currentFormData.referenceSampleImageUrl &&
          !currentFormData.referenceSampleImageFile
        ) {
          formIsValid = false; /* ... Swal ... */
        }
      } else if (formTypeToSubmit === "DailyTesting") {
        if (!currentFormData.machineNo) {
          formIsValid = false; /* ... Swal ... */
        }
        // ... other DailyTesting validations ...
      }
      if (!formIsValid) return; // Halt if form-specific validations fail for non-child-managed forms

      setIsSubmitting(true);
      try {
        let finalImageUrls = {}; // Store URLs of uploaded images or existing ones

        // --- Image Upload Logic based on formTypeToSubmit ---
        let imageTypeIdentifier = ""; // Will be set based on formType
        if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
          if (currentFormData.referenceSampleImageFile) {
            imageTypeIdentifier = `referenceSample-${formTypeToSubmit}`;
            const imgData = await uploadSccImage(
              currentFormData.referenceSampleImageFile,
              currentFormData,
              imageTypeIdentifier
            );
            finalImageUrls.referenceSampleImage = imgData.filePath;
          } else {
            finalImageUrls.referenceSampleImage =
              currentFormData.referenceSampleImageUrl;
          }
          if (currentFormData.afterWashImageFile) {
            imageTypeIdentifier = `afterWash-${formTypeToSubmit}`;
            const imgData = await uploadSccImage(
              currentFormData.afterWashImageFile,
              currentFormData,
              imageTypeIdentifier
            );
            finalImageUrls.afterWashImage = imgData.filePath;
          } else {
            finalImageUrls.afterWashImage = currentFormData.afterWashImageUrl;
          }
        } else if (formTypeToSubmit === "DailyTesting") {
          if (currentFormData.afterWashImageFile) {
            imageTypeIdentifier = "afterWashDaily";
            const imgData = await uploadSccImage(
              currentFormData.afterWashImageFile,
              currentFormData,
              imageTypeIdentifier
            );
            finalImageUrls.afterWashImage = imgData.filePath;
          } else {
            finalImageUrls.afterWashImage = currentFormData.afterWashImageUrl;
          }
        } else if (formTypeToSubmit === "HTInspectionReport") {
          if (currentFormData.defectImageFile) {
            // currentFormData is specificPayload here
            imageTypeIdentifier = `htDefect-${currentFormData.moNo}-${currentFormData.color}-${currentFormData.batchNo}`;
            const imgData = await uploadSccImage(
              currentFormData.defectImageFile,
              currentFormData,
              imageTypeIdentifier
            );
            finalImageUrls.defectImageUrl = imgData.filePath;
          } else {
            finalImageUrls.defectImageUrl = currentFormData.defectImageUrl;
          }
        }

        // --- Construct Payload to Send ---
        if (
          formTypeToSubmit === "DailyHTQC" ||
          formTypeToSubmit === "DailyFUQC"
        ) {
          payloadToSend = { ...currentFormData }; // currentFormData is already the specificPayload from child
        } else if (formTypeToSubmit === "HTInspectionReport") {
          payloadToSend = {
            ...currentFormData, // currentFormData is specificPayload from HTInspectionReport.jsx
            defectImageUrl: finalImageUrls.defectImageUrl,
            defectImageFile: undefined, // Don't send the File object to the backend for this endpoint
            emp_id: user.emp_id,
            emp_kh_name: user.kh_name || "N/A",
            emp_eng_name: user.eng_name || "N/A",
            emp_dept_name: user.dept_name || "N/A",
            emp_sect_name: user.sect_name || "N/A",
            emp_job_title: user.job_title || "N/A"
          };
        } else {
          // For HT, FU, DailyTesting
          const now = new Date();
          const inspectionTime = `${String(now.getHours()).padStart(
            2,
            "0"
          )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
            now.getSeconds()
          ).padStart(2, "0")}`;
          payloadToSend = {
            _id: currentFormData._id || undefined,
            inspectionDate: currentFormData.inspectionDate,
            moNo: currentFormData.moNo,
            buyer: currentFormData.buyer,
            buyerStyle: currentFormData.buyerStyle,
            color: currentFormData.color,
            remarks: currentFormData.remarks?.trim() || "NA",
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
              currentFormData.standardSpecification.map((spec) => ({
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
                pressure: spec.pressure || null,
                status: spec.status,
                remarks: spec.remarks?.trim() || "NA"
              }));
          } else if (formTypeToSubmit === "DailyTesting") {
            payloadToSend.machineNo = currentFormData.machineNo;
            payloadToSend.standardSpecifications = {
              tempC: currentFormData.standardSpecifications.tempC
                ? Number(currentFormData.standardSpecifications.tempC)
                : null,
              timeSec: currentFormData.standardSpecifications.timeSec
                ? Number(currentFormData.standardSpecifications.timeSec)
                : null,
              pressure: currentFormData.standardSpecifications.pressure || null
            };
            payloadToSend.cycleWashingResults =
              currentFormData.cycleWashingResults || [];
            payloadToSend.numberOfRejections =
              currentFormData.numberOfRejections || 0;
            payloadToSend.finalResult =
              currentFormData.finalResult || "Pending";
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

        // --- Update State After Successful Submission ---
        if (
          formTypeToSubmit === "DailyHTQC" ||
          formTypeToSubmit === "DailyFUQC" ||
          formTypeToSubmit === "HTInspectionReport"
        ) {
          currentSetter({ ...initialStateForReset });
        } else {
          // For HT, FU, DailyTesting
          let stateUpdate = {
            ...initialStateForReset,
            _id: updatedRecord._id,
            moNo: updatedRecord.moNo,
            color: updatedRecord.color,
            buyer: currentFormData.buyer,
            buyerStyle: currentFormData.buyerStyle,
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
                remarks: spec.remarks === "NA" ? "" : spec.remarks
              }));
            stateUpdate.referenceSampleImageUrl =
              updatedRecord.referenceSampleImage;
            stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
          } else if (formTypeToSubmit === "DailyTesting") {
            stateUpdate.machineNo = updatedRecord.machineNo;
            stateUpdate.standardSpecifications =
              updatedRecord.standardSpecifications;
            stateUpdate.cycleWashingResults = updatedRecord.cycleWashingResults;
            stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
            stateUpdate.finalResult = updatedRecord.finalResult;
            stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
          }
          currentSetter(stateUpdate);
        }
      } catch (error) {
        console.error(
          t("scc.errorSubmittingLog", "Error submitting form:"),
          error.response?.data || error.message || error
        );
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          t("scc.errorSubmitting", "Failed to submit data.");
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
              className={`flex items-center space-x-2 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium focus:outline-none
                ${
                  activeTab === tab.id
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                key={activeTabData.id}
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
