// import React, { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import axios from "axios";
// import { Save, Loader2, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
// import { API_BASE_URL } from "../../../../../config";
// import YPivotQATemplatesHeader from "../QATemplates/YPivotQATemplatesHeader";

// // ==============================================================================
// // INTERNAL COMPONENT: AUTO-DISMISS STATUS MODAL
// // ==============================================================================
// const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
//   useEffect(() => {
//     if (isOpen) {
//       const timer = setTimeout(() => {
//         onClose();
//       }, 1200); // Auto close after 1.2 seconds
//       return () => clearTimeout(timer);
//     }
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   const isSuccess = type === "success";

//   return createPortal(
//     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
//         <div
//           className={`p-3 rounded-full ${
//             isSuccess
//               ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
//               : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
//           }`}
//         >
//           {isSuccess ? (
//             <CheckCircle2 className="w-8 h-8" />
//           ) : (
//             <AlertCircle className="w-8 h-8" />
//           )}
//         </div>
//         <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
//           {isSuccess ? "Success" : "Error"}
//         </h3>
//         <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
//           {message}
//         </p>
//       </div>
//     </div>,
//     document.body
//   );
// };

// // ==============================================================================
// // MAIN COMPONENT
// // ==============================================================================
// const YPivotQAInspectionHeaderDataSave = ({
//   headerData,
//   onUpdateHeaderData,
//   reportId,
//   isReportSaved,
//   onSaveSuccess
// }) => {
//   const [saving, setSaving] = useState(false);
//   const [loadingData, setLoadingData] = useState(false);

//   // NEW: Track if we are in Update mode based on loaded data
//   const [isUpdateMode, setIsUpdateMode] = useState(false);

//   // NEW: State for the status modal
//   const [statusModal, setStatusModal] = useState({
//     isOpen: false,
//     type: "success", // 'success' or 'error'
//     message: ""
//   });

//   // --- FETCH EXISTING DATA ON MOUNT OR ID CHANGE ---
//   useEffect(() => {
//     const fetchExistingHeaderData = async () => {
//       if (!reportId) return;

//       setLoadingData(true);
//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
//         );

//         if (res.data.success && res.data.data.headerData) {
//           const backendHeaderData = res.data.data.headerData;

//           // LOGIC: If backend returns non-empty array, set button to Update
//           if (
//             Array.isArray(backendHeaderData) &&
//             backendHeaderData.length > 0
//           ) {
//             setIsUpdateMode(true);
//           } else {
//             setIsUpdateMode(false);
//           }

//           const newSelectedOptions = {};
//           const newRemarks = {};
//           const newCapturedImages = {};

//           backendHeaderData.forEach((section) => {
//             const secId = section.headerId;

//             if (section.selectedOption)
//               newSelectedOptions[secId] = section.selectedOption;
//             if (section.remarks) newRemarks[secId] = section.remarks;

//             if (section.images && section.images.length > 0) {
//               section.images.forEach((img, idx) => {
//                 const key = `${secId}_${idx}`;

//                 // If imageURL exists and is relative (starts with /), prepend API_BASE_URL
//                 let displayUrl = img.imageURL;
//                 if (
//                   displayUrl &&
//                   !displayUrl.startsWith("http") &&
//                   !displayUrl.startsWith("data:")
//                 ) {
//                   displayUrl = `${API_BASE_URL}${displayUrl}`;
//                 }

//                 newCapturedImages[key] = {
//                   id: img.imageId,
//                   url: displayUrl, // Full URL for valid <img> src
//                   imgSrc: displayUrl, // For editor preview
//                   history: []
//                 };
//               });
//             }
//           });

//           onUpdateHeaderData(
//             {
//               selectedOptions: newSelectedOptions,
//               remarks: newRemarks,
//               capturedImages: newCapturedImages
//             },
//             { isFromBackend: true }
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching existing header data:", error);
//       } finally {
//         setLoadingData(false);
//       }
//     };

//     // Check if we should load data
//     const hasData = Object.keys(headerData.selectedOptions || {}).length > 0;

//     // Always check for update mode even if we have local data (e.g. from QR scan)
//     // But only fetch if we don't have it, or if we want to ensure sync
//     if (reportId) {
//       // If headerData is empty, definitely fetch
//       if (!hasData) {
//         fetchExistingHeaderData();
//       } else {
//         // If we have data (e.g. from QR), we assume it came from DB, so it's update mode
//         setIsUpdateMode(true);
//       }
//     }
//   }, [reportId]);

//   // --- SAVE HANDLER ---
//   const handleSaveHeaderData = async () => {
//     if (!isReportSaved || !reportId) {
//       setStatusModal({
//         isOpen: true,
//         type: "error",
//         message: "Please save Order information first."
//       });
//       return;
//     }

//     setSaving(true);
//     try {
//       const sectionsRes = await axios.get(
//         `${API_BASE_URL}/api/qa-sections-home`
//       );
//       const sections = sectionsRes.data.data;

//       const payloadData = sections.map((section) => {
//         const secId = section._id;

//         const sectionImages = Object.keys(headerData.capturedImages || {})
//           .filter((k) => k.startsWith(`${secId}_`))
//           .map((k) => {
//             const img = headerData.capturedImages[k];

//             let payloadImageURL = null;
//             let payloadImgSrc = null;

//             if (img.url.startsWith("data:")) {
//               // Case A: New Image (Base64)
//               payloadImgSrc = img.url;
//               payloadImageURL = null;
//             } else {
//               // Case B: Existing Image (Full URL)
//               payloadImageURL = img.url.replace(API_BASE_URL, "");
//               payloadImgSrc = null;
//             }

//             return {
//               id: img.id || k,
//               imageURL: payloadImageURL,
//               imgSrc: payloadImgSrc
//             };
//           });

//         return {
//           headerId: secId,
//           name: section.MainTitle,
//           selectedOption: (headerData.selectedOptions || {})[secId] || "",
//           remarks: (headerData.remarks || {})[secId] || "",
//           images: sectionImages
//         };
//       });

//       const res = await axios.post(
//         `${API_BASE_URL}/api/fincheck-inspection/update-header-data`,
//         {
//           reportId: reportId,
//           headerData: payloadData
//         }
//       );

//       if (res.data.success) {
//         // Switch to Update Mode immediately upon success
//         setIsUpdateMode(true);

//         // CALL onSaveSuccess TO MARK SECTION AS CLEAN
//         if (onSaveSuccess) {
//           onSaveSuccess(); // <-- ADD THIS
//         }

//         setStatusModal({
//           isOpen: true,
//           type: "success",
//           message: isUpdateMode
//             ? "Header Data Updated Successfully!"
//             : "Header Data Saved Successfully!"
//         });
//       }
//     } catch (error) {
//       console.error("Error saving header data:", error);
//       setStatusModal({
//         isOpen: true,
//         type: "error",
//         message: "Failed to save header data."
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loadingData) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
//         <span className="ml-3 text-gray-600 font-medium">
//           Loading existing data...
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div className="relative pb-24">
//       {/* 1. UI Component */}
//       <YPivotQATemplatesHeader
//         headerData={headerData}
//         onUpdateHeaderData={onUpdateHeaderData}
//       />

//       {/* 2. Floating Save/Update Button */}
//       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
//         <div className="max-w-5xl mx-auto flex justify-end">
//           <button
//             onClick={handleSaveHeaderData}
//             disabled={!isReportSaved || saving}
//             className={`
//               flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
//               ${
//                 !isReportSaved
//                   ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
//                   : isUpdateMode
//                   ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white" // Update Colors
//                   : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" // Save Colors
//               }
//             `}
//             title={
//               !isReportSaved
//                 ? "Save Order Data first"
//                 : isUpdateMode
//                 ? "Update existing header data"
//                 : "Save new header data"
//             }
//           >
//             {saving ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 {isUpdateMode ? "Updating..." : "Saving..."}
//               </>
//             ) : (
//               <>
//                 {isUpdateMode ? (
//                   <Edit3 className="w-5 h-5" />
//                 ) : (
//                   <Save className="w-5 h-5" />
//                 )}
//                 {isUpdateMode ? "Update Header Data" : "Save Header Data"}
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* 3. Status Modal */}
//       <AutoDismissModal
//         isOpen={statusModal.isOpen}
//         onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
//         type={statusModal.type}
//         message={statusModal.message}
//       />
//     </div>
//   );
// };

// export default YPivotQAInspectionHeaderDataSave;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Cloud,
  RefreshCw
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesHeader from "../QATemplates/YPivotQATemplatesHeader";

// ==============================================================================
// HELPER: Convert Blob URL to Base64
// This bridges the gap between the new Editor (Blob) and the Controller (Base64)
// ==============================================================================
const blobToBase64 = async (blobUrl) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting blob to base64:", error);
    return null;
  }
};

// ==============================================================================
// INTERNAL COMPONENT: AUTO-DISMISS STATUS MODAL
// ==============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200); // Auto close after 1.2 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQAInspectionHeaderDataSave = ({
  headerData,
  onUpdateHeaderData,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false); // For Manual Button Spinner
  const [autoSaving, setAutoSaving] = useState(false); // For subtle auto-save indicator
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);

  // Store the JSON string of the last successfully saved data to prevent loops
  const lastSavedPayload = useRef("");

  // Ref to track timeout for debouncing
  const autoSaveTimeoutRef = useRef(null);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // --- 1. FETCH SECTIONS CONFIG ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qa-sections-home`);
        if (res.data.success) {
          setSectionsList(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching sections:", err);
      }
    };
    fetchSections();
  }, []);

  // --- 2. FETCH EXISTING REPORT DATA ---
  useEffect(() => {
    const fetchExistingHeaderData = async () => {
      if (!reportId) return;

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.headerData) {
          const backendHeaderData = res.data.data.headerData;

          if (
            Array.isArray(backendHeaderData) &&
            backendHeaderData.length > 0
          ) {
            setIsUpdateMode(true);
          }

          const newSelectedOptions = {};
          const newRemarks = {};
          const newCapturedImages = {};

          backendHeaderData.forEach((section) => {
            const secId = section.headerId;
            if (section.selectedOption)
              newSelectedOptions[secId] = section.selectedOption;
            if (section.remarks) newRemarks[secId] = section.remarks;

            if (section.images && section.images.length > 0) {
              section.images.forEach((img, idx) => {
                const key = `${secId}_${idx}`;
                let displayUrl = img.imageURL;
                if (
                  displayUrl &&
                  !displayUrl.startsWith("http") &&
                  !displayUrl.startsWith("data:")
                ) {
                  displayUrl = `${API_BASE_URL}${displayUrl}`;
                }
                newCapturedImages[key] = {
                  id: img.imageId,
                  url: displayUrl,
                  imgSrc: displayUrl,
                  history: []
                };
              });
            }
          });

          // Update Parent State (Backend Data)
          onUpdateHeaderData(
            {
              selectedOptions: newSelectedOptions,
              remarks: newRemarks,
              capturedImages: newCapturedImages
            },
            { isFromBackend: true }
          );

          // Prepare clean payload for comparison (ignore base64/blobs for hash check)
          if (sectionsList.length > 0) {
            // We use a simplified payload for comparison to avoid large string ops
            const simplePayload = generateSimplePayload(
              sectionsList,
              newSelectedOptions,
              newRemarks,
              Object.keys(newCapturedImages)
            );
            lastSavedPayload.current = JSON.stringify(simplePayload);
          }
        }
      } catch (error) {
        console.error("Error fetching existing header data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId && sectionsList.length > 0) {
      const hasData = Object.keys(headerData.selectedOptions || {}).length > 0;
      if (!hasData) {
        fetchExistingHeaderData();
      } else {
        setIsUpdateMode(true);
        // Sync ref if we already have data
        const simplePayload = generateSimplePayload(
          sectionsList,
          headerData.selectedOptions,
          headerData.remarks,
          Object.keys(headerData.capturedImages || {})
        );
        lastSavedPayload.current = JSON.stringify(simplePayload);
      }
    }
  }, [reportId, sectionsList.length]);

  // --- HELPER: Generate Simple Payload for Change Detection (Not for saving) ---
  const generateSimplePayload = (sections, options, remarks, imageKeys) => {
    return sections.map((section) => ({
      headerId: section._id,
      selectedOption: (options || {})[section._id] || "",
      remarks: (remarks || {})[section._id] || "",
      imageCount: imageKeys.filter((k) => k.startsWith(`${section._id}_`))
        .length
    }));
  };

  // --- 3. HELPER: ASYNC PAYLOAD GENERATION (Converts Blobs to Base64) ---
  const generatePayloadAsync = async (sections, currentData) => {
    // We use Promise.all to handle image conversions in parallel
    const processedSections = await Promise.all(
      sections.map(async (section) => {
        const secId = section._id;

        // Get all image keys for this section
        const imageKeys = Object.keys(currentData.capturedImages || {}).filter(
          (k) => k.startsWith(`${secId}_`)
        );

        // Process images one by one
        const sectionImages = await Promise.all(
          imageKeys.map(async (k) => {
            const img = currentData.capturedImages[k];
            let payloadImageURL = null;
            let payloadImgSrc = null;

            // 1. Check if it is a NEW image (Blob URL from Editor)
            if (img.url.startsWith("blob:")) {
              // CONVERT BLOB TO BASE64
              // This allows the existing Controller logic to save it to disk
              payloadImgSrc = await blobToBase64(img.url);
              payloadImageURL = null;
            }
            // 2. Check if it is Base64 (legacy fallback)
            else if (img.url.startsWith("data:")) {
              payloadImgSrc = img.url;
              payloadImageURL = null;
            }
            // 3. Existing Image (Server Path)
            else {
              // Strip base URL to save relative path
              payloadImageURL = img.url.replace(API_BASE_URL, "");
              payloadImgSrc = null;
            }

            return {
              id: img.id || k,
              imageURL: payloadImageURL, // Null for new, Path for existing
              imgSrc: payloadImgSrc // Base64 for new, Null for existing
            };
          })
        );

        return {
          headerId: secId,
          name: section.MainTitle,
          selectedOption: (currentData.selectedOptions || {})[secId] || "",
          remarks: (currentData.remarks || {})[secId] || "",
          images: sectionImages
        };
      })
    );

    return processedSections;
  };

  // --- 4. CORE SAVE FUNCTION ---
  const handleSaveHeaderData = async (isManual = true) => {
    if (!isReportSaved || !reportId || sectionsList.length === 0) {
      if (isManual) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Cannot save. Missing report info."
        });
      }
      return;
    }

    // 1. Generate Check Payload (Fast, no conversion)
    const checkPayload = generateSimplePayload(
      sectionsList,
      headerData.selectedOptions,
      headerData.remarks,
      Object.keys(headerData.capturedImages || {})
    );
    const payloadString = JSON.stringify(checkPayload);

    // 2. Check if data actually changed
    if (payloadString === lastSavedPayload.current) {
      if (isManual) {
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Data is up to date!"
        });
      }
      return;
    }

    // 3. Set Loading States
    if (isManual) setSaving(true);
    else setAutoSaving(true);

    try {
      // 4. Generate ACTUAL Payload (Slow, converts Blobs to Base64)
      const payloadData = await generatePayloadAsync(sectionsList, headerData);

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-header-data`,
        {
          reportId: reportId,
          headerData: payloadData
        }
      );

      if (res.data.success) {
        setIsUpdateMode(true);

        // Update our reference
        lastSavedPayload.current = payloadString;

        if (onSaveSuccess) onSaveSuccess();

        // Show Modal only if Manual Click
        if (isManual) {
          setStatusModal({
            isOpen: true,
            type: "success",
            message: isUpdateMode
              ? "Header Data Updated Successfully!"
              : "Header Data Saved Successfully!"
          });
        }
      }
    } catch (error) {
      console.error("Error saving header data:", error);
      if (isManual) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Failed to save header data."
        });
      }
    } finally {
      if (isManual) setSaving(false);
      else setAutoSaving(false);
    }
  };

  // --- 5. AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (!isReportSaved || !reportId || loadingData || sectionsList.length === 0)
      return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSaveHeaderData(false); // Silent Mode
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [headerData, isReportSaved, reportId, loadingData, sectionsList]);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing data...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. UI Component */}
      <YPivotQATemplatesHeader
        headerData={headerData}
        onUpdateHeaderData={onUpdateHeaderData}
      />

      {/* 2. Floating Save/Update Button (Manual Override) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-2">
            {autoSaving ? (
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving changes...
              </div>
            ) : lastSavedPayload.current ? (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                <Cloud className="w-3.5 h-3.5" />
                All changes saved
              </div>
            ) : null}
          </div>

          <button
            onClick={() => handleSaveHeaderData(true)}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                !isReportSaved
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              }
            `}
            title="Manual Save"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isUpdateMode ? (
                  <Edit3 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdateMode ? "Update Header Data" : "Save Header Data"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Status Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionHeaderDataSave;
