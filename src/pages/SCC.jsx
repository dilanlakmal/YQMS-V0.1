// import React, { useState, useCallback } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";
// import {
//   FileText,
//   ThermometerSun,
//   CheckSquare,
//   ShieldCheck,
//   Settings2,
//   Eye
// } from "lucide-react";

// const initialSharedState = {
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [
//     // Initialized in SCCFirstOutputForm based on formType
//   ],
//   referenceSampleImageFile: null,
//   referenceSampleImageUrl: null,
//   afterWashImageFile: null,
//   afterWashImageUrl: null,
//   remarks: ""
// };

// const SCCPage = () => {
//   const { t } = useTranslation();
//   const { user, loading: authLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState("firstOutputHT");

//   const [htFormData, setHtFormData] = useState({ ...initialSharedState });
//   const [fuFormData, setFuFormData] = useState({ ...initialSharedState });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const tabs = [
//     {
//       id: "firstOutputHT",
//       labelKey: "scc.tabs.firstOutputHT",
//       icon: <FileText size={16} />,
//       formType: "HT",
//       data: htFormData,
//       setter: setHtFormData
//     },
//     {
//       id: "firstOutputFU",
//       labelKey: "scc.tabs.firstOutputFU",
//       icon: <FileText size={16} />,
//       formType: "FU",
//       data: fuFormData,
//       setter: setFuFormData
//     },
//     {
//       id: "dailyTesting",
//       labelKey: "scc.tabs.dailyTesting",
//       icon: <ThermometerSun size={16} />,
//       disabled: true
//     },
//     {
//       id: "dailyHTQC",
//       labelKey: "scc.tabs.dailyHTQC",
//       icon: <CheckSquare size={16} />,
//       disabled: true
//     },
//     {
//       id: "dailyFUQC",
//       labelKey: "scc.tabs.dailyFUQC",
//       icon: <ShieldCheck size={16} />,
//       disabled: true
//     },
//     {
//       id: "htInspection",
//       labelKey: "scc.tabs.htInspection",
//       icon: <Eye size={16} />,
//       disabled: true
//     }
//   ];

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit) => {
//       const currentFormData =
//         formTypeToSubmit === "HT" ? htFormData : fuFormData;
//       const currentSetter =
//         formTypeToSubmit === "HT" ? setHtFormData : setFuFormData;

//       if (!user) {
//         Swal.fire(
//           t("scc.error"),
//           t("scc.userNotLoggedIn", "User not logged in. Please log in again."),
//           "error"
//         );
//         return;
//       }

//       // Basic Validation
//       if (
//         !currentFormData.inspectionDate ||
//         !currentFormData.moNo ||
//         !currentFormData.color
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorBasic",
//             "Please fill in Date, MO No, and Color."
//           ),
//           "warning"
//         );
//         return;
//       }
//       if (
//         !currentFormData.standardSpecification ||
//         currentFormData.standardSpecification.length < 2
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorSpecIntegrity",
//             "Specification data is incomplete. Please refresh or re-enter."
//           ),
//           "warning"
//         );
//         return;
//       }
//       const firstSpec = currentFormData.standardSpecification[0];
//       const afterHatSpec = currentFormData.standardSpecification[1];

//       if (!firstSpec?.timeSec || !firstSpec?.tempC || !firstSpec?.pressure) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorSpecFirst",
//             "Please fill all 'First' specification fields (Time, Temp, Pressure)."
//           ),
//           "warning"
//         );
//         return;
//       }
//       if (
//         firstSpec?.status === "Reject" &&
//         (!afterHatSpec?.timeSec ||
//           !afterHatSpec?.tempC ||
//           !afterHatSpec?.pressure)
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorSpecAfterHat",
//             "If 'First' status is Reject, please fill all 'After Hat' specification fields (Time, Temp, Pressure)."
//           ),
//           "warning"
//         );
//         return;
//       }
//       if (
//         !currentFormData.referenceSampleImageUrl &&
//         !currentFormData.referenceSampleImageFile
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorRefSample",
//             "Reference Sample image is required."
//           ),
//           "warning"
//         );
//         return;
//       }
//       // After Wash image is OPTIONAL

//       setIsSubmitting(true);

//       try {
//         let refImageUrl = currentFormData.referenceSampleImageUrl;
//         let washImageUrl = currentFormData.afterWashImageUrl;

//         if (currentFormData.referenceSampleImageFile) {
//           const imageFormData = new FormData();
//           imageFormData.append(
//             "imageFile",
//             currentFormData.referenceSampleImageFile
//           );
//           imageFormData.append("moNo", currentFormData.moNo);
//           imageFormData.append("color", currentFormData.color);
//           imageFormData.append(
//             "imageType",
//             `referenceSample-${formTypeToSubmit}`
//           );
//           imageFormData.append(
//             "inspectionDate",
//             currentFormData.inspectionDate.toISOString().split("T")[0]
//           );
//           const imgRes = await axios.post(
//             `${API_BASE_URL}/api/scc/upload-image`,
//             imageFormData
//           );
//           if (imgRes.data.success) {
//             refImageUrl = imgRes.data.filePath;
//           } else {
//             throw new Error(
//               t(
//                 "scc.errorUploadingRefImage",
//                 "Failed to upload reference sample image."
//               )
//             );
//           }
//         }

//         if (currentFormData.afterWashImageFile) {
//           const imageFormData = new FormData();
//           imageFormData.append("imageFile", currentFormData.afterWashImageFile);
//           imageFormData.append("moNo", currentFormData.moNo);
//           imageFormData.append("color", currentFormData.color);
//           imageFormData.append("imageType", `afterWash-${formTypeToSubmit}`);
//           imageFormData.append(
//             "inspectionDate",
//             currentFormData.inspectionDate.toISOString().split("T")[0]
//           );
//           const imgRes = await axios.post(
//             `${API_BASE_URL}/api/scc/upload-image`,
//             imageFormData
//           );
//           if (imgRes.data.success) {
//             washImageUrl = imgRes.data.filePath;
//           } else {
//             throw new Error(
//               t(
//                 "scc.errorUploadingWashImage",
//                 "Failed to upload after wash image."
//               )
//             );
//           }
//         }

//         const now = new Date();
//         const inspectionTime = `${String(now.getHours()).padStart(
//           2,
//           "0"
//         )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//           now.getSeconds()
//         ).padStart(2, "0")}`;

//         const payload = {
//           _id: currentFormData._id || undefined, // Send _id only if it exists for updates
//           inspectionDate: currentFormData.inspectionDate, // Will be formatted by backend
//           moNo: currentFormData.moNo,
//           buyer: currentFormData.buyer,
//           buyerStyle: currentFormData.buyerStyle,
//           color: currentFormData.color,
//           referenceSampleImage: refImageUrl,
//           afterWashImage: washImageUrl,
//           remarks: currentFormData.remarks?.trim() || "NA",
//           standardSpecification: currentFormData.standardSpecification.map(
//             (spec) => {
//               const offsetVal = parseFloat(spec.tempOffset);
//               return {
//                 type: spec.type,
//                 method: spec.method,
//                 timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                 tempC: spec.tempC ? Number(spec.tempC) : null,
//                 tempOffsetMinus:
//                   !isNaN(offsetVal) && offsetVal !== 0
//                     ? -Math.abs(offsetVal)
//                     : 0,
//                 tempOffsetPlus:
//                   !isNaN(offsetVal) && offsetVal !== 0
//                     ? Math.abs(offsetVal)
//                     : 0,
//                 pressure: spec.pressure || null,
//                 status: spec.status,
//                 remarks: spec.remarks?.trim() || "NA"
//               };
//             }
//           ),
//           emp_id: user.emp_id,
//           emp_kh_name: user.kh_name || "N/A",
//           emp_eng_name: user.eng_name || "N/A",
//           emp_dept_name: user.dept_name || "N/A",
//           emp_sect_name: user.sect_name || "N/A",
//           emp_job_title: user.job_title || "N/A",
//           inspectionTime: inspectionTime
//         };

//         const endpoint =
//           formTypeToSubmit === "HT"
//             ? "/api/scc/ht-first-output"
//             : "/api/scc/fu-first-output";
//         const response = await axios.post(
//           `${API_BASE_URL}${endpoint}`,
//           payload
//         );

//         Swal.fire(
//           t("scc.success", "Success"),
//           response.data.message ||
//             t("scc.dataSavedSuccess", "Data saved successfully!"),
//           "success"
//         );

//         const updatedRecord = response.data.data;
//         const mapSpecsForDisplay = (specs) =>
//           specs.map((spec) => ({
//             ...spec,
//             tempOffset:
//               spec.tempOffsetPlus !== 0
//                 ? String(spec.tempOffsetPlus)
//                 : spec.tempOffsetMinus !== 0
//                 ? String(spec.tempOffsetMinus)
//                 : "0",
//             remarks: spec.remarks || ""
//           }));

//         currentSetter({
//           ...initialSharedState,
//           _id: updatedRecord._id,
//           moNo: updatedRecord.moNo,
//           color: updatedRecord.color,
//           buyer: currentFormData.buyer, // Keep current buyer/style as they are not in updatedRecord
//           buyerStyle: currentFormData.buyerStyle,
//           inspectionDate: new Date(updatedRecord.inspectionDate), // Parse date from MM/DD/YYYY string
//           standardSpecification: mapSpecsForDisplay(
//             updatedRecord.standardSpecification
//           ),
//           referenceSampleImageUrl: updatedRecord.referenceSampleImage,
//           afterWashImageUrl: updatedRecord.afterWashImage,
//           remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks // Display empty if "NA"
//         });
//       } catch (error) {
//         console.error(
//           t("scc.errorSubmittingLog", "Error submitting form:"),
//           error.response?.data || error.message || error
//         );
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           t("scc.errorSubmitting", "Failed to submit data.");
//         Swal.fire(t("scc.error", "Error"), errorMessage, "error");
//       } finally {
//         setIsSubmitting(false);
//       }
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     },
//     [htFormData, fuFormData, user, t]
//   ); // Removed setters from deps as they are part of currentFormData

//   if (authLoading) {
//     return (
//       <div className="p-6 text-center">
//         {t("scc.loadingUser", "Loading user data...")}
//       </div>
//     );
//   }
//   if (!user && !authLoading) {
//     // Check !authLoading to ensure user is truly not available
//     return (
//       <div className="p-6 text-center">
//         {t("scc.noUserFound", "User not found. Please log in.")}
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 sm:p-6">
//       <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
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

//         <div className="p-4 sm:p-6">
//           {activeTabData &&
//             !activeTabData.disabled &&
//             activeTabData.formType &&
//             user && (
//               <SCCFirstOutputForm
//                 key={activeTabData.id}
//                 formType={activeTabData.formType}
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

// import React, { useState, useCallback } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";
// import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting"; // Import the new component
// import {
//   FileText,
//   ThermometerSun,
//   CheckSquare,
//   ShieldCheck,
//   Settings2,
//   Eye
// } from "lucide-react";

// const initialSharedStateFirstOutput = {
//   // Renamed for clarity
//   _id: null,
//   inspectionDate: new Date(),
//   moNo: "",
//   buyer: "",
//   buyerStyle: "",
//   color: "",
//   standardSpecification: [
//     // Initialized in SCCFirstOutputForm
//   ],
//   referenceSampleImageFile: null,
//   referenceSampleImageUrl: null,
//   afterWashImageFile: null,
//   afterWashImageUrl: null,
//   remarks: ""
// };

// const initialSharedStateDailyTesting = {
//   // New initial state for Daily Testing
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
//   afterWashImageFile: null, // For the single image in daily testing
//   afterWashImageUrl: null
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
//   }); // State for the new tab

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const tabs = [
//     {
//       id: "firstOutputHT",
//       labelKey: "scc.tabs.firstOutputHT",
//       icon: <FileText size={16} />,
//       formType: "HT", // Used by handleFormSubmit
//       data: htFormData,
//       setter: setHtFormData,
//       component: SCCFirstOutputForm // Component to render for this tab
//     },
//     {
//       id: "firstOutputFU",
//       labelKey: "scc.tabs.firstOutputFU",
//       icon: <FileText size={16} />,
//       formType: "FU", // Used by handleFormSubmit
//       data: fuFormData,
//       setter: setFuFormData,
//       component: SCCFirstOutputForm // Component to render
//     },
//     {
//       id: "dailyTesting",
//       labelKey: "scc.tabs.dailyTesting",
//       icon: <ThermometerSun size={16} />,
//       formType: "DailyTesting", // New formType
//       data: dailyTestingFormData,
//       setter: setDailyTestingFormData,
//       component: SCCDailyTesting, // Component for this tab
//       disabled: false // Enable this tab
//     },
//     {
//       id: "dailyHTQC",
//       labelKey: "scc.tabs.dailyHTQC",
//       icon: <CheckSquare size={16} />,
//       disabled: true
//     },
//     {
//       id: "dailyFUQC",
//       labelKey: "scc.tabs.dailyFUQC",
//       icon: <ShieldCheck size={16} />,
//       disabled: true
//     },
//     {
//       id: "htInspection",
//       labelKey: "scc.tabs.htInspection",
//       icon: <Eye size={16} />,
//       disabled: true
//     }
//   ];

//   const activeTabData = tabs.find((tab) => tab.id === activeTab);
//   const CurrentFormComponent = activeTabData?.component; // Get the component for the active tab

//   // Helper function for image uploads to avoid repetition
//   const uploadSccImage = async (file, currentData, imageTypeIdentifier) => {
//     const imageFormData = new FormData();
//     imageFormData.append("imageFile", file);
//     imageFormData.append("moNo", currentData.moNo);
//     imageFormData.append("color", currentData.color);
//     imageFormData.append("imageType", imageTypeIdentifier);
//     imageFormData.append(
//       "inspectionDate",
//       currentData.inspectionDate.toISOString().split("T")[0]
//     );
//     const imgRes = await axios.post(
//       `${API_BASE_URL}/api/scc/upload-image`,
//       imageFormData
//     );
//     if (!imgRes.data.success) {
//       throw new Error(
//         t(
//           "scc.errorUploadingImageGeneric",
//           `Failed to upload ${imageTypeIdentifier} image.`
//         )
//       );
//     }
//     return imgRes.data;
//   };

//   const handleFormSubmit = useCallback(
//     async (formTypeToSubmit) => {
//       // formTypeToSubmit will come from the component instance
//       let currentFormData,
//         currentSetter,
//         endpoint,
//         successMessageKey,
//         initialStateForReset;

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
//       } else {
//         console.error("Unknown form type in SCCPage submit:", formTypeToSubmit);
//         Swal.fire(t("scc.error"), "Unknown form type.", "error");
//         return;
//       }

//       if (!user) {
//         Swal.fire(
//           t("scc.error"),
//           t("scc.userNotLoggedIn", "User not logged in. Please log in again."),
//           "error"
//         );
//         return;
//       }

//       // === Basic Validation (common part) ===
//       if (
//         !currentFormData.inspectionDate ||
//         !currentFormData.moNo ||
//         !currentFormData.color
//       ) {
//         Swal.fire(
//           t("scc.validationErrorTitle"),
//           t(
//             "scc.validationErrorBasic",
//             "Please fill in Date, MO No, and Color."
//           ),
//           "warning"
//         );
//         return;
//       }

//       // === Form-Specific Validation ===
//       let formIsValid = true;
//       if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//         if (
//           !currentFormData.standardSpecification ||
//           currentFormData.standardSpecification.length < 2
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               "scc.validationErrorSpecIntegrity",
//               "Specification data is incomplete."
//             ),
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
//             t("scc.validationErrorSpecFirst", "Fill 'First' spec fields."),
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
//             t(
//               "scc.validationErrorSpecAfterHat",
//               "Fill 'After Hat' spec fields if 'First' is Reject."
//             ),
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
//             t(
//               "scc.validationErrorRefSample",
//               "Reference Sample image required."
//             ),
//             "warning"
//           );
//           formIsValid = false;
//         }
//       } else if (formTypeToSubmit === "DailyTesting") {
//         if (!currentFormData.machineNo) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t("sccdaily.validationErrorMachineNo", "Please select Machine No."),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         const specs = currentFormData.standardSpecifications;
//         if (
//           formIsValid &&
//           (!specs?.tempC || !specs?.timeSec || !specs?.pressure)
//         ) {
//           Swal.fire(
//             t("scc.validationErrorTitle"),
//             t(
//               "sccdaily.validationErrorDailySpecs",
//               "Fill Standard Spec fields for daily test."
//             ),
//             "warning"
//           );
//           formIsValid = false;
//         }
//         // Cycle & Final Result validation is mostly handled by component logic
//         // After Wash Image for Daily Test is optional by requirement.
//       }
//       if (!formIsValid) return;

//       setIsSubmitting(true);
//       try {
//         let imageUrls = {
//           referenceSample: currentFormData.referenceSampleImageUrl, // For HT/FU
//           afterWash: currentFormData.afterWashImageUrl // Can be for HT/FU or DailyTesting
//         };
//         let payloadSpecifics = {}; // To hold parts of payload unique to each form type

//         // Image Upload Logic
//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           if (currentFormData.referenceSampleImageFile) {
//             const imgRes = await uploadSccImage(
//               currentFormData.referenceSampleImageFile,
//               currentFormData,
//               `referenceSample-${formTypeToSubmit}`
//             );
//             imageUrls.referenceSample = imgRes.filePath;
//           }
//           if (currentFormData.afterWashImageFile) {
//             // This is the second image for HT/FU
//             const imgRes = await uploadSccImage(
//               currentFormData.afterWashImageFile,
//               currentFormData,
//               `afterWash-${formTypeToSubmit}`
//             );
//             imageUrls.afterWash = imgRes.filePath;
//           }
//           payloadSpecifics = {
//             referenceSampleImage: imageUrls.referenceSample,
//             afterWashImage: imageUrls.afterWash, // Second image for HT/FU
//             standardSpecification: currentFormData.standardSpecification.map(
//               (spec) => {
//                 const offsetVal = parseFloat(spec.tempOffset) || 0;
//                 return {
//                   type: spec.type,
//                   method: spec.method,
//                   timeSec: spec.timeSec ? Number(spec.timeSec) : null,
//                   tempC: spec.tempC ? Number(spec.tempC) : null,
//                   tempOffsetMinus: offsetVal !== 0 ? -Math.abs(offsetVal) : 0,
//                   tempOffsetPlus: offsetVal !== 0 ? Math.abs(offsetVal) : 0,
//                   pressure: spec.pressure || null,
//                   status: spec.status,
//                   remarks: spec.remarks?.trim() || "NA"
//                 };
//               }
//             )
//           };
//         } else if (formTypeToSubmit === "DailyTesting") {
//           if (currentFormData.afterWashImageFile) {
//             // Single image for daily testing
//             const imgRes = await uploadSccImage(
//               currentFormData.afterWashImageFile,
//               currentFormData,
//               "afterWashDaily"
//             );
//             imageUrls.afterWash = imgRes.filePath; // Store it in the common 'afterWash' slot
//           }
//           payloadSpecifics = {
//             machineNo: currentFormData.machineNo,
//             standardSpecifications: {
//               // This is an object, not array
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
//             afterWashImage: imageUrls.afterWash // Single image for daily test
//           };
//         }

//         const now = new Date();
//         const inspectionTime = `${String(now.getHours()).padStart(
//           2,
//           "0"
//         )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
//           now.getSeconds()
//         ).padStart(2, "0")}`;

//         const payload = {
//           _id: currentFormData._id || undefined,
//           inspectionDate: currentFormData.inspectionDate, // Backend will format
//           moNo: currentFormData.moNo,
//           buyer: currentFormData.buyer,
//           buyerStyle: currentFormData.buyerStyle,
//           color: currentFormData.color,
//           remarks: currentFormData.remarks?.trim() || "NA", // Common remarks field
//           ...payloadSpecifics, // Add form-specific payload parts
//           emp_id: user.emp_id,
//           emp_kh_name: user.kh_name || "N/A",
//           emp_eng_name: user.eng_name || "N/A",
//           emp_dept_name: user.dept_name || "N/A",
//           emp_sect_name: user.sect_name || "N/A",
//           emp_job_title: user.job_title || "N/A",
//           inspectionTime: inspectionTime
//         };

//         const response = await axios.post(
//           `${API_BASE_URL}${endpoint}`,
//           payload
//         );
//         Swal.fire(
//           t("scc.success"),
//           response.data.message || t(successMessageKey),
//           "success"
//         );

//         const updatedRecord = response.data.data;
//         // Prepare data for state update based on form type
//         let stateUpdate = {
//           ...initialStateForReset, // Start with a clean slate for the specific form type
//           _id: updatedRecord._id,
//           moNo: updatedRecord.moNo,
//           color: updatedRecord.color,
//           buyer: currentFormData.buyer, // Preserve these as they are not in backend response typically
//           buyerStyle: currentFormData.buyerStyle,
//           inspectionDate: new Date(updatedRecord.inspectionDate), // Backend sends MM/DD/YYYY
//           remarks: updatedRecord.remarks === "NA" ? "" : updatedRecord.remarks
//         };

//         if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
//           stateUpdate.standardSpecification =
//             updatedRecord.standardSpecification.map((spec) => ({
//               ...spec,
//               tempOffset:
//                 spec.tempOffsetPlus !== 0
//                   ? String(spec.tempOffsetPlus)
//                   : spec.tempOffsetMinus !== 0
//                   ? String(spec.tempOffsetMinus)
//                   : "0",
//               remarks: spec.remarks === "NA" ? "" : spec.remarks
//             }));
//           stateUpdate.referenceSampleImageUrl =
//             updatedRecord.referenceSampleImage;
//           stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage;
//         } else if (formTypeToSubmit === "DailyTesting") {
//           stateUpdate.machineNo = updatedRecord.machineNo;
//           stateUpdate.standardSpecifications =
//             updatedRecord.standardSpecifications; // This is an object
//           stateUpdate.cycleWashingResults = updatedRecord.cycleWashingResults;
//           stateUpdate.numberOfRejections = updatedRecord.numberOfRejections;
//           stateUpdate.finalResult = updatedRecord.finalResult;
//           stateUpdate.afterWashImageUrl = updatedRecord.afterWashImage; // Single image
//         }
//         currentSetter(stateUpdate);
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
//     [htFormData, fuFormData, dailyTestingFormData, user, t, uploadSccImage] // Add dailyTestingFormData, uploadSccImage
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
//       <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
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

//         <div className="p-4 sm:p-6">
//           {CurrentFormComponent &&
//             activeTabData &&
//             !activeTabData.disabled &&
//             user && (
//               <CurrentFormComponent
//                 // Pass formType to the component so it knows what it is,
//                 // especially if one component instance handles multiple types.
//                 // For SCCFirstOutputForm, it already gets formType via props.
//                 // For SCCDailyTesting, it doesn't strictly need it if it only does one thing,
//                 // but passing it for consistency or future use is fine.
//                 formType={activeTabData.formType} // Pass formType here
//                 key={activeTabData.id} // Essential for re-rendering and using correct state
//                 formData={activeTabData.data}
//                 onFormDataChange={activeTabData.setter}
//                 onFormSubmit={handleFormSubmit} // The component will call this with its specific formType
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

import React, { useState, useCallback, useEffect } from "react"; // Added useEffect for one-time definitions
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import SCCFirstOutputForm from "../components/inspection/scc/SCCFirstOutputForm";
import SCCDailyTesting from "../components/inspection/scc/SCCDailyTesting";
import {
  FileText,
  ThermometerSun,
  CheckSquare,
  ShieldCheck,
  Settings2,
  Eye
} from "lucide-react";

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define uploadSccImage outside useCallback if it doesn't depend on frequently changing state
  // Or memoize it separately if it has its own dependencies.
  // For simplicity here, assuming it's stable enough or its dependency (t) is stable.
  const uploadSccImage = useCallback(
    async (file, currentData, imageTypeIdentifier) => {
      const imageFormData = new FormData();
      imageFormData.append("imageFile", file);
      imageFormData.append("moNo", currentData.moNo);
      imageFormData.append("color", currentData.color);
      imageFormData.append("imageType", imageTypeIdentifier);
      imageFormData.append(
        "inspectionDate",
        currentData.inspectionDate.toISOString().split("T")[0]
      );
      const imgRes = await axios.post(
        `${API_BASE_URL}/api/scc/upload-image`,
        imageFormData
      );
      if (!imgRes.data.success) {
        throw new Error(
          // `t` function reference is stable from useTranslation hook
          t(
            "scc.errorUploadingImageGeneric",
            `Failed to upload ${imageTypeIdentifier} image.`
          )
        );
      }
      return imgRes.data;
    },
    [t]
  ); // `t` is a stable function from `useTranslation`

  const tabs = React.useMemo(
    () => [
      // Memoize tabs array if its definition relies on state/props that don't change often
      {
        id: "firstOutputHT",
        labelKey: "scc.tabs.firstOutputHT",
        icon: <FileText size={16} />,
        formType: "HT",
        data: htFormData, // This will cause tabs to re-evaluate if htFormData changes
        setter: setHtFormData,
        component: SCCFirstOutputForm
      },
      {
        id: "firstOutputFU",
        labelKey: "scc.tabs.firstOutputFU",
        icon: <FileText size={16} />,
        formType: "FU",
        data: fuFormData, // This will cause tabs to re-evaluate if fuFormData changes
        setter: setFuFormData,
        component: SCCFirstOutputForm
      },
      {
        id: "dailyTesting",
        labelKey: "scc.tabs.dailyTesting",
        icon: <ThermometerSun size={16} />,
        formType: "DailyTesting",
        data: dailyTestingFormData, // This will cause tabs to re-evaluate if dailyTestingFormData changes
        setter: setDailyTestingFormData,
        component: SCCDailyTesting,
        disabled: false
      },
      {
        id: "dailyHTQC",
        labelKey: "scc.tabs.dailyHTQC",
        icon: <CheckSquare size={16} />,
        disabled: true
      },
      {
        id: "dailyFUQC",
        labelKey: "scc.tabs.dailyFUQC",
        icon: <ShieldCheck size={16} />,
        disabled: true
      },
      {
        id: "htInspection",
        labelKey: "scc.tabs.htInspection",
        icon: <Eye size={16} />,
        disabled: true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [htFormData, fuFormData, dailyTestingFormData, t]
  ); // Add t if labelKeys are dynamic based on language

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const CurrentFormComponent = activeTabData?.component;

  const handleFormSubmit = useCallback(
    async (formTypeToSubmit) => {
      let currentFormData,
        currentSetter,
        endpoint,
        successMessageKey,
        initialStateForReset;

      // Determine which form data and setter to use based on formTypeToSubmit
      // This ensures we are always using the latest version from the state
      // when the submit button (which calls this memoized function) is clicked.
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
      } else {
        console.error("Unknown form type in SCCPage submit:", formTypeToSubmit);
        Swal.fire(t("scc.error"), "Unknown form type.", "error");
        return;
      }

      if (!user) {
        Swal.fire(
          t("scc.error"),
          t("scc.userNotLoggedIn", "User not logged in. Please log in again."),
          "error"
        );
        return;
      }

      // === Basic Validation (common part) ===
      if (
        !currentFormData.inspectionDate ||
        !currentFormData.moNo ||
        !currentFormData.color
      ) {
        Swal.fire(
          t("scc.validationErrorTitle"),
          t(
            "scc.validationErrorBasic",
            "Please fill in Date, MO No, and Color."
          ),
          "warning"
        );
        return;
      }

      // === Form-Specific Validation ===
      let formIsValid = true;
      if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
        if (
          !currentFormData.standardSpecification ||
          currentFormData.standardSpecification.length < 2
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              "scc.validationErrorSpecIntegrity",
              "Specification data is incomplete."
            ),
            "warning"
          );
          formIsValid = false;
        }
        const firstSpec = currentFormData.standardSpecification?.[0];
        const afterHatSpec = currentFormData.standardSpecification?.[1];
        if (
          formIsValid &&
          (!firstSpec?.timeSec || !firstSpec?.tempC || !firstSpec?.pressure)
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("scc.validationErrorSpecFirst", "Fill 'First' spec fields."),
            "warning"
          );
          formIsValid = false;
        }
        if (
          formIsValid &&
          firstSpec?.status === "Reject" &&
          (!afterHatSpec?.timeSec ||
            !afterHatSpec?.tempC ||
            !afterHatSpec?.pressure)
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              "scc.validationErrorSpecAfterHat",
              "Fill 'After Hat' spec fields if 'First' is Reject."
            ),
            "warning"
          );
          formIsValid = false;
        }
        if (
          formIsValid &&
          !currentFormData.referenceSampleImageUrl &&
          !currentFormData.referenceSampleImageFile
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              "scc.validationErrorRefSample",
              "Reference Sample image required."
            ),
            "warning"
          );
          formIsValid = false;
        }
      } else if (formTypeToSubmit === "DailyTesting") {
        if (!currentFormData.machineNo) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t("sccdaily.validationErrorMachineNo", "Please select Machine No."),
            "warning"
          );
          formIsValid = false;
        }
        const specs = currentFormData.standardSpecifications;
        if (
          formIsValid &&
          (specs?.tempC === null ||
            specs?.tempC === "" ||
            specs?.timeSec === null ||
            specs?.timeSec === "" ||
            specs?.pressure === null ||
            specs?.pressure === "")
        ) {
          Swal.fire(
            t("scc.validationErrorTitle"),
            t(
              "sccdaily.validationErrorDailySpecs",
              "Fill Standard Spec fields for daily test."
            ),
            "warning"
          );
          formIsValid = false;
        }
      }
      if (!formIsValid) return;

      setIsSubmitting(true);
      try {
        let imageUrls = {
          referenceSample: currentFormData.referenceSampleImageUrl,
          afterWash: currentFormData.afterWashImageUrl
        };
        let payloadSpecifics = {};

        if (formTypeToSubmit === "HT" || formTypeToSubmit === "FU") {
          if (currentFormData.referenceSampleImageFile) {
            const imgRes = await uploadSccImage(
              currentFormData.referenceSampleImageFile,
              currentFormData,
              `referenceSample-${formTypeToSubmit}`
            );
            imageUrls.referenceSample = imgRes.filePath;
          }
          if (currentFormData.afterWashImageFile) {
            const imgRes = await uploadSccImage(
              currentFormData.afterWashImageFile,
              currentFormData,
              `afterWash-${formTypeToSubmit}`
            );
            imageUrls.afterWash = imgRes.filePath;
          }
          payloadSpecifics = {
            referenceSampleImage: imageUrls.referenceSample,
            afterWashImage: imageUrls.afterWash,
            standardSpecification: currentFormData.standardSpecification.map(
              (spec) => {
                const offsetVal = parseFloat(spec.tempOffset) || 0;
                return {
                  type: spec.type,
                  method: spec.method,
                  timeSec: spec.timeSec ? Number(spec.timeSec) : null,
                  tempC: spec.tempC ? Number(spec.tempC) : null,
                  tempOffsetMinus: offsetVal !== 0 ? -Math.abs(offsetVal) : 0,
                  tempOffsetPlus: offsetVal !== 0 ? Math.abs(offsetVal) : 0,
                  pressure: spec.pressure || null,
                  status: spec.status,
                  remarks: spec.remarks?.trim() || "NA"
                };
              }
            )
          };
        } else if (formTypeToSubmit === "DailyTesting") {
          if (currentFormData.afterWashImageFile) {
            const imgRes = await uploadSccImage(
              currentFormData.afterWashImageFile,
              currentFormData,
              "afterWashDaily"
            );
            imageUrls.afterWash = imgRes.filePath;
          }
          payloadSpecifics = {
            machineNo: currentFormData.machineNo,
            standardSpecifications: {
              tempC: currentFormData.standardSpecifications.tempC
                ? Number(currentFormData.standardSpecifications.tempC)
                : null,
              timeSec: currentFormData.standardSpecifications.timeSec
                ? Number(currentFormData.standardSpecifications.timeSec)
                : null,
              pressure: currentFormData.standardSpecifications.pressure || null
            },
            cycleWashingResults: currentFormData.cycleWashingResults || [],
            numberOfRejections: currentFormData.numberOfRejections || 0,
            finalResult: currentFormData.finalResult || "Pending",
            afterWashImage: imageUrls.afterWash
          };
        }

        const now = new Date();
        const inspectionTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        const payload = {
          _id: currentFormData._id || undefined,
          inspectionDate: currentFormData.inspectionDate,
          moNo: currentFormData.moNo,
          buyer: currentFormData.buyer,
          buyerStyle: currentFormData.buyerStyle,
          color: currentFormData.color,
          remarks: currentFormData.remarks?.trim() || "NA",
          ...payloadSpecifics,
          emp_id: user.emp_id,
          emp_kh_name: user.kh_name || "N/A",
          emp_eng_name: user.eng_name || "N/A",
          emp_dept_name: user.dept_name || "N/A",
          emp_sect_name: user.sect_name || "N/A",
          emp_job_title: user.job_title || "N/A",
          inspectionTime: inspectionTime
        };

        const response = await axios.post(
          `${API_BASE_URL}${endpoint}`,
          payload
        );
        Swal.fire(
          t("scc.success"),
          response.data.message || t(successMessageKey),
          "success"
        );

        const updatedRecord = response.data.data;
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
    // The critical change: `handleFormSubmit` now directly accesses the state variables
    // (htFormData, fuFormData, dailyTestingFormData) from the component's scope *when it is called*,
    // rather than relying on the versions captured when it was memoized.
    // The dependencies are for ensuring `useCallback` re-memoizes if `user`, `t`, or `uploadSccImage` change.
    // The state variables themselves are not direct dependencies here because we are selecting the
    // correct one *inside* the function.
    [user, t, uploadSccImage, htFormData, fuFormData, dailyTestingFormData] // Added form data states to deps
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
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
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

        <div className="p-4 sm:p-6">
          {CurrentFormComponent &&
            activeTabData &&
            !activeTabData.disabled &&
            user && (
              <CurrentFormComponent
                formType={activeTabData.formType}
                key={activeTabData.id}
                formData={activeTabData.data} // This now passes the LATEST state data
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
