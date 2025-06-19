// import React, { useEffect, useRef, useState, useCallback } from "react";
// import {
//   AlertCircle,
//   ArrowLeft,
//   ArrowUpDown,
//   CheckCircle,
//   Eye,
//   Filter,
//   Loader2,
//   Menu,
//   Printer,
//   QrCode,
//   Tag,
//   XCircle,
//   Languages,
//   Paperclip,
//   ClipboardCheck,
//   Redo,
//   Database
// } from "lucide-react";
// import BluetoothComponent from "../components/forms/Bluetooth";
// import QRCodePreview from "../components/forms/QRCodePreview";
// import Scanner from "../components/forms/Scanner";
// import DefectBox from "../components/inspection/DefectBox";
// import { allDefects, defectsList } from "../constants/defects";
// import { API_BASE_URL } from "../../config";
// import { useAuth } from "../components/authentication/AuthContext";
// import DefectNames from "../components/inspection/DefectNames";
// import DefectPrint from "../components/inspection/DefectPrint";
// import EditInspection from "../components/inspection/EditInspection";
// import QC2Data from "../components/inspection/QC2Data";
// import { useBluetooth } from "../components/context/BluetoothContext";
// import { useTranslation } from "react-i18next";
// import i18next from "i18next";
// import Swal from "sweetalert2";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   TableContainer,
//   Paper,
//   Button
// } from "@mui/material";

// const QC2InspectionPage = () => {
//   const { t } = useTranslation();
//   const currentLanguage = i18next.language;
//   const { user, loading } = useAuth();
//   const { bluetoothState } = useBluetooth();
//   const [error, setError] = useState(null);
//   const [bundleData, setBundleData] = useState(null);
//   const [loadingData, setLoadingData] = useState(false);
//   const [tempDefects, setTempDefects] = useState({});
//   const [confirmedDefects, setConfirmedDefects] = useState({});
//   const [bundlePassed, setBundlePassed] = useState(false);
//   const [rejectedOnce, setRejectedOnce] = useState(false);
//   const [scanning, setScanning] = useState(false);
//   const [totalPass, setTotalPass] = useState(0);
//   const [totalRejects, setTotalRejects] = useState(0);
//   const [totalRepair, setTotalRepair] = useState(0);
//   const [activeTab, setActiveTab] = useState("first");
//   const [inDefectWindow, setInDefectWindow] = useState(false);
//   const [sortOption, setSortOption] = useState("alphaAsc");
//   const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
//   const [navOpen, setNavOpen] = useState(false);
//   const [selectedFeature, setSelectedFeature] = useState(null);
//   const [language, setLanguage] = useState("khmer");
//   const [menuClicked, setMenuClicked] = useState(false);
//   const [defectTypeFilter, setDefectTypeFilter] = useState("all");
//   const [categoryFilter, setCategoryFilter] = useState("");
//   const [qrCodesData, setQrCodesData] = useState({
//     repair: [],
//     garment: [],
//     bundle: []
//   });
//   const [showQRPreview, setShowQRPreview] = useState(false);
//   const [printing, setPrinting] = useState(false);
//   const [generateQRDisabled, setGenerateQRDisabled] = useState(false);
//   const [printMethod, setPrintMethod] = useState("bundle");
//   const [rejectedGarments, setRejectedGarments] = useState([]);
//   const [passBundleCountdown, setPassBundleCountdown] = useState(null);
//   const [isReturnInspection, setIsReturnInspection] = useState(false);
//   const [sessionData, setSessionData] = useState(null);
//   const [defectTrackingDetails, setDefectTrackingDetails] = useState(null); // New state for defect tracking details
//   const [repairStatuses, setRepairStatuses] = useState({});
//   const [showDefectBoxes, setShowDefectBoxes] = useState(!isReturnInspection); // New state for toggling defect boxes visibility
//   const bluetoothRef = useRef();
//   const isBluetoothConnected = bluetoothState.isConnected;
//   const activeFilter = categoryFilter || defectTypeFilter;
//   const [lockedGarments, setLockedGarments] = useState(new Set());
//   const [rejectedGarmentNumbers, setRejectedGarmentNumbers] = useState(
//     new Set()
//   );
//   const [lockedDefects, setLockedDefects] = useState(new Set());
//   const [rejectedGarmentDefects, setRejectedGarmentDefects] = useState(
//     new Set()
//   ); // New state to track rejected garment defects
//   const [selectedGarment, setSelectedGarment] = useState(null);
//   const [isPassingBundle, setIsPassingBundle] = useState(false);
//   const [locallyRejectedDefects, setLocallyRejectedDefects] = useState(
//     new Set()
//   );

//   const categoryOptions = [
//     "fabric",
//     "workmanship",
//     "cleanliness",
//     "embellishment",
//     "measurement",
//     "washing",
//     "finishing",
//     "miscellaneous"
//   ];

//   const defectTypes = ["all", "common", "type1", "type2"];

//   const defectQty = isReturnInspection
//     ? sessionData?.sessionDefectsQty || 0
//     : Object.values(confirmedDefects).reduce((a, b) => a + b, 0);

//   const hasDefects = Object.values(tempDefects).some((count) => count > 0);

//   useEffect(() => {
//     if (activeTab === "first" && !inDefectWindow && !scanning) {
//       handleStartScanner();
//     }
//   }, [activeTab, inDefectWindow, scanning]);

//   useEffect(() => {
//     if (bundleData && !isReturnInspection) {
//       setTotalPass(bundleData.passQtyIron || 0);
//       setTotalRejects(0);
//       setTotalRepair(0);
//       setConfirmedDefects({});
//       setTempDefects({});
//       setBundlePassed(false);
//       setRejectedOnce(false);
//       setInDefectWindow(true);
//       setScanning(false);
//       setRejectedGarments([]);
//       setQrCodesData({ repair: [], garment: [], bundle: [] });
//       setGenerateQRDisabled(false);
//       setIsReturnInspection(false);
//       setSessionData(null);
//     }
//   }, [bundleData]);

//   useEffect(() => {
//     if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
//       setRejectedOnce(false);
//     }
//   }, [tempDefects, rejectedOnce]);

//   useEffect(() => {
//     let timer;
//     if (passBundleCountdown !== null && !isPassingBundle) {
//       // Add !isPassingBundle
//       if (passBundleCountdown > 0) {
//         timer = setInterval(() => {
//           setPassBundleCountdown((prev) => prev - 1);
//         }, 1000);
//       } else {
//         handlePassBundle(); // Trigger only if not already passing
//         setPassBundleCountdown(null);
//       }
//     }
//     return () => clearInterval(timer);
//   }, [passBundleCountdown, isPassingBundle]); // Add isPassingBundle as dependency

//   const generateDefectId = () => {
//     return Math.random().toString(36).substring(2, 12).toUpperCase();
//   };

//   const generateGarmentDefectId = () => {
//     return Math.floor(1000000000 + Math.random() * 9000000000).toString();
//   };

//   const computeDefectArray = () => {
//     const englishDefectItems = defectsList["english"];
//     return Object.keys(confirmedDefects)
//       .filter((key) => confirmedDefects[key] > 0)
//       .map((key) => ({
//         defectName: englishDefectItems[key]?.name || "Unknown",
//         totalCount: confirmedDefects[key]
//       }));
//   };

//   const groupDefectsByRepair = () => {
//     const groups = {};
//     Object.entries(confirmedDefects).forEach(([index, count]) => {
//       const defect = allDefects[parseInt(index)];
//       if (!defect || count === 0) return;
//       const repair = defect.repair;
//       if (!groups[repair]) {
//         groups[repair] = { defects: [], totalCount: 0, defectChunks: [] };
//       }
//       groups[repair].defects.push({ defectName: defect.english, count });
//       groups[repair].totalCount += count;
//     });
//     Object.values(groups).forEach((group) => {
//       const chunkSize = 3;
//       let tempDefects = [];
//       let countPrint = 0;
//       group.defects.forEach((defect) => {
//         tempDefects.push(defect);
//         countPrint += defect.count;
//         if (tempDefects.length === chunkSize) {
//           group.defectChunks.push({
//             defects: tempDefects,
//             count_print: countPrint
//           });
//           tempDefects = [];
//           countPrint = 0;
//         }
//       });
//       if (tempDefects.length > 0) {
//         group.defectChunks.push({
//           defects: tempDefects,
//           count_print: countPrint
//         });
//       }
//     });
//     return groups;
//   };

//   const groupRejectedGarmentsForBundle = () => {
//     const maxLinesPerPaper = 7;
//     const chunks = [];
//     let currentChunk = [];
//     let currentLineCount = 0;
//     rejectedGarments.forEach((garment) => {
//       const defectCount = garment.defects.length;
//       const linesNeeded = defectCount > 6 ? 7 : defectCount;
//       if (
//         currentLineCount + linesNeeded > maxLinesPerPaper &&
//         currentChunk.length > 0
//       ) {
//         chunks.push(currentChunk);
//         currentChunk = [];
//         currentLineCount = 0;
//       }
//       currentChunk.push(garment);
//       currentLineCount += linesNeeded;
//     });
//     if (currentChunk.length > 0) {
//       chunks.push(currentChunk);
//     }
//     return chunks;
//   };

//   const handleStartScanner = () => {
//     setScanning(true);
//     setInDefectWindow(false);
//   };

//   const fetchBundleData = useCallback(async (randomId) => {
//     try {
//       setLoadingData(true);
//       const response = await fetch(
//         `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
//       );
//       if (!response.ok) throw new Error("Bundle not found");
//       const data = await response.json();

//       // Check if the bundle has been ironed by looking in the inspectionFirst array
//       const ironingEntry = data.inspectionFirst?.find(
//         (entry) => entry.process === "ironing"
//       );

//       if (!ironingEntry) {
//         setError(
//           "This bundle has not been ironed yet. Please wait until it is ironed."
//         );
//         setBundleData(null);
//         setInDefectWindow(false);
//         setScanning(false);
//       } else {
//         const passQtyIron = ironingEntry.passQty || 0;

//         // Prepare the initial payload for inspection
//         const initialPayload = {
//           package_no: data.package_no,
//           moNo: data.selectedMono,
//           custStyle: data.custStyle,
//           color: data.color,
//           size: data.size,
//           lineNo: data.lineNo,
//           department: data.department,
//           buyer: data.buyer,
//           factory: data.factory,
//           country: data.country,
//           sub_con: data.sub_con,
//           sub_con_factory: data.sub_con_factory,
//           checkedQty: passQtyIron,
//           totalPass: passQtyIron,
//           totalRejects: 0,
//           totalRepair: 0,
//           defectQty: 0,
//           defectArray: [],
//           rejectGarments: [],
//           inspection_time: "",
//           inspection_date: new Date().toLocaleDateString("en-US"),
//           emp_id_inspection: user.emp_id,
//           eng_name_inspection: user.eng_name,
//           kh_name_inspection: user.kh_name,
//           job_title_inspection: user.job_title,
//           dept_name_inspection: user.dept_name,
//           sect_name_inspection: user.sect_name,
//           bundle_id: data.bundle_id,
//           bundle_random_id: data.bundle_random_id,
//           printArray: []
//         };

//         // Save the initial inspection record
//         const createResponse = await fetch(
//           `${API_BASE_URL}/api/inspection-pass-bundle`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(initialPayload)
//           }
//         );
//         if (!createResponse.ok)
//           throw new Error("Failed to create inspection record");

//         setBundleData({ ...data, passQtyIron }); // Add passQtyIron to bundleData for consistency
//         setTotalRepair(0);
//         setInDefectWindow(true);
//         setScanning(false);
//         setError(null);
//       }
//     } catch (err) {
//       setError(err.message || "Failed to fetch bundle data");
//       setBundleData(null);
//     } finally {
//       setLoadingData(false);
//     }
//   });

//   const handleDefectCardScan = useCallback(
//     async (bundleData, defect_print_id) => {
//       try {
//         const printEntry = bundleData.printArray.find(
//           (entry) =>
//             entry.defect_print_id === defect_print_id && !entry.isCompleted
//         );
//         if (!printEntry) {
//           throw new Error(
//             "This defect card is already completed or does not exist"
//           );
//         }

//         const maxInspectionNo =
//           (printEntry.repairGarmentsDefects?.length > 0
//             ? Math.max(
//                 ...printEntry.repairGarmentsDefects.map((r) => r.inspectionNo)
//               )
//             : 1) || 1;
//         const inspectionNo = maxInspectionNo + 1;
//         const newSessionData = {
//           bundleData,
//           printEntry,
//           totalRejectGarmentCount: printEntry.totalRejectGarmentCount,
//           initialTotalPass: printEntry.totalRejectGarmentCount,
//           sessionTotalPass: printEntry.totalRejectGarmentCount,
//           sessionTotalRejects: 0,
//           sessionDefectsQty: 0,
//           sessionRejectedGarments: [],
//           inspectionNo
//         };
//         setSessionData(newSessionData);
//         setBundleData(bundleData);
//         setTotalPass(printEntry.totalRejectGarmentCount);
//         setTotalRejects(0);
//         setTotalRepair(bundleData.totalRepair);
//         setIsReturnInspection(true);
//         setInDefectWindow(true);
//         setScanning(false);
//         setError(null);

//         // Fetch repair tracking details (defect card details)
//         const trackingResponse = await fetch(
//           `${API_BASE_URL}/api/defect-track/${defect_print_id}`
//         );
//         if (!trackingResponse.ok) {
//           throw new Error("Failed to fetch defect tracking details");
//         }
//         const trackingData = await trackingResponse.json();
//         setDefectTrackingDetails(trackingData);
//         setIsReturnInspection(true); // Mark this as a return inspection

//         // Initialize repair statuses for each defect
//         const initialStatuses = {};
//         const initialLockedDefects = new Set(); // Initialize a set for locked defects
//         // const initialLockedGarments = new Set(); // Initialize a set for locked garments
//         const initialRejectedGarmentDefects = new Set(); // Initialize a set for rejected garment defects

//         trackingData.garments.forEach((garment) => {
//           garment.defects.forEach((defect) => {
//             const key = `${garment.garmentNumber}-${defect.name}`;
//             initialStatuses[key] = defect.status || "Fail";
//             // Lock defects that are already "Fail"
//             if (defect.status === "Fail") {
//               initialLockedDefects.add(key);
//               initialRejectedGarmentDefects.add(garment.garmentNumber);
//               // initialLockedGarments.add(garment.garmentNumber);
//             }
//           });
//         });

//         setRepairStatuses(initialStatuses); // Track repair status changes
//         setLockedDefects(initialLockedDefects); // Set the initial locked defects
//         // setLockedGarments(initialLockedGarments); // Set the initial locked garments
//         setRejectedGarmentDefects(initialRejectedGarmentDefects); // Set the initial rejected garment defects
//       } catch (err) {
//         setError(err.message);
//         setInDefectWindow(false);
//         setScanning(false);
//       }
//     },
//     []
//   );

//   const handleDefectStatusToggle = (garmentNumber, defectName) => {
//     const key = `${garmentNumber}-${defectName}`;

//     if (rejectedGarmentDefects.has(garmentNumber)) {
//       return;
//     }
//     // Check if the defect is locked
//     if (lockedDefects.has(key)) {
//       Swal.fire({
//         icon: "error",
//         title: "Defect Locked",
//         text: "This defect is locked and cannot be changed."
//       });
//       return;
//     }

//     // Check if a garment is already selected
//     if (
//       selectedGarment &&
//       selectedGarment !== garmentNumber &&
//       Object.keys(tempDefects).length > 0
//     ) {
//       Swal.fire({
//         icon: "error",
//         title: "Pending Defects",
//         text: "Please reject or clear defects for the selected garment first."
//       });
//       return;
//     }

//     setSelectedGarment(garmentNumber);

//     // Determine the new status
//     const currentStatus = repairStatuses[key];
//     const newStatus = currentStatus === "OK" ? "Fail" : "OK";

//     // Update repairStatuses
//     setRepairStatuses((prev) => ({
//       ...prev,
//       [key]: newStatus
//     }));

//     // Update defectTrackingDetails
//     setDefectTrackingDetails((prev) => {
//       if (!prev) return prev;

//       const updatedGarments = prev.garments.map((garment) => {
//         if (garment.garmentNumber === garmentNumber) {
//           const updatedDefects = garment.defects.map((defect) => {
//             if (defect.name === defectName) {
//               const now = new Date();
//               let newPassBundleStatus = defect.pass_bundle;
//               // Update tempDefects state based on the actual defect count
//               setTempDefects((prevTempDefects) => {
//                 const defectIndex = allDefects.findIndex(
//                   (d) => d.english === defectName
//                 );
//                 if (defectIndex === -1) return prevTempDefects;

//                 const newTempDefects = { ...prevTempDefects };
//                 if (newStatus === "Fail") {
//                   // When marking as fail, add the original defect count
//                   newTempDefects[defectIndex] = defect.count;
//                   setRejectedOnce(true);
//                   setRejectedGarmentDefects((prev) =>
//                     new Set(prev).add(garmentNumber)
//                   );
//                 } else {
//                   // When marking as OK, remove the defect count
//                   delete newTempDefects[defectIndex];
//                   setRejectedGarmentDefects((prev) => {
//                     const newRejected = new Set(prev);
//                     newRejected.delete(garmentNumber);
//                     return newRejected;
//                   });
//                 }
//                 return newTempDefects;
//               });
//               if (newStatus === "Fail") {
//                 newPassBundleStatus = "Fail";
//                 setLockedDefects((prevLocked) => new Set(prevLocked).add(key));
//               } else if (newStatus === "OK") {
//                 // Only change to "Not Checked" if it was previously "Fail"
//                 if (defect.status === "Fail") {
//                   newPassBundleStatus = "Not Checked";
//                   setLockedDefects((prevLocked) => {
//                     const newLocked = new Set(prevLocked);
//                     newLocked.delete(key);
//                     return newLocked;
//                   });
//                 }
//               }
//               // Call the function to update the defect status on qc2_repair_tracking
//               updateDefectStatusInRepairTrackingAndPassBundle(
//                 sessionData.printEntry.defect_print_id,
//                 garmentNumber,
//                 defect.name,
//                 newStatus,
//                 newPassBundleStatus
//               );
//               return {
//                 ...defect,
//                 status: newStatus,
//                 repair_date:
//                   newStatus === "OK" ? now.toLocaleDateString("en-US") : "",
//                 repair_time:
//                   newStatus === "OK"
//                     ? now.toLocaleTimeString("en-US", { hour12: false })
//                     : "",
//                 pass_bundle: newPassBundleStatus
//               };
//             }
//             return defect;
//           });
//           return { ...garment, defects: updatedDefects };
//         }
//         return garment;
//       });

//       // Update total counts
//       let totalRejected = 0;
//       let totalPassed = 0;
//       let totalDefects = 0;

//       updatedGarments.forEach((garment) => {
//         const hasFail = garment.defects.some(
//           (defect) => defect.status === "Fail"
//         );
//         if (hasFail) {
//           totalRejected++;
//           // Sum up defect counts for failed items
//           garment.defects.forEach((defect) => {
//             if (defect.status === "Fail") {
//               totalDefects += defect.count;
//             }
//           });
//         } else {
//           totalPassed++;
//         }
//       });

//       return { ...prev, garments: updatedGarments };
//     });
//   };

//   const updateDefectStatusInRepairTracking = async (
//     defect_print_id,
//     garmentNumber,
//     defectName,
//     status
//   ) => {
//     try {
//       const payload = {
//         defect_print_id,
//         garmentNumber,
//         defectName,
//         status
//       };
//       const response = await fetch(
//         `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//         }
//       );
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Failed to update defect status: ${errorText}`);
//       }
//       console.log(
//         `Defect status updated to "${status}" for ${garmentNumber}-${defectName}`
//       );
//     } catch (err) {
//       setError(`Failed to update defect status: ${err.message}`);
//       console.error("Error updating defect status:", err.message);
//       throw err; // Re-throw to allow caller to handle the error
//     }
//   };

//   const updateDefectStatusInRepairTrackingAndPassBundle = async (
//     defect_print_id,
//     garmentNumber,
//     defectName,
//     status,
//     passBundleStatus
//   ) => {
//     try {
//       let finalPassBundleStatus = passBundleStatus;
//       // Only update to "Pass" if the status is "OK" and passBundleStatus is not already set
//       if (status === "OK" && !passBundleStatus === "Pass") {
//         finalPassBundleStatus = "Pass";
//       }
//       const payload = {
//         defect_print_id,
//         garmentNumber,
//         defectName,
//         status,
//         pass_bundle: finalPassBundleStatus // Add pass_bundle here
//       };
//       const response = await fetch(
//         `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//         }
//       );
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(
//           `Failed to update defect status in repair tracking: ${errorText}`
//         );
//       }
//       console.log("Defect status updated in repair tracking successfully");
//     } catch (err) {
//       setError(
//         `Failed to update defect status in repair tracking: ${err.message}`
//       );
//       console.error(
//         "Error updating defect status in repair tracking:",
//         err.message
//       );
//     }
//   };

//   const handleScanSuccess = useCallback(
//     async (scannedData) => {
//       try {
//         setLoadingData(true);

//         // Step 1: Check if the scanned data is a defect_print_id (repair QR code)
//         const defectResponse = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData}`
//         );

//         if (defectResponse.ok) {
//           const bundleData = await defectResponse.json();
//           await handleDefectCardScan(bundleData, scannedData);

//           // Fetch repair tracking details (defect card details)
//           const trackingResponse = await fetch(
//             `${API_BASE_URL}/api/defect-track/${scannedData}`
//           );
//           if (trackingResponse.ok) {
//             const trackingData = await trackingResponse.json();
//             const updatedTrackingData = {
//               ...trackingData,
//               garments: trackingData.garments.map((garment) => ({
//                 ...garment,
//                 defects: garment.defects.map((defect) => {
//                   const defectEntry = allDefects.find(
//                     (d) => d.english === defect.name
//                   );
//                   return {
//                     ...defect,
//                     displayName: defectEntry
//                       ? defectEntry[language] || defect.name
//                       : defect.name
//                   };
//                 })
//               }))
//             };
//             setDefectTrackingDetails(updatedTrackingData); // Set defect card details for display
//             setIsReturnInspection(true); // Mark this as a return inspection

//             // Initialize repair statuses for each defect
//             const initialStatuses = {};
//             trackingData.garments.forEach((garment) => {
//               garment.defects.forEach((defect) => {
//                 const key = `${garment.garmentNumber}-${defect.name}`;
//                 initialStatuses[key] = defect.status || "Fail";
//               });
//             });
//             setRepairStatuses(initialStatuses);
//           } else {
//             console.error("Failed to fetch defect tracking details");
//           }
//           return;
//         }

//         // Step 2: Check if the scanned data is a bundle_random_id
//         const inspectionResponse = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-random-id/${scannedData}`
//         );

//         if (inspectionResponse.ok) {
//           const inspectionData = await inspectionResponse.json();
//           if (inspectionData.totalPass === 0) {
//             setError("This bundle already finished inspection");
//           } else {
//             setError("Please scan defect card for Return Garments");
//           }
//           setScanning(false);
//         } else {
//           // Step 3: Fallback to fetching bundle data if neither defect nor inspection ID matches
//           await fetchBundleData(scannedData);
//         }
//         // console.log("Defect status updated in repair tracking successfully");
//       } catch (err) {
//         setError(
//           `Failed to update defect status in repair tracking: ${err.message}`
//         );
//         console.error(
//           "Error updating defect status in repair tracking:",
//           err.message
//         );
//       }
//     },
//     [
//       fetchBundleData,
//       handleDefectCardScan,
//       setDefectTrackingDetails,
//       setError,
//       setIsReturnInspection,
//       setLoadingData,
//       setRepairStatuses,
//       setScanning
//     ]
//   );

//   const handleScanError = useCallback(
//     (err) => {
//       setError(err.message || "Failed to process scanned data");
//     },
//     [setError]
//   );

//   const handleRejectGarment = async () => {
//     if (!hasDefects || totalPass <= 0) {
//       console.log("handleRejectGarment aborted: No defects or totalPass <= 0", {
//         hasDefects,
//         totalPass
//       });
//       return;
//     }

//     if (isReturnInspection) {
//       const actualGarmentNumber = selectedGarment;
//       if (!actualGarmentNumber) {
//         setError("No garment selected for rejection.");
//         return;
//       }
//       // Update the rejected garment numbers state
//       setRejectedGarmentNumbers((prev) =>
//         new Set(prev).add(actualGarmentNumber)
//       );

//       const newSessionData = { ...sessionData };
//       newSessionData.sessionTotalPass -= 1;
//       newSessionData.sessionTotalRejects += 1;
//       const garmentDefects = Object.keys(tempDefects)
//         .filter((key) => tempDefects[key] > 0)
//         .map((key) => ({
//           name: defectsList["english"][key].name,
//           count: tempDefects[key],
//           garmentNumber: selectedGarment
//         }));
//       const totalDefectCount = garmentDefects.reduce(
//         (sum, d) => sum + d.count,
//         0
//       );
//       newSessionData.sessionDefectsQty += totalDefectCount;

//       const now = new Date();
//       const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
//       const reReturnGarment = {
//         garment: { garmentNumber: actualGarmentNumber, time: currentTime },
//         defects: garmentDefects.map((defect) => {
//           const defectIndex = allDefects.findIndex(
//             (d) => d.english === defect.name
//           );
//           const repair =
//             defectIndex !== -1 ? allDefects[defectIndex].repair : "Unknown";
//           return {
//             name: defect.name,
//             count: defect.count,
//             repair: repair
//           };
//         })
//       };
//       newSessionData.sessionRejectedGarments.push({
//         totalDefectCount,
//         repairDefectArray: garmentDefects,
//         garmentNumber: actualGarmentNumber
//       });

//       setSessionData(newSessionData);
//       setTotalPass((prev) => prev - 1);
//       setTotalRejects((prev) => prev + 1);
//       setTempDefects({});
//       setSelectedGarment(null);

//       const updatePayload = {
//         $push: {
//           "printArray.$[elem].re_return_garment": reReturnGarment
//         }
//       };
//       const arrayFilters = [
//         { "elem.defect_print_id": sessionData.printEntry.defect_print_id }
//       ];

//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               updateOperations: updatePayload,
//               arrayFilters
//             })
//           }
//         );
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(
//             `Failed to update re-return garment record: ${errorText}`
//           );
//         }

//         // Lock the garment and its defects
//         setLockedGarments((prev) => new Set(prev).add(actualGarmentNumber));
//         reReturnGarment.defects.forEach((defect) => {
//           const defectKey = `${actualGarmentNumber}-${defect.name}`;
//           setLockedDefects((prev) => new Set(prev).add(defectKey));
//           // Update repairStatuses to reflect "Fail"
//           setRepairStatuses((prev) => ({ ...prev, [defectKey]: "Fail" }));
//         });
//         setRejectedGarmentDefects((prev) =>
//           new Set(prev).add(actualGarmentNumber)
//         );

//         // Update repair tracking and defect statuses
//         await handleReReturnGarment(actualGarmentNumber, garmentDefects);
//         for (const defect of reReturnGarment.defects) {
//           await updateDefectStatusInRepairTracking(
//             sessionData.printEntry.defect_print_id,
//             actualGarmentNumber,
//             defect.name,
//             "Fail"
//           );
//         }
//       } catch (err) {
//         setError(`Failed to process garment rejection: ${err.message}`);
//         console.error("Error in handleRejectGarment:", err.message);
//         return;
//       }
//     } else {
//       // Non-return inspection logic remains unchanged
//       const newConfirmed = { ...confirmedDefects };
//       const currentTempDefects = { ...tempDefects };
//       Object.keys(currentTempDefects).forEach((key) => {
//         if (currentTempDefects[key] > 0) {
//           newConfirmed[key] =
//             (newConfirmed[key] || 0) + currentTempDefects[key];
//         }
//       });

//       setConfirmedDefects(newConfirmed);
//       setTempDefects({});
//       setSelectedGarment(null);
//       setTotalPass((prev) => prev - 1);
//       setTotalRejects((prev) => prev + 1);
//       setTotalRepair((prev) => prev + 1);
//       setRejectedOnce(true);
//       const now = new Date();
//       const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
//       const garmentDefectId = generateGarmentDefectId();
//       const defects = Object.keys(currentTempDefects)
//         .filter((key) => currentTempDefects[key] > 0)
//         .map((key) => {
//           const defectIndex = parseInt(key);
//           const defect = allDefects[defectIndex];
//           return {
//             name: defect?.english || "Unknown",
//             count: currentTempDefects[key],
//             repair: defect?.repair || "Unknown"
//           };
//         });
//       const totalCount = defects.reduce((sum, d) => sum + d.count, 0);
//       const newRejectGarment = {
//         totalCount,
//         defects,
//         garment_defect_id: garmentDefectId,
//         rejectTime: currentTime
//       };

//       const newRejectedGarments = [...rejectedGarments, newRejectGarment];
//       setRejectedGarments(newRejectedGarments);
//       // Update the rejected garment numbers state
//       setRejectedGarmentNumbers((prev) => new Set(prev).add(garmentDefectId));
//       const updatePayload = {
//         totalPass: totalPass - 1,
//         totalRejects: totalRejects + 1,
//         totalRepair: totalRepair + 1,
//         defectQty: defectQty + totalCount,
//         rejectGarments: newRejectedGarments
//       };
//       try {
//         const response = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(updatePayload)
//           }
//         );
//         if (!response.ok) throw new Error("Failed to update inspection record");
//         await updatePassBundleStatusForRejectedGarment(
//           garmentDefectId,
//           "Fail",
//           defects
//         );
//       } catch (err) {
//         setError(`Failed to update inspection record: ${err.message}`);
//       }
//       const reworkGarments = defects.map((defect) => ({
//         defectName: defect.name,
//         count: defect.count,
//         time: currentTime
//       }));
//       const payload = {
//         package_no: bundleData.package_no,
//         moNo: bundleData.selectedMono,
//         custStyle: bundleData.custStyle,
//         color: bundleData.color,
//         size: bundleData.size,
//         lineNo: bundleData.lineNo,
//         department: bundleData.department,
//         reworkGarments,
//         emp_id_inspection: user.emp_id,
//         eng_name_inspection: user.eng_name,
//         kh_name_inspection: user.kh_name,
//         job_title_inspection: user.job_title,
//         dept_name_inspection: user.dept_name,
//         sect_name_inspection: user.sect_name,
//         bundle_id: bundleData.bundle_id,
//         bundle_random_id: bundleData.bundle_random_id
//       };
//       try {
//         const response = await fetch(`${API_BASE_URL}/api/reworks`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//         });
//         if (!response.ok) throw new Error("Failed to save reworks data");
//       } catch (err) {
//         setError(`Failed to save reworks data: ${err.message}`);
//       }
//       setLockedGarments((prev) => new Set(prev).add(garmentDefectId));
//       defects.forEach((defect) => {
//         setLockedDefects((prev) =>
//           new Set(prev).add(`${garmentDefectId}-${defect.name}`)
//         );
//       });
//       // Add the code here:
//       defects.forEach((defect) => {
//         const key = `${garmentDefectId}-${defect.name}`;
//         setLocallyRejectedDefects((prev) => {
//           const newSet = new Set(prev);
//           newSet.delete(key);
//           return newSet;
//         });
//       });
//       setRejectedGarmentDefects((prev) => new Set(prev).add(garmentDefectId));
//       await handleReReturnGarment(garmentDefectId, defects);
//     }
//   };

//   const updatePassBundleStatusForRejectedGarment = async (garmentNumber) => {
//     try {
//       // Find the rejected garment in rejectedGarments
//       const rejectedGarment = rejectedGarments.find(
//         (garment) => garment.garment_defect_id === garmentNumber
//       );
//       if (!rejectedGarment) {
//         console.error(
//           `Rejected garment with number ${garmentNumber} not found.`
//         );
//         return;
//       }

//       // Prepare the payload for updating each defect in the rejected garment
//       const updatePromises = rejectedGarment.defects.map(async (defect) => {
//         let defect_print_id;
//         if (isReturnInspection) {
//           defect_print_id = sessionData.printEntry.defect_print_id;
//         } else {
//           defect_print_id = bundleData.printArray.find(
//             (item) => item.defect_print_id
//           ).defect_print_id;
//         }
//         const payload = {
//           defect_print_id: defect_print_id,
//           garmentNumber: garmentNumber,
//           defectName: defect.name,
//           status: "Fail"
//         };
//         await updateDefectStatusInRepairTracking(
//           defect_print_id,
//           garmentNumber,
//           defect.name,
//           "Fail",
//           true
//         );

//         const response = await fetch(
//           `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload)
//           }
//         );

//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(
//             `Failed to update pass_bundle status for defect ${defect.name}: ${errorText}`
//           );
//         }
//       });

//       // Wait for all updates to complete
//       await Promise.all(updatePromises);
//     } catch (err) {
//       setError(
//         `Failed to update pass_bundle status for rejected garment ${garmentNumber}: ${err.message}`
//       );
//       console.error(
//         "Error updating pass_bundle status for rejected garment:",
//         err.message
//       );
//     }
//   };

//   const handleReReturnGarment = async (garmentNumber, garmentDefects) => {
//     try {
//       const failedDefects = garmentDefects.map((defect) => ({
//         name: defect.name,
//         count: defect.count,
//         status: "Fail",
//         pass_bundle: "Fail"
//       }));

//       const payload = {
//         defect_print_id: sessionData.printEntry.defect_print_id,
//         garmentNumber,
//         failedDefects,
//         isRejecting: true
//       };

//       const repairUpdateResponse = await fetch(
//         `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//         }
//       );

//       if (!repairUpdateResponse.ok) {
//         const errorText = await repairUpdateResponse.text();
//         throw new Error(`Failed to update repair tracking: ${errorText}`);
//       }
//     } catch (err) {
//       setError(`Failed to update repair tracking: ${err.message}`);
//       console.error("Error in handleReReturnGarment:", err.message);
//     }
//   };

//   const handleGenerateQRCodes = async () => {
//     if (generateQRDisabled || isReturnInspection) return;
//     setGenerateQRDisabled(true);
//     const now = new Date();
//     const hours = String(now.getHours()).padStart(2, "0");
//     const minutes = String(now.getMinutes()).padStart(2, "0");
//     const seconds = String(now.getSeconds()).padStart(2, "0");
//     const print_time = `${hours}:${minutes}:${seconds}`;
//     const inspection_date = now.toLocaleDateString("en-US");
//     const repairQrCodes = [];
//     const garmentQrCodes = [];
//     const bundleQrCodes = [];
//     const defectGroups = groupDefectsByRepair();
//     for (const [repair, group] of Object.entries(defectGroups)) {
//       for (const chunk of group.defectChunks) {
//         const defectId = generateDefectId();
//         const qrData = {
//           factory: bundleData.factory || "YM",
//           package_no: bundleData.package_no,
//           moNo: bundleData.selectedMono,
//           custStyle: bundleData.custStyle,
//           color: bundleData.color,
//           size: bundleData.size,
//           repair,
//           count: group.totalCount,
//           count_print: chunk.count_print,
//           defects: chunk.defects,
//           inspection_time: print_time,
//           defect_id: defectId,
//           emp_id_inspection: user.emp_id,
//           eng_name_inspection: user.eng_name,
//           kh_name_inspection: user.kh_name,
//           job_title_inspection: user.job_title,
//           dept_name_inspection: user.dept_name,
//           sect_name_inspection: user.sect_name,
//           bundle_id: bundleData.bundle_id,
//           bundle_random_id: bundleData.bundle_random_id
//         };
//         try {
//           const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(qrData)
//           });
//           if (!response.ok) throw new Error("Failed to save defect print data");
//           repairQrCodes.push(qrData);
//         } catch (error) {
//           setError(`Failed to generate QR codes (Repair): ${error.message}`);
//           setGenerateQRDisabled(false);
//           return;
//         }
//       }
//     }
//     garmentQrCodes.push(
//       ...rejectedGarments.map((garment) => {
//         const defectId = generateDefectId();
//         const garmentDefectId = garment.garment_defect_id;
//         const defectsWithRepair = garment.defects.map((d) => ({
//           name: d.name,
//           count: d.count,
//           repair:
//             allDefects.find((def) => def.english === d.name)?.repair ||
//             "Unknown"
//         }));
//         return {
//           factory: bundleData.factory || "YM",
//           package_no: bundleData.package_no,
//           moNo: bundleData.selectedMono,
//           custStyle: bundleData.custStyle,
//           color: bundleData.color,
//           size: bundleData.size,
//           lineNo: bundleData.lineNo,
//           department: bundleData.department,
//           checkedQty: bundleData.passQtyIron,
//           totalPass,
//           totalRejects,
//           defectQty: garment.totalCount,
//           rejectGarments: [
//             {
//               totalCount: garment.totalCount,
//               defects: defectsWithRepair,
//               garment_defect_id: garmentDefectId
//             }
//           ],
//           inspection_time: print_time,
//           inspection_date,
//           emp_id_inspection: user.emp_id,
//           eng_name_inspection: user.eng_name,
//           kh_name_inspection: user.kh_name,
//           job_title_inspection: user.job_title,
//           dept_name_inspection: user.dept_name,
//           sect_name_inspection: user.sect_name,
//           bundle_id: bundleData.bundle_id,
//           bundle_random_id: bundleData.bundle_random_id,
//           defect_id: defectId,
//           count: garment.totalCount,
//           defects: defectsWithRepair
//         };
//       })
//     );
//     if (rejectedGarments.length > 0) {
//       const chunks = groupRejectedGarmentsForBundle();
//       chunks.forEach((chunk) => {
//         const defectPrintId = generateGarmentDefectId();
//         const totalRejectGarmentCount = chunk.length;
//         const totalRejectGarment_Var = totalRejectGarmentCount; // Set constant value
//         const totalPrintDefectCount = chunk.reduce(
//           (sum, garment) => sum + garment.totalCount,
//           0
//         );
//         const printData = chunk.map((garment, index) => {
//           const defects =
//             garment.defects.length > 6
//               ? [
//                   ...garment.defects.slice(0, 6).map((d) => ({
//                     name: d.name,
//                     count: d.count,
//                     repair: d.repair || "Unknown"
//                   })),
//                   {
//                     name: "Others",
//                     count: garment.defects
//                       .slice(6)
//                       .reduce((sum, d) => sum + d.count, 0),
//                     repair: "Various"
//                   }
//                 ]
//               : garment.defects.map((d) => ({
//                   name: d.name,
//                   count: d.count,
//                   repair: d.repair || "Unknown"
//                 }));
//           return { garmentNumber: index + 1, defects };
//         });
//         bundleQrCodes.push({
//           package_no: bundleData.package_no,
//           moNo: bundleData.selectedMono,
//           color: bundleData.color,
//           size: bundleData.size,
//           lineNo: bundleData.lineNo, // Add this line to include lineNo
//           bundleQty: bundleData.passQtyIron,
//           totalRejectGarments: totalRejectGarmentCount,
//           totalRejectGarment_Var, // New field, remains constant
//           totalDefectCount: totalPrintDefectCount,
//           defects: printData,
//           defect_print_id: defectPrintId
//         });
//       });
//     }
//     setQrCodesData({
//       repair: repairQrCodes,
//       garment: garmentQrCodes,
//       bundle: bundleQrCodes
//     });
//     const defectArray = computeDefectArray();
//     const updatePayload = {
//       inspection_time: print_time,
//       defectArray: defectArray
//     };
//     if (bundleQrCodes.length > 0) {
//       updatePayload.printArray = bundleQrCodes.map((qrCode) => ({
//         method: "bundle",
//         defect_print_id: qrCode.defect_print_id,
//         totalRejectGarmentCount: qrCode.totalRejectGarments,
//         totalRejectGarment_Var: qrCode.totalRejectGarment_Var, // Remains constant
//         totalPrintDefectCount: qrCode.totalDefectCount,
//         repairGarmentsDefects: [],
//         printData: qrCode.defects,
//         isCompleted: false
//       }));
//     }
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(updatePayload)
//         }
//       );
//       if (!response.ok) throw new Error("Failed to update inspection record");
//     } catch (err) {
//       setError(`Failed to update inspection record: ${err.message}`);
//       setGenerateQRDisabled(false);
//       return;
//     }
//   };

//   const handlePrintQRCode = async () => {
//     if (!isBluetoothConnected || isReturnInspection) {
//       alert("Please connect to a printer first");
//       return;
//     }
//     if (!bluetoothRef.current) {
//       alert("Bluetooth reference is not initialized.");
//       return;
//     }
//     try {
//       setPrinting(true);
//       const selectedQrCodes = qrCodesData[printMethod];
//       for (const qrCode of selectedQrCodes) {
//         if (printMethod === "repair") {
//           await bluetoothRef.current.printDefectData(qrCode);
//         } else if (printMethod === "garment") {
//           await bluetoothRef.current.printGarmentDefectData(qrCode);
//           if (!passBundleCountdown) setPassBundleCountdown(5);
//         } else if (printMethod === "bundle") {
//           await bluetoothRef.current.printBundleDefectData(qrCode);
//         }
//       }
//       if (totalRejects > 0) {
//         setPassBundleCountdown(3); // Initiate countdown from 3 seconds
//       }
//     } catch (error) {
//       console.error("Print error:", error);
//       alert(`Failed to print QR codes: ${error.message || "Unknown error"}`);
//     } finally {
//       setPrinting(false);
//     }
//   };

//   const handlePassBundle = async () => {
//     if (isPassingBundle) return; // Prevent multiple calls
//     setIsPassingBundle(true);

//     const hasDefects = Object.values(tempDefects).some((count) => count > 0);
//     if (!isReturnInspection && hasDefects && !rejectedOnce) {
//       setIsPassingBundle(false);
//       return;
//     }

//     // Add console logs for debugging
//     // console.log("handlePassBundle called", { isReturnInspection, sessionData });

//     try {
//       if (isReturnInspection) {
//         // Validate required data
//         if (!sessionData || !bundleData || !sessionData.printEntry) {
//           throw new Error("Missing required session or bundle data");
//         }

//         // Check if there are any "Fail" defects before proceeding
//         const hasFailDefects = defectTrackingDetails.garments.some((garment) =>
//           garment.defects.some(
//             (defect) =>
//               defect.status === "Fail" &&
//               !lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
//           )
//         );

//         if (hasFailDefects) {
//           Swal.fire({
//             icon: "error",
//             title: "Cannot Pass Bundle",
//             text: "There are still failed defects. Please resolve them before passing the bundle."
//           });
//           setIsPassingBundle(false);
//           return;
//         }

//         // **New check: Check if all defects for each garment are OK**
//         const allGarmentsPassed = defectTrackingDetails.garments.every(
//           (garment) =>
//             garment.defects.every(
//               (defect) =>
//                 defect.status === "OK" ||
//                 lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
//             )
//         );

//         if (!allGarmentsPassed) {
//           Swal.fire({
//             icon: "error",
//             title: "Cannot Pass Bundle",
//             text: "Not all defects for each garment are marked as OK. Please review and correct the defect status before passing the bundle."
//           });
//           setIsPassingBundle(false);
//           return;
//         }

//         const {
//           sessionTotalPass,
//           sessionTotalRejects,
//           sessionRejectedGarments,
//           inspectionNo,
//           printEntry,
//           initialTotalPass
//         } = sessionData;

//         const initialTotalRepair = bundleData.totalRepair;
//         const initialTotalPassGlobal = bundleData.totalPass;
//         const newTotalRejectGarmentCount = initialTotalPass - sessionTotalPass;

//         const updatePayload = {
//           $set: {
//             totalRepair:
//               sessionTotalRejects > 0
//                 ? initialTotalRepair - sessionTotalPass
//                 : 0,
//             totalPass: initialTotalPassGlobal + sessionTotalPass,
//             "printArray.$[elem].totalRejectGarmentCount":
//               newTotalRejectGarmentCount,
//             "printArray.$[elem].isCompleted": newTotalRejectGarmentCount === 0
//           }
//         };

//         if (sessionTotalRejects > 0) {
//           updatePayload.$push = {
//             "printArray.$[elem].repairGarmentsDefects": {
//               inspectionNo,
//               repairGarments: sessionRejectedGarments
//             }
//           };
//         }

//         const arrayFilters = [
//           { "elem.defect_print_id": printEntry.defect_print_id }
//         ];

//         const response = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               updateOperations: updatePayload,
//               arrayFilters
//             })
//           }
//         );

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.message || "Failed to update record");
//         }

//         // Update pass_bundle status to "Pass" for all OK defects
//         if (sessionData.printEntry.defect_print_id) {
//           await updatePassBundleStatusForOKDefects(
//             sessionData.printEntry.defect_print_id
//           );
//         }

//         // Reset return inspection state
//         setIsReturnInspection(false);
//         setSessionData(null);
//       } else {
//         const now = new Date();
//         const hours = String(now.getHours()).padStart(2, "0");
//         const minutes = String(now.getMinutes()).padStart(2, "0");
//         const seconds = String(now.getSeconds()).padStart(2, "0");
//         const inspectionTime = `${hours}:${minutes}:${seconds}`;

//         const updatePayload = {
//           $set: {
//             inspection_time: inspectionTime
//           }
//         };

//         const response = await fetch(
//           `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(updatePayload)
//           }
//         );

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(
//             errorData.message || "Failed to update inspection record"
//           );
//         }
//       }

//       // Reset state after successful update
//       setTotalPass(0);
//       setTotalRejects(0);
//       setTotalRepair(0);
//       setConfirmedDefects({});
//       setTempDefects({});
//       setBundlePassed(true);
//       setRejectedOnce(false);
//       setBundleData(null);
//       setInDefectWindow(false);
//       setScanning(true);
//       setRejectedGarments([]);
//       setQrCodesData({ repair: [], garment: [], bundle: [] });
//       setGenerateQRDisabled(false);
//       setPassBundleCountdown(null);
//       setError(null); // Clear any previous errors
//     } catch (err) {
//       setError(err.message || "Failed to update inspection record");
//       // console.error("Error in handlePassBundle:", err);
//     } finally {
//       setIsPassingBundle(false);
//       setLoadingData(false); // Ensure loading state is reset
//     }
//   };

//   const updatePassBundleStatusForOKDefects = async (defect_print_id) => {
//     try {
//       const payload = {
//         defect_print_id: defect_print_id,
//         pass_bundle: "Pass"
//       };
//       const response = await fetch(
//         `${API_BASE_URL}/api/qc2-repair-tracking/update-pass-bundle-status`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload)
//         }
//       );
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(
//           `Failed to update pass_bundle status for defect ${defect_print_id}: ${errorText}`
//         );
//       }
//       console.log(
//         `pass_bundle status updated successfully for defect ${defect_print_id}`
//       );
//     } catch (err) {
//       setError(
//         `Failed to update pass_bundle status for OK defects: ${err.message}`
//       );
//       console.error(
//         "Error updating pass_bundle status for OK defects:",
//         err.message
//       );
//     }
//   };

//   const handleIconClick = (feature) => {
//     setSelectedFeature(feature);
//     setMenuClicked(false);
//     setNavOpen(true);
//   };

//   const handleMenuClick = () => {
//     setNavOpen(!navOpen);
//     setMenuClicked(true);
//   };

//   const handleLanguageChange = (event) => {
//     const newLanguage = event.target.value;
//     setLanguage(newLanguage);
//     if (defectTrackingDetails) {
//       setDefectTrackingDetails((prev) => ({
//         ...prev,
//         garments: prev.garments.map((garment) => ({
//           ...garment,
//           defects: garment.defects.map((defect) => {
//             const defectEntry = allDefects.find(
//               (d) => d.english === defect.name
//             );
//             return {
//               ...defect,
//               displayName: defectEntry
//                 ? defectEntry[newLanguage] || defect.name
//                 : defect.name
//             };
//           })
//         }))
//       }));
//     }
//   };

//   useEffect(() => {
//     setShowDefectBoxes(!isReturnInspection);
//   }, [isReturnInspection]);

//   useEffect(() => {
//     if (defectTrackingDetails) {
//       setDefectTrackingDetails((prev) => ({
//         ...prev,
//         garments: prev.garments.map((garment) => ({
//           ...garment,
//           defects: garment.defects.map((defect) => {
//             const defectEntry = allDefects.find(
//               (d) => d.english === defect.name
//             );
//             return {
//               ...defect,
//               displayName: defectEntry
//                 ? defectEntry[language] || defect.name
//                 : defect.name
//             };
//           })
//         }))
//       }));
//     }
//   }, [language]);

//   // --- NEW: Refactored PageTitle component ---
//   const PageTitle = useCallback(
//     () => (
//       <div className="text-center">
//         <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
//           {t("qc2In.title", "QC2 Inspection")}
//         </h1>
//         <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
//           Yorkmars (Cambodia) Garment MFG Co., LTD
//           {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
//         </p>
//       </div>
//     ),
//     [t, user]
//   );

//   // --- NEW: Tab Icons definition ---
//   const tabIcons = {
//     first: <ClipboardCheck />,
//     edit: <Eye />, // Using Eye for "View/Edit"
//     return: <Redo />, // Using Redo for "Return"
//     data: <Database />,
//     "defect-cards": <Tag />
//   };

//   return (
//     <div className="flex h-screen bg-slate-100">
//       {/* Sidebar Navigation */}
//       <div
//         className={`${
//           navOpen ? "w-80 md:w-72" : "w-16"
//         } bg-gray-800 text-white h-screen p-2 transition-all duration-300 overflow-y-auto`}
//       >
//         <div className="flex items-center justify-center mb-4">
//           <button onClick={handleMenuClick} className="p-2 focus:outline-none">
//             {navOpen ? <ArrowLeft /> : <Menu />}
//           </button>
//         </div>
//         {navOpen ? (
//           <div className="space-y-6">
//             {menuClicked ? (
//               <>
//                 {/* Languages Section */}
//                 <div className="flex items-center mb-1">
//                   <Languages className="w-5 h-5 mr-1" />
//                   <span className="font-medium">{t("qc2In.language")}</span>
//                 </div>
//                 <select
//                   value={language}
//                   onChange={handleLanguageChange}
//                   className="w-full p-1 text-black rounded"
//                 >
//                   <option value="english">{t("languages.en")}</option>
//                   <option value="khmer">{t("languages.kh")}</option>
//                   <option value="chinese">{t("languages.ch")}</option>
//                   <option value="all">{t("qc2In.all_languages")}</option>
//                 </select>
//                 {/* Defect Type Filter */}
//                 <div className="flex items-center mb-1">
//                   <Filter className="w-5 h-5 mr-1" />
//                   <span className="font-medium">
//                     {t("preview.defect_type")}
//                   </span>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
//                   {defectTypes.map((type) => (
//                     <button
//                       key={type}
//                       onClick={() => {
//                         setDefectTypeFilter(type);
//                         setCategoryFilter("");
//                       }}
//                       className={`p-1 text-sm rounded border ${
//                         defectTypeFilter === type && !categoryFilter
//                           ? "bg-blue-600"
//                           : "bg-gray-700"
//                       }`}
//                     >
//                       {currentLanguage === "en"
//                         ? t(`qc2In.${type}`).toUpperCase()
//                         : t(`qc2In.${type}`)}
//                     </button>
//                   ))}
//                 </div>
//                 {/* Category Filter */}
//                 <div className="flex items-center mb-1">
//                   <Tag className="w-5 h-5 mr-1" />
//                   <span className="font-medium">{t("ana.category")}</span>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
//                   {categoryOptions.map((cat) => (
//                     <button
//                       key={cat}
//                       onClick={() => {
//                         setCategoryFilter(cat === categoryFilter ? "" : cat);
//                         setDefectTypeFilter("all");
//                       }}
//                       className={`p-1 text-sm rounded border ${
//                         categoryFilter === cat ? "bg-blue-600" : "bg-gray-700"
//                       }`}
//                     >
//                       {currentLanguage === "en"
//                         ? t(`qc2In.${cat}`).toUpperCase()
//                         : t(`qc2In.${cat}`)}
//                     </button>
//                   ))}
//                 </div>
//                 {/* Sort Section */}
//                 <div className="flex items-center mb-1">
//                   <ArrowUpDown className="w-5 h-5 mr-1" />
//                   <span className="font-medium">{t("qc2In.sort")}</span>
//                 </div>
//                 <div className="relative">
//                   <button
//                     onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
//                     className="w-full p-1 rounded bg-gray-700 text-left text-sm"
//                   >
//                     {sortOption === "alphaAsc"
//                       ? "A-Z"
//                       : sortOption === "alphaDesc"
//                       ? "Z-A"
//                       : sortOption === "countDesc"
//                       ? "Count (High-Low)"
//                       : "Select Sort"}
//                   </button>
//                   {sortDropdownOpen && (
//                     <div className="absolute z-10 mt-1 w-full bg-white text-black rounded shadow p-2">
//                       <button
//                         onClick={() => {
//                           setSortOption("alphaAsc");
//                           setSortDropdownOpen(false);
//                         }}
//                         className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                       >
//                         A-Z
//                       </button>
//                       <button
//                         onClick={() => {
//                           setSortOption("alphaDesc");
//                           setSortDropdownOpen(false);
//                         }}
//                         className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                       >
//                         Z-A
//                       </button>
//                       <button
//                         onClick={() => {
//                           setSortOption("countDesc");
//                           setSortDropdownOpen(false);
//                         }}
//                         className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                       >
//                         Count (High-Low)
//                       </button>
//                     </div>
//                   )}
//                 </div>
//                 {/* Printer Section */}
//                 <div className="flex items-center mb-1">
//                   <Printer className="w-5 h-5 mr-1" />
//                   <span className="font-medium">{t("qc2In.printer")}</span>
//                 </div>
//                 <BluetoothComponent ref={bluetoothRef} />

//                 {/* Printing Method Section */}
//                 <div className="flex items-center mb-1">
//                   <Paperclip className="w-5 h-5 mr-1" />
//                   <span className="font-medium">
//                     {t("qc2In.printing_method")}
//                   </span>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
//                   <button
//                     onClick={() => setPrintMethod("repair")}
//                     className={`p-1 text-sm rounded border ${
//                       printMethod === "repair" ? "bg-blue-600" : "bg-gray-700"
//                     }`}
//                   >
//                     {t("qc2In.repair")}
//                   </button>
//                   <button
//                     onClick={() => setPrintMethod("garment")}
//                     className={`p-1 text-sm rounded border ${
//                       printMethod === "garment" ? "bg-blue-600" : "bg-gray-700"
//                     }`}
//                   >
//                     {t("qc2In.garment")}
//                   </button>
//                   <button
//                     onClick={() => setPrintMethod("bundle")}
//                     className={`p-1 text-sm rounded border ${
//                       printMethod === "bundle" ? "bg-blue-600" : "bg-gray-700"
//                     }`}
//                   >
//                     {t("qc2In.bundle")}
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <>
//                 {/* ... collapsed sidebar logic ... */}
//                 {selectedFeature === "language" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <Languages className="w-5 h-5 mr-1" />
//                       <span className="font-medium">{t("qc2In.language")}</span>
//                     </div>
//                     <select
//                       value={language}
//                       onChange={handleLanguageChange}
//                       className="w-full p-1 text-black rounded"
//                     >
//                       <option value="english">{t("languages.en")}</option>
//                       <option value="khmer">{t("languages.kh")}</option>
//                       <option value="chinese">{t("languages.ch")}</option>
//                       <option value="all">{t("qc2In.all_languages")}</option>
//                     </select>
//                   </div>
//                 )}
//                 {selectedFeature === "defectType" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <Filter className="w-5 h-5 mr-1" />
//                       <span className="font-medium">
//                         {t("preview.defect_type")}
//                       </span>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
//                       {defectTypes.map((type) => (
//                         <button
//                           key={type}
//                           onClick={() => {
//                             setDefectTypeFilter(type);
//                             setCategoryFilter("");
//                           }}
//                           className={`p-1 text-sm rounded border ${
//                             defectTypeFilter === type && !categoryFilter
//                               ? "bg-blue-600"
//                               : "bg-gray-700"
//                           }`}
//                         >
//                           {currentLanguage === "en"
//                             ? t(`qc2In.${type}`).toUpperCase()
//                             : t(`qc2In.${type}`)}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//                 {selectedFeature === "category" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <Tag className="w-5 h-5 mr-1" />
//                       <span className="font-medium">{t("ana.category")}</span>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
//                       {categoryOptions.map((cat) => (
//                         <button
//                           key={cat}
//                           onClick={() => {
//                             setCategoryFilter(
//                               cat === categoryFilter ? "" : cat
//                             );
//                             setDefectTypeFilter("all");
//                           }}
//                           className={`p-1 text-sm rounded border ${
//                             categoryFilter === cat
//                               ? "bg-blue-600"
//                               : "bg-gray-700"
//                           }`}
//                         >
//                           {currentLanguage === "en"
//                             ? t(`qc2In.${cat}`).toUpperCase()
//                             : t(`qc2In.${cat}`)}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//                 {selectedFeature === "sort" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <ArrowUpDown className="w-5 h-5 mr-1" />
//                       <span className="font-medium">{t("qc2In.sort")}</span>
//                     </div>
//                     <div className="relative">
//                       <button
//                         onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
//                         className="w-full p-1 rounded bg-gray-700 text-left text-sm"
//                       >
//                         {sortOption === "alphaAsc"
//                           ? "A-Z"
//                           : sortOption === "alphaDesc"
//                           ? "Z-A"
//                           : sortOption === "countDesc"
//                           ? "Count (High-Low)"
//                           : "Select Sort"}
//                       </button>
//                       {sortDropdownOpen && (
//                         <div className="absolute z-10 mt-1 w-full bg-white text-black rounded shadow p-2">
//                           <button
//                             onClick={() => {
//                               setSortOption("alphaAsc");
//                               setSortDropdownOpen(false);
//                             }}
//                             className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                           >
//                             A-Z
//                           </button>
//                           <button
//                             onClick={() => {
//                               setSortOption("alphaDesc");
//                               setSortDropdownOpen(false);
//                             }}
//                             className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                           >
//                             Z-A
//                           </button>
//                           <button
//                             onClick={() => {
//                               setSortOption("countDesc");
//                               setSortDropdownOpen(false);
//                             }}
//                             className="block w-full text-left px-2 py-1 hover:bg-gray-200 text-sm"
//                           >
//                             Count (High-Low)
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//                 {selectedFeature === "printer" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <Printer className="w-5 h-5 mr-1" />
//                       <span className="font-medium">{t("qc2In.printer")}</span>
//                     </div>
//                     <BluetoothComponent ref={bluetoothRef} />
//                   </div>
//                 )}
//                 {selectedFeature === "printingMethod" && (
//                   <div>
//                     <div className="flex items-center mb-1">
//                       <Paperclip className="w-5 h-5 mr-1" />
//                       <span className="font-medium">
//                         {t("qc2In.printing_method")}
//                       </span>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:flex space-x-1 md:space-x-2">
//                       <button
//                         onClick={() => setPrintMethod("repair")}
//                         className={`p-1 text-sm rounded border ${
//                           printMethod === "repair"
//                             ? "bg-blue-600"
//                             : "bg-gray-700"
//                         }`}
//                       >
//                         {t("qc2In.repair")}
//                       </button>
//                       <button
//                         onClick={() => setPrintMethod("garment")}
//                         className={`p-1 text-sm rounded border ${
//                           printMethod === "garment"
//                             ? "bg-blue-600"
//                             : "bg-gray-700"
//                         }`}
//                       >
//                         {t("qc2In.garment")}
//                       </button>
//                       <button
//                         onClick={() => setPrintMethod("bundle")}
//                         className={`p-1 text-sm rounded border ${
//                           printMethod === "bundle"
//                             ? "bg-blue-600"
//                             : "bg-gray-700"
//                         }`}
//                       >
//                         {t("qc2In.bundle")}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("language")}>
//                 <Languages className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("defectType")}>
//                 <Filter className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("category")}>
//                 <Tag className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("sort")}>
//                 <ArrowUpDown className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("printer")}>
//                 <Printer
//                   className={`w-5 h-5 ${
//                     isBluetoothConnected ? "text-green-500" : ""
//                   }`}
//                 />
//               </button>
//             </div>
//             <div className="flex items-center justify-center">
//               <button onClick={() => handleIconClick("printingMethod")}>
//                 <Paperclip className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//       <div style={{ position: "absolute", left: "-9999px" }}>
//         <BluetoothComponent ref={bluetoothRef} />
//       </div>

//       <div className={`${navOpen ? "w-3/4" : "w-11/12"} flex flex-col`}>
//         <header className="bg-white shadow-md p-3 sticky top-0 z-20">
//           <PageTitle />
//           {!inDefectWindow && (
//             <div className="mt-4 border-b border-gray-300">
//               <nav
//                 className="-mb-px flex space-x-1 sm:space-x-4 justify-center"
//                 aria-label="Tabs"
//               >
//                 {["first", "edit", "return", "data", "defect-cards"].map(
//                   (tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab)}
//                       className={`group inline-flex items-center py-2 sm:py-3 px-1 sm:px-4 border-b-2 font-semibold text-xs sm:text-sm focus:outline-none transition-all duration-200 ease-in-out
//                           ${
//                             activeTab === tab
//                               ? "border-indigo-600 text-indigo-700"
//                               : "border-transparent text-gray-500 hover:text-indigo-700 hover:border-indigo-300"
//                           }`}
//                     >
//                       {React.cloneElement(tabIcons[tab], {
//                         className: `mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 ${
//                           activeTab === tab
//                             ? "text-indigo-600"
//                             : "text-gray-400 group-hover:text-indigo-500"
//                         }`
//                       })}
//                       {t(`qc2In.tabs.${tab}`)}
//                     </button>
//                   )
//                 )}
//               </nav>
//             </div>
//           )}
//         </header>
//         {/* {!inDefectWindow && (
//           <div className="bg-gray-200 p-2">
//             <div className="flex space-x-4">
//               {["first", "edit", "return", "data", "defect-cards"].map(
//                 (tab) => (
//                   <button
//                     key={tab}
//                     onClick={() => setActiveTab(tab)}
//                     className={`px-3 py-2 rounded ${
//                       activeTab === tab
//                         ? "bg-blue-600 text-white"
//                         : "bg-white text-black"
//                     }`}
//                   >
//                     {tab === "first"
//                       ? t("qc2In.inspection")
//                       : tab === "edit"
//                       ? t("qc2In.edit_inspection")
//                       : tab === "return"
//                       ? t("defIm.defect_name")
//                       : tab === "data"
//                       ? t("bundle.data")
//                       : t("qc2In.defect_card")}
//                   </button>
//                 )
//               )}
//             </div>
//           </div>
//         )} */}
//         <main className="flex-grow">
//           {error && (
//             <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md m-4">
//               <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
//               <p className="text-sm text-red-700">{error}</p>
//             </div>
//           )}
//           {activeTab === "edit" && <EditInspection />}
//           {activeTab === "return" && <DefectNames />}
//           {activeTab === "data" && <QC2Data />}
//           {activeTab === "defect-cards" && (
//             <DefectPrint
//               bluetoothRef={bluetoothRef}
//               printMethod={printMethod}
//             />
//           )}
//           {activeTab === "first" && (
//             <>
//               {!inDefectWindow ? (
//                 <div className="flex flex-col items-center justify-center h-full p-4">
//                   {scanning && (
//                     <div className="w-full max-w-2xl h-96">
//                       <Scanner
//                         onScanSuccess={handleScanSuccess}
//                         onScanError={handleScanError}
//                       />
//                       {loadingData && (
//                         <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
//                           <Loader2 className="w-5 h-5 animate-spin" />
//                           <p>{t("qc2In.loading_data")}</p>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <>
//                   <div className="p-2 bg-blue-100 border-b">
//                     <div className="flex items-center">
//                       <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
//                         <button
//                           onClick={handleRejectGarment}
//                           disabled={
//                             !hasDefects ||
//                             (isReturnInspection && totalPass <= 0) ||
//                             (isReturnInspection &&
//                               selectedGarment &&
//                               rejectedGarmentNumbers.has(selectedGarment))
//                           }
//                           className={`px-2 md:px-4 py-2 rounded ${
//                             !hasDefects ||
//                             (isReturnInspection && totalPass <= 0) ||
//                             (isReturnInspection &&
//                               selectedGarment &&
//                               rejectedGarmentNumbers.has(selectedGarment))
//                               ? "bg-gray-300 cursor-not-allowed"
//                               : "bg-red-600 hover:bg-red-700 text-white"
//                           }`}
//                         >
//                           {t("qc2In.reject_garment")}
//                         </button>
//                         {!isReturnInspection && (
//                           <div className="flex space-x-1">
//                             <button
//                               onClick={() => setShowQRPreview(true)}
//                               disabled={qrCodesData[printMethod].length === 0}
//                               className={`p-2 md:p-2 rounded ${
//                                 qrCodesData[printMethod].length === 0
//                                   ? "bg-gray-300 cursor-not-allowed"
//                                   : "bg-blue-600 hover:bg-blue-700 text-white"
//                               }`}
//                               title="Preview QR"
//                             >
//                               <Eye className="w-5 h-5" />
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                       <div className="w-64 md:w-4/6 mx-4">
//                         <div className="overflow-x-auto whitespace-nowrap h-12 border-b mb-2">
//                           <div className="flex space-x-4 items-center">
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.department")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.department}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.mono")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.selectedMono}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.customer_style")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.custStyle}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.color")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.color}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.size")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.size}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.line_no")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.lineNo}
//                               </span>
//                             </div>
//                             <div>
//                               <span className="text-xs">
//                                 {t("bundle.package_no")}:{" "}
//                               </span>
//                               <span className="text-xs font-bold">
//                                 {bundleData.package_no}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex justify-between">
//                           <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
//                             <QrCode className="w-5 h-5 mr-2" />
//                             <div className="hidden md:block">
//                               <div className="text-xs">
//                                 {isReturnInspection
//                                   ? "Reject Garments"
//                                   : "Checked Qty"}
//                               </div>
//                               <div className="text-xl font-bold">
//                                 {isReturnInspection
//                                   ? sessionData.totalRejectGarmentCount
//                                   : bundleData.passQtyIron}
//                               </div>
//                             </div>
//                             <div className="block md:hidden">
//                               <div className="text-xl font-bold">
//                                 {isReturnInspection
//                                   ? sessionData.totalRejectGarmentCount
//                                   : bundleData.passQtyIron}
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
//                             <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
//                             <div className="hidden md:block">
//                               <div className="text-xs">
//                                 {t("dash.total_pass")}
//                               </div>
//                               <div className="text-xl font-bold text-green-600">
//                                 {totalPass}
//                               </div>
//                             </div>
//                             <div className="block md:hidden">
//                               <div className="text-xl font-bold text-green-600">
//                                 {totalPass}
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
//                             <XCircle className="w-5 h-5 mr-2 text-red-600" />
//                             <div className="hidden md:block">
//                               <div className="text-xs">
//                                 {t("dash.total_rejects")}
//                               </div>
//                               <div className="text-xl font-bold text-red-600">
//                                 {totalRejects}
//                               </div>
//                             </div>
//                             <div className="block md:hidden">
//                               <div className="text-xl font-bold text-red-600">
//                                 {totalRejects}
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 flex items-center">
//                             <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
//                             <div className="hidden md:block">
//                               <div className="text-xs">
//                                 {t("qc2In.defect_qty")}
//                               </div>
//                               <div className="text-xl font-bold text-orange-600">
//                                 {defectQty}
//                               </div>
//                             </div>
//                             <div className="block md:hidden">
//                               <div className="text-xl font-bold text-orange-600">
//                                 {defectQty}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="w-1/6 h-32 flex flex-col justify-center items-center space-y-2">
//                         <button
//                           onClick={handlePassBundle}
//                           disabled={
//                             isPassingBundle || // Prevent multiple clicks
//                             (isReturnInspection
//                               ? // For return inspection: Disable if there are pending defects (hasDefects) or if a garment has been rejected (rejectedOnce)
//                                 hasDefects || rejectedOnce
//                               : // For non-return inspection: Disable if there are pending defects and no rejection has occurred,
//                                 // or if a garment has been rejected but QR codes haven't been generated, or if printing is in progress
//                                 (hasDefects && !rejectedOnce) ||
//                                 (rejectedOnce && // Only check QR codes if a garment has been rejected
//                                   (printMethod === "garment" ||
//                                     printMethod === "bundle") &&
//                                   qrCodesData.garment.length === 0) ||
//                                 printing)
//                           }
//                           className={`px-2 md:px-4 py-1 md:py-2 rounded ${
//                             (
//                               isReturnInspection
//                                 ? hasDefects || rejectedOnce
//                                 : (hasDefects && !rejectedOnce) ||
//                                   (rejectedOnce &&
//                                     (printMethod === "garment" ||
//                                       printMethod === "bundle") &&
//                                     qrCodesData.garment.length === 0) ||
//                                   printing
//                             )
//                               ? "bg-gray-300 cursor-not-allowed"
//                               : totalRejects > 0
//                               ? "bg-yellow-500 hover:bg-yellow-600"
//                               : "bg-green-600 hover:bg-green-700"
//                           } text-white`}
//                         >
//                           {t("qc2In.pass_bundle")}{" "}
//                           {passBundleCountdown !== null
//                             ? `(${passBundleCountdown}s)`
//                             : ""}
//                         </button>
//                         {!isReturnInspection && (
//                           <div className="flex space-x-1">
//                             <button
//                               onClick={handleGenerateQRCodes}
//                               disabled={!defectQty || generateQRDisabled}
//                               className={`p-2 md:p-2 rounded ${
//                                 !defectQty || generateQRDisabled
//                                   ? "bg-gray-300 cursor-not-allowed"
//                                   : "bg-blue-600 hover:bg-blue-700 text-white"
//                               }`}
//                               title={t("bundle.generate_qr")}
//                             >
//                               <QrCode className="w-5 h-5" />
//                             </button>
//                             <button
//                               onClick={handlePrintQRCode}
//                               disabled={
//                                 !isBluetoothConnected ||
//                                 qrCodesData[printMethod].length === 0
//                               }
//                               className={`p-2 md:p-2 rounded ${
//                                 !isBluetoothConnected ||
//                                 qrCodesData[printMethod].length === 0
//                                   ? "bg-gray-300 cursor-not-allowed"
//                                   : "bg-blue-600 hover:bg-blue-700 text-white"
//                               }`}
//                               title={t("bundle.print_qr")}
//                             >
//                               <Printer className="w-5 h-5" />
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="h-[calc(100vh-200px)] overflow-y-auto p-2">
//                     <div className="mt-4 max-w-5xl mx-auto mb-4">
//                       {defectTrackingDetails && (
//                         <div className="mt-4">
//                           <div className="bg-gray-50 rounded-lg p-4 mb-1">
//                             <h3 className="text-xl font-semibold text-gray-800 mb-4">
//                               Defect Card Details
//                             </h3>
//                             <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
//                               <p className="text-gray-700">
//                                 <strong>MO No:</strong>{" "}
//                                 {defectTrackingDetails.moNo}
//                               </p>
//                               <p className="text-gray-700">
//                                 <strong>Line No:</strong>{" "}
//                                 {defectTrackingDetails.lineNo}
//                               </p>
//                               <p className="text-gray-700">
//                                 <strong>Color:</strong>{" "}
//                                 {defectTrackingDetails.color}
//                               </p>
//                               <p className="text-gray-700">
//                                 <strong>Size:</strong>{" "}
//                                 {defectTrackingDetails.size}
//                               </p>
//                             </div>
//                             <div className="flex justify-end mb-1">
//                               <FormControl
//                                 variant="outlined"
//                                 sx={{ minWidth: 200 }}
//                               >
//                                 <InputLabel id="language-select-label">
//                                   Select Language
//                                 </InputLabel>
//                                 <Select
//                                   labelId="language-select-label"
//                                   id="language-select"
//                                   value={language}
//                                   onChange={handleLanguageChange}
//                                   label="Select Language"
//                                 >
//                                   <MenuItem value="english">English</MenuItem>
//                                   <MenuItem value="khmer">Khmer</MenuItem>
//                                   <MenuItem value="chinese">Chinese</MenuItem>
//                                 </Select>
//                               </FormControl>
//                             </div>
//                           </div>
//                           <TableContainer
//                             component={Paper}
//                             className="shadow-lg"
//                           >
//                             <Table className="min-w-full">
//                               <TableHead>
//                                 <TableRow className="bg-gray-100 text-white">
//                                   <TableCell
//                                     scope="col"
//                                     className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200"
//                                   >
//                                     Garment Number
//                                   </TableCell>
//                                   <TableCell
//                                     scope="col"
//                                     className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200"
//                                   >
//                                     Repair Group
//                                   </TableCell>
//                                   <TableCell
//                                     scope="col"
//                                     className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200"
//                                   >
//                                     Defect Name ({language})
//                                   </TableCell>
//                                   <TableCell
//                                     scope="col"
//                                     className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200"
//                                   >
//                                     Defect Count
//                                   </TableCell>
//                                   <TableCell
//                                     scope="col"
//                                     className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200"
//                                   >
//                                     Status
//                                   </TableCell>
//                                 </TableRow>
//                               </TableHead>
//                               <TableBody>
//                                 {defectTrackingDetails.garments.some(
//                                   (garment) =>
//                                     garment.defects.some(
//                                       (defect) => defect.pass_bundle !== "Pass"
//                                     )
//                                 ) ? (
//                                   defectTrackingDetails.garments.map(
//                                     (garment) =>
//                                       garment.defects
//                                         .filter(
//                                           (defect) =>
//                                             defect.pass_bundle !== "Pass"
//                                         )
//                                         .map((defect, index) => (
//                                           <TableRow
//                                             key={`${garment.garmentNumber}-${defect.name}-${index}`}
//                                             className={
//                                               lockedGarments.has(
//                                                 garment.garmentNumber
//                                               ) ||
//                                               rejectedGarmentNumbers.has(
//                                                 garment.garmentNumber
//                                               )
//                                                 ? "bg-gray-300"
//                                                 : defect.status === "OK"
//                                                 ? "bg-green-100"
//                                                 : "bg-red-100"
//                                             }
//                                           >
//                                             <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                                               {garment.garmentNumber}
//                                             </TableCell>
//                                             <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                                               {defect.repair}
//                                             </TableCell>
//                                             <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                                               {defect.displayName ||
//                                                 defect.name}
//                                             </TableCell>
//                                             <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                                               {defect.count}
//                                             </TableCell>
//                                             <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                                               <Button
//                                                 variant="contained"
//                                                 color={
//                                                   repairStatuses[
//                                                     `${garment.garmentNumber}-${defect.name}`
//                                                   ] === "OK"
//                                                     ? "success"
//                                                     : "error"
//                                                 }
//                                                 onClick={() =>
//                                                   handleDefectStatusToggle(
//                                                     garment.garmentNumber,
//                                                     defect.name
//                                                   )
//                                                 }
//                                                 disabled={
//                                                   rejectedGarmentDefects.has(
//                                                     garment.garmentNumber
//                                                   ) &&
//                                                   rejectedGarmentNumbers.has(
//                                                     garment.garmentNumber
//                                                   )
//                                                 }
//                                               >
//                                                 {repairStatuses[
//                                                   `${garment.garmentNumber}-${defect.name}`
//                                                 ] === "OK"
//                                                   ? "PASS"
//                                                   : "Fail"}
//                                               </Button>
//                                             </TableCell>
//                                           </TableRow>
//                                         ))
//                                   )
//                                 ) : (
//                                   <TableRow>
//                                     <TableCell
//                                       colSpan={5}
//                                       className="text-center text-gray-700"
//                                     >
//                                       No garments found.
//                                     </TableCell>
//                                   </TableRow>
//                                 )}
//                               </TableBody>
//                             </Table>
//                           </TableContainer>
//                         </div>
//                       )}
//                     </div>
//                     {/* Conditionally render the hide/show button and defect boxes only for return inspections */}
//                     {isReturnInspection && (
//                       <div className="flex justify-between bg-gray-200 items-center mb-4">
//                         {/* <h3 className="text-xl font-semibold text-gray-800">Defect</h3>
//                           <button
//                             onClick={() => setShowDefectBoxes(!showDefectBoxes)}
//                             className="p-2 bg-blue-600 text-white rounded"
//                           >
//                             {showDefectBoxes ? "Hide" : "Show"}
//                           </button> */}
//                       </div>
//                     )}

//                     {isReturnInspection ||
//                       (showDefectBoxes && (
//                         <DefectBox
//                           language={language}
//                           tempDefects={tempDefects}
//                           onDefectUpdate={setTempDefects}
//                           activeFilter={activeFilter}
//                           confirmedDefects={confirmedDefects}
//                           sortOption={sortOption}
//                         />
//                       ))}
//                   </div>
//                 </>
//               )}
//             </>
//           )}
//         </main>
//       </div>
//       <QRCodePreview
//         isOpen={showQRPreview}
//         onClose={() => setShowQRPreview(false)}
//         qrData={qrCodesData[printMethod]}
//         onPrint={handlePrintQRCode}
//         mode={
//           printMethod === "repair"
//             ? "inspection"
//             : printMethod === "garment"
//             ? "garment"
//             : "bundle"
//         }
//       />
//     </div>
//   );
// };

// export default QC2InspectionPage;

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

// Local Imports
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import { useBluetooth } from "../components/context/BluetoothContext";

// Existing Components
import BluetoothComponent from "../components/forms/Bluetooth";
import QRCodePreview from "../components/forms/QRCodePreview";
import DefectNames from "../components/inspection/DefectNames";
import DefectPrint from "../components/inspection/DefectPrint";
import EditInspection from "../components/inspection/EditInspection";
import QC2Data from "../components/inspection/QC2Data";

// New Refactored Components
import QC2InspectionPageTitle from "../components/inspection/qc2/QC2InspectionPageTitle";
import QC2InspectionSidebar from "../components/inspection/qc2/QC2InspectionSidebar";
import QC2InspectionTabs from "../components/inspection/qc2/QC2InspectionTabs";
import QC2InspectionScannerView from "../components/inspection/qc2/QC2InspectionScannerView";
import QC2InspectionWindow from "../components/inspection/qc2/QC2InspectionWindow";

const QC2InspectionPage = () => {
  // --- State Management ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bluetoothState } = useBluetooth();
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [tempDefects, setTempDefects] = useState({});
  const [confirmedDefects, setConfirmedDefects] = useState({});
  const [bundlePassed, setBundlePassed] = useState(false);
  const [rejectedOnce, setRejectedOnce] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [totalPass, setTotalPass] = useState(0);
  const [totalRejects, setTotalRejects] = useState(0);
  const [totalRepair, setTotalRepair] = useState(0);
  const [activeTab, setActiveTab] = useState("first");
  const [inDefectWindow, setInDefectWindow] = useState(false);
  const [sortOption, setSortOption] = useState("alphaAsc");
  const [language, setLanguage] = useState("khmer");
  const [defectTypeFilter, setDefectTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [qrCodesData, setQrCodesData] = useState({
    repair: [],
    garment: [],
    bundle: []
  });
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [generateQRDisabled, setGenerateQRDisabled] = useState(false);
  const [printMethod, setPrintMethod] = useState("bundle");
  const [rejectedGarments, setRejectedGarments] = useState([]);
  const [passBundleCountdown, setPassBundleCountdown] = useState(null);
  const [isReturnInspection, setIsReturnInspection] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [defectTrackingDetails, setDefectTrackingDetails] = useState(null);
  const [repairStatuses, setRepairStatuses] = useState({});
  const [showDefectBoxes, setShowDefectBoxes] = useState(!isReturnInspection);
  const bluetoothRef = useRef();
  const isBluetoothConnected = bluetoothState.isConnected;
  const activeFilter = categoryFilter || defectTypeFilter;
  const [lockedGarments, setLockedGarments] = useState(new Set());
  const [rejectedGarmentNumbers, setRejectedGarmentNumbers] = useState(
    new Set()
  );
  const [lockedDefects, setLockedDefects] = useState(new Set());
  const [rejectedGarmentDefects, setRejectedGarmentDefects] = useState(
    new Set()
  );
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [isPassingBundle, setIsPassingBundle] = useState(false);
  const [locallyRejectedDefects, setLocallyRejectedDefects] = useState(
    new Set()
  );

  const [defectsData, setDefectsData] = useState([]);
  const [defectsLoading, setDefectsLoading] = useState(true);
  const [defectsError, setDefectsError] = useState(null);

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        setDefectsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
        if (!response.ok) {
          throw new Error("Failed to fetch defect data from the server.");
        }
        const data = await response.json();
        setDefectsData(data);
        setDefectsError(null);
      } catch (err) {
        console.error("Error fetching defects:", err);
        setDefectsError(err.message);
      } finally {
        setDefectsLoading(false);
      }
    };
    fetchDefects();
  }, []);

  const defectQty = isReturnInspection
    ? sessionData?.sessionDefectsQty || 0
    : Object.values(confirmedDefects).reduce((a, b) => a + b, 0);
  const hasDefects = Object.values(tempDefects).some((count) => count > 0);

  useEffect(() => {
    if (activeTab === "first" && !inDefectWindow && !scanning) {
      handleStartScanner();
    }
  }, [activeTab, inDefectWindow, scanning]);

  useEffect(() => {
    if (bundleData && !isReturnInspection) {
      setTotalPass(bundleData.passQtyIron || 0);
      setTotalRejects(0);
      setTotalRepair(0);
      setConfirmedDefects({});
      setTempDefects({});
      setBundlePassed(false);
      setRejectedOnce(false);
      setInDefectWindow(true);
      setScanning(false);
      setRejectedGarments([]);
      setQrCodesData({ repair: [], garment: [], bundle: [] });
      setGenerateQRDisabled(false);
      setIsReturnInspection(false);
      setSessionData(null);
    }
  }, [bundleData, isReturnInspection]);

  useEffect(() => {
    if (Object.values(tempDefects).some((count) => count > 0) && rejectedOnce) {
      setRejectedOnce(false);
    }
  }, [tempDefects, rejectedOnce]);

  const handlePassBundle = useCallback(async () => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    if (isPassingBundle) return;
    setIsPassingBundle(true);

    const hasDefects = Object.values(tempDefects).some((count) => count > 0);
    if (!isReturnInspection && hasDefects && !rejectedOnce) {
      setIsPassingBundle(false);
      return;
    }

    try {
      if (isReturnInspection) {
        if (!sessionData || !bundleData || !sessionData.printEntry) {
          throw new Error("Missing required session or bundle data");
        }
        const hasFailDefects = defectTrackingDetails.garments.some((garment) =>
          garment.defects.some(
            (defect) =>
              defect.status === "Fail" &&
              !lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
          )
        );
        if (hasFailDefects) {
          Swal.fire({
            icon: "error",
            title: "Cannot Pass Bundle",
            text: "There are still failed defects. Please resolve them before passing the bundle."
          });
          setIsPassingBundle(false);
          return;
        }
        const allGarmentsPassed = defectTrackingDetails.garments.every(
          (garment) =>
            garment.defects.every(
              (defect) =>
                defect.status === "OK" ||
                lockedDefects.has(`${garment.garmentNumber}-${defect.name}`)
            )
        );
        if (!allGarmentsPassed) {
          Swal.fire({
            icon: "error",
            title: "Cannot Pass Bundle",
            text: "Not all defects for each garment are marked as OK. Please review and correct the defect status before passing the bundle."
          });
          setIsPassingBundle(false);
          return;
        }
        const {
          sessionTotalPass,
          sessionTotalRejects,
          sessionRejectedGarments,
          inspectionNo,
          printEntry,
          initialTotalPass
        } = sessionData;
        const newTotalRejectGarmentCount = initialTotalPass - sessionTotalPass;
        const updatePayload = {
          $set: {
            totalRepair:
              sessionTotalRejects > 0
                ? bundleData.totalRepair - sessionTotalPass
                : 0,
            totalPass: bundleData.totalPass + sessionTotalPass,
            "printArray.$[elem].totalRejectGarmentCount":
              newTotalRejectGarmentCount,
            "printArray.$[elem].isCompleted": newTotalRejectGarmentCount === 0
          }
        };
        if (sessionTotalRejects > 0) {
          updatePayload.$push = {
            "printArray.$[elem].repairGarmentsDefects": {
              inspectionNo,
              repairGarments: sessionRejectedGarments
            }
          };
        }
        const arrayFilters = [
          { "elem.defect_print_id": printEntry.defect_print_id }
        ];
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updateOperations: updatePayload,
              arrayFilters
            })
          }
        );
        if (!response.ok) throw new Error(await response.text());
        if (sessionData.printEntry.defect_print_id) {
          await updatePassBundleStatusForOKDefects(
            sessionData.printEntry.defect_print_id
          );
        }
        setIsReturnInspection(false);
        setSessionData(null);
      } else {
        const inspectionTime = new Date().toLocaleTimeString("en-US", {
          hour12: false
        });
        const updatePayload = { $set: { inspection_time: inspectionTime } };
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload)
          }
        );
        if (!response.ok) throw new Error(await response.text());
      }

      setTotalPass(0);
      setTotalRejects(0);
      setTotalRepair(0);
      setConfirmedDefects({});
      setTempDefects({});
      setBundlePassed(true);
      setRejectedOnce(false);
      setBundleData(null);
      setInDefectWindow(false);
      setScanning(true);
      setRejectedGarments([]);
      setQrCodesData({ repair: [], garment: [], bundle: [] });
      setGenerateQRDisabled(false);
      setPassBundleCountdown(null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to update inspection record");
    } finally {
      setIsPassingBundle(false);
      setLoadingData(false);
    }
  }, [
    isPassingBundle,
    isReturnInspection,
    tempDefects,
    rejectedOnce,
    sessionData,
    bundleData,
    defectTrackingDetails,
    lockedDefects
  ]);

  useEffect(() => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    let timer;
    if (passBundleCountdown !== null && !isPassingBundle) {
      if (passBundleCountdown > 0) {
        timer = setInterval(() => {
          setPassBundleCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handlePassBundle();
        setPassBundleCountdown(null);
      }
    }
    return () => clearInterval(timer);
  }, [passBundleCountdown, isPassingBundle, handlePassBundle]);

  const generateDefectId = () =>
    Math.random().toString(36).substring(2, 12).toUpperCase();
  const generateGarmentDefectId = () =>
    Math.floor(1000000000 + Math.random() * 9000000000).toString();

  const computeDefectArray = useCallback(() => {
    return Object.keys(confirmedDefects)
      .filter((key) => confirmedDefects[key] > 0)
      .map((key) => ({
        defectName: defectsData[key]?.english || "Unknown",
        totalCount: confirmedDefects[key]
      }));
  }, [confirmedDefects, defectsData]);

  const groupDefectsByRepair = useCallback(() => {
    const groups = {};
    Object.entries(confirmedDefects).forEach(([index, count]) => {
      const defect = defectsData[parseInt(index)];
      if (!defect || count === 0) return;
      const repair = defect.repair;
      if (!groups[repair]) {
        groups[repair] = { defects: [], totalCount: 0, defectChunks: [] };
      }
      groups[repair].defects.push({ defectName: defect.english, count });
      groups[repair].totalCount += count;
    });
    Object.values(groups).forEach((group) => {
      const chunkSize = 3;
      let tempDefects = [];
      let countPrint = 0;
      group.defects.forEach((defect) => {
        tempDefects.push(defect);
        countPrint += defect.count;
        if (tempDefects.length === chunkSize) {
          group.defectChunks.push({
            defects: tempDefects,
            count_print: countPrint
          });
          tempDefects = [];
          countPrint = 0;
        }
      });
      if (tempDefects.length > 0) {
        group.defectChunks.push({
          defects: tempDefects,
          count_print: countPrint
        });
      }
    });
    return groups;
  }, [confirmedDefects, defectsData]);

  const groupRejectedGarmentsForBundle = useCallback(() => {
    const maxLinesPerPaper = 7;
    const chunks = [];
    let currentChunk = [];
    let currentLineCount = 0;
    rejectedGarments.forEach((garment) => {
      const defectCount = garment.defects.length;
      const linesNeeded = defectCount > 6 ? 7 : defectCount;
      if (
        currentLineCount + linesNeeded > maxLinesPerPaper &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLineCount = 0;
      }
      currentChunk.push(garment);
      currentLineCount += linesNeeded;
    });
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    return chunks;
  }, [rejectedGarments]);

  const handleStartScanner = () => {
    setScanning(true);
    setInDefectWindow(false);
  };

  const fetchBundleData = useCallback(
    async (randomId) => {
      // THIS FUNCTION IS UNCHANGED AND CORRECT
      try {
        setLoadingData(true);
        const response = await fetch(
          `${API_BASE_URL}/api/bundle-by-random-id/${randomId}`
        );
        if (!response.ok) throw new Error("Bundle not found");
        const data = await response.json();
        const ironingEntry = data.inspectionFirst?.find(
          (entry) => entry.process === "ironing"
        );
        if (!ironingEntry) {
          setError(
            "This bundle has not been ironed yet. Please wait until it is ironed."
          );
          setBundleData(null);
          setInDefectWindow(false);
          setScanning(false);
        } else {
          const passQtyIron = ironingEntry.passQty || 0;
          const initialPayload = {
            package_no: data.package_no,
            moNo: data.selectedMono,
            custStyle: data.custStyle,
            color: data.color,
            size: data.size,
            lineNo: data.lineNo,
            department: data.department,
            buyer: data.buyer,
            factory: data.factory,
            country: data.country,
            sub_con: data.sub_con,
            sub_con_factory: data.sub_con_factory,
            checkedQty: passQtyIron,
            totalPass: passQtyIron,
            totalRejects: 0,
            totalRepair: 0,
            defectQty: 0,
            defectArray: [],
            rejectGarments: [],
            inspection_time: "",
            inspection_date: new Date().toLocaleDateString("en-US"),
            emp_id_inspection: user.emp_id,
            eng_name_inspection: user.eng_name,
            kh_name_inspection: user.kh_name,
            job_title_inspection: user.job_title,
            dept_name_inspection: user.dept_name,
            sect_name_inspection: user.sect_name,
            bundle_id: data.bundle_id,
            bundle_random_id: data.bundle_random_id,
            printArray: []
          };
          const createResponse = await fetch(
            `${API_BASE_URL}/api/inspection-pass-bundle`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(initialPayload)
            }
          );
          if (!createResponse.ok)
            throw new Error("Failed to create inspection record");
          setBundleData({ ...data, passQtyIron });
          setTotalRepair(0);
          setInDefectWindow(true);
          setScanning(false);
          setError(null);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch bundle data");
        setBundleData(null);
      } finally {
        setLoadingData(false);
      }
    },
    [user]
  );

  const handleDefectCardScan = useCallback(
    async (bundleData, defect_print_id) => {
      // THIS FUNCTION IS UNCHANGED AND CORRECT
      try {
        const printEntry = bundleData.printArray.find(
          (entry) =>
            entry.defect_print_id === defect_print_id && !entry.isCompleted
        );
        if (!printEntry)
          throw new Error(
            "This defect card is already completed or does not exist"
          );
        const maxInspectionNo =
          (printEntry.repairGarmentsDefects?.length > 0
            ? Math.max(
                ...printEntry.repairGarmentsDefects.map((r) => r.inspectionNo)
              )
            : 1) || 1;
        const inspectionNo = maxInspectionNo + 1;
        const newSessionData = {
          bundleData,
          printEntry,
          totalRejectGarmentCount: printEntry.totalRejectGarmentCount,
          initialTotalPass: printEntry.totalRejectGarmentCount,
          sessionTotalPass: printEntry.totalRejectGarmentCount,
          sessionTotalRejects: 0,
          sessionDefectsQty: 0,
          sessionRejectedGarments: [],
          inspectionNo
        };
        setSessionData(newSessionData);
        setBundleData(bundleData);
        setTotalPass(printEntry.totalRejectGarmentCount);
        setTotalRejects(0);
        setTotalRepair(bundleData.totalRepair);
        setIsReturnInspection(true);
        setInDefectWindow(true);
        setScanning(false);
        setError(null);
        const trackingResponse = await fetch(
          `${API_BASE_URL}/api/defect-track/${defect_print_id}`
        );
        if (!trackingResponse.ok)
          throw new Error("Failed to fetch defect tracking details");
        const trackingData = await trackingResponse.json();
        setDefectTrackingDetails(trackingData); // This sets the raw data
        const initialStatuses = {};
        const initialLockedDefects = new Set();
        const initialRejectedGarmentDefects = new Set();
        trackingData.garments.forEach((garment) => {
          garment.defects.forEach((defect) => {
            const key = `${garment.garmentNumber}-${defect.name}`;
            initialStatuses[key] = defect.status || "Fail";
            if (defect.status === "Fail") {
              initialLockedDefects.add(key);
              initialRejectedGarmentDefects.add(garment.garmentNumber);
            }
          });
        });
        setRepairStatuses(initialStatuses);
        setLockedDefects(initialLockedDefects);
        setRejectedGarmentDefects(initialRejectedGarmentDefects);
      } catch (err) {
        setError(err.message);
        setInDefectWindow(false);
        setScanning(false);
      }
    },
    []
  );

  // --- FIX #1: Corrected handleDefectStatusToggle function ---
  const handleDefectStatusToggle = (garmentNumber, defectName) => {
    const key = `${garmentNumber}-${defectName}`;
    if (rejectedGarmentDefects.has(garmentNumber)) return;
    if (lockedDefects.has(key)) {
      Swal.fire({
        icon: "error",
        title: "Defect Locked",
        text: "This defect is locked and cannot be changed."
      });
      return;
    }
    if (
      selectedGarment &&
      selectedGarment !== garmentNumber &&
      Object.keys(tempDefects).length > 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Pending Defects",
        text: "Please reject or clear defects for the selected garment first."
      });
      return;
    }
    setSelectedGarment(garmentNumber);
    const newStatus = (repairStatuses[key] || "Fail") === "OK" ? "Fail" : "OK";
    setRepairStatuses((prev) => ({ ...prev, [key]: newStatus }));
    setDefectTrackingDetails((prev) => {
      if (!prev) return prev;
      const updatedGarments = prev.garments.map((garment) => {
        if (garment.garmentNumber === garmentNumber) {
          const updatedDefects = garment.defects.map((defect) => {
            if (defect.name === defectName) {
              let newPassBundleStatus = defect.pass_bundle;
              // ... (Your existing logic for tempDefects is fine)
              setTempDefects((prevTempDefects) => {
                const defectIndex = defectsData.findIndex(
                  (d) => d.english === defectName
                );
                if (defectIndex === -1) return prevTempDefects;
                const newTempDefects = { ...prevTempDefects };
                if (newStatus === "Fail") {
                  newTempDefects[defectIndex] = defect.count;
                  setRejectedOnce(true);
                  setRejectedGarmentDefects((prevSet) =>
                    new Set(prevSet).add(garmentNumber)
                  );
                } else {
                  delete newTempDefects[defectIndex];
                  setRejectedGarmentDefects((prevSet) => {
                    const newSet = new Set(prevSet);
                    newSet.delete(garmentNumber);
                    return newSet;
                  });
                }
                return newTempDefects;
              });
              if (newStatus === "Fail") {
                newPassBundleStatus = "Fail";
                setLockedDefects((prevLocked) => new Set(prevLocked).add(key));
              } else if (newStatus === "OK" && defect.status === "Fail") {
                newPassBundleStatus = "Not Checked";
                setLockedDefects((prevLocked) => {
                  const newSet = new Set(prevLocked);
                  newSet.delete(key);
                  return newSet;
                });
              }
              updateDefectStatusInRepairTrackingAndPassBundle(
                sessionData.printEntry.defect_print_id,
                garmentNumber,
                defect.name,
                newStatus,
                newPassBundleStatus
              );

              // --- THIS IS THE CRITICAL FIX ---
              // Find the full defect entry from our master list
              const defectEntry = defectsData.find(
                (d) => d.english === defect.name
              );
              // Recalculate the displayName using the current language
              const newDisplayName = defectEntry
                ? defectEntry[language] || defectEntry.english
                : defect.name;

              return {
                ...defect,
                status: newStatus,
                pass_bundle: newPassBundleStatus,
                displayName: newDisplayName // Persist the translated name
              };
            }
            return defect;
          });
          return { ...garment, defects: updatedDefects };
        }
        return garment;
      });
      return { ...prev, garments: updatedGarments };
    });
  };

  const updateDefectStatusInRepairTracking = async (
    defect_print_id,
    garmentNumber,
    defectName,
    status
  ) => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    try {
      const payload = { defect_print_id, garmentNumber, defectName, status };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error(await response.text());
    } catch (err) {
      setError(`Failed to update defect status: ${err.message}`);
      throw err;
    }
  };

  const updateDefectStatusInRepairTrackingAndPassBundle = async (
    defect_print_id,
    garmentNumber,
    defectName,
    status,
    passBundleStatus
  ) => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    try {
      let finalPassBundleStatus = passBundleStatus;
      if (status === "OK" && passBundleStatus !== "Pass") {
        finalPassBundleStatus = "Pass";
      }
      const payload = {
        defect_print_id,
        garmentNumber,
        defectName,
        status,
        pass_bundle: finalPassBundleStatus
      };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error(await response.text());
    } catch (err) {
      setError(
        `Failed to update defect status in repair tracking: ${err.message}`
      );
    }
  };

  const handleScanSuccess = useCallback(
    async (scannedData) => {
      // THIS FUNCTION IS UNCHANGED AND CORRECT
      setLoadingData(true);
      try {
        const defectResponse = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData}`
        );
        if (defectResponse.ok) {
          const bundleData = await defectResponse.json();
          await handleDefectCardScan(bundleData, scannedData);
          return;
        }
        const inspectionResponse = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-random-id/${scannedData}`
        );
        if (inspectionResponse.ok) {
          const inspectionData = await inspectionResponse.json();
          setError(
            inspectionData.totalPass === 0
              ? "This bundle already finished inspection"
              : "Please scan defect card for Return Garments"
          );
          setScanning(false);
        } else {
          await fetchBundleData(scannedData);
        }
      } catch (err) {
        setError(`Error processing scan: ${err.message}`);
      } finally {
        setLoadingData(false);
      }
    },
    [fetchBundleData, handleDefectCardScan]
  );

  const handleScanError = useCallback((err) => {
    setError(err.message || "Failed to process scanned data");
  }, []);

  const handleRejectGarment = async () => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    if (!hasDefects || totalPass <= 0) return;
    if (isReturnInspection) {
      const actualGarmentNumber = selectedGarment;
      if (!actualGarmentNumber) {
        setError("No garment selected for rejection.");
        return;
      }
      setRejectedGarmentNumbers((prev) =>
        new Set(prev).add(actualGarmentNumber)
      );
      const newSessionData = { ...sessionData };
      newSessionData.sessionTotalPass -= 1;
      newSessionData.sessionTotalRejects += 1;
      const garmentDefects = Object.keys(tempDefects)
        .filter((key) => tempDefects[key] > 0)
        .map((key) => ({
          name: defectsData[key]?.english || "Unknown",
          count: tempDefects[key],
          garmentNumber: selectedGarment
        }));
      const totalDefectCount = garmentDefects.reduce(
        (sum, d) => sum + d.count,
        0
      );
      newSessionData.sessionDefectsQty += totalDefectCount;
      const reReturnGarment = {
        garment: {
          garmentNumber: actualGarmentNumber,
          time: new Date().toLocaleTimeString("en-US", { hour12: false })
        },
        defects: garmentDefects.map((defect) => ({
          name: defect.name,
          count: defect.count,
          repair:
            defectsData.find((d) => d.english === defect.name)?.repair ||
            "Unknown"
        }))
      };
      newSessionData.sessionRejectedGarments.push({
        totalDefectCount,
        repairDefectArray: garmentDefects,
        garmentNumber: actualGarmentNumber
      });
      setSessionData(newSessionData);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTempDefects({});
      setSelectedGarment(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updateOperations: {
                $push: {
                  "printArray.$[elem].re_return_garment": reReturnGarment
                }
              },
              arrayFilters: [
                {
                  "elem.defect_print_id": sessionData.printEntry.defect_print_id
                }
              ]
            })
          }
        );
        if (!response.ok) throw new Error(await response.text());
        setLockedGarments((prev) => new Set(prev).add(actualGarmentNumber));
        reReturnGarment.defects.forEach((defect) => {
          const defectKey = `${actualGarmentNumber}-${defect.name}`;
          setLockedDefects((prev) => new Set(prev).add(defectKey));
          setRepairStatuses((prevStatuses) => ({
            ...prevStatuses,
            [defectKey]: "Fail"
          }));
        });
        setRejectedGarmentDefects((prev) =>
          new Set(prev).add(actualGarmentNumber)
        );
        await handleReReturnGarment(actualGarmentNumber, garmentDefects);
        for (const defect of reReturnGarment.defects) {
          await updateDefectStatusInRepairTracking(
            sessionData.printEntry.defect_print_id,
            actualGarmentNumber,
            defect.name,
            "Fail"
          );
        }
      } catch (err) {
        setError(`Failed to process garment rejection: ${err.message}`);
      }
    } else {
      const newConfirmed = { ...confirmedDefects };
      const currentTempDefects = { ...tempDefects };
      Object.keys(currentTempDefects).forEach((key) => {
        if (currentTempDefects[key] > 0)
          newConfirmed[key] =
            (newConfirmed[key] || 0) + currentTempDefects[key];
      });
      setConfirmedDefects(newConfirmed);
      setTempDefects({});
      setSelectedGarment(null);
      setTotalPass((prev) => prev - 1);
      setTotalRejects((prev) => prev + 1);
      setTotalRepair((prev) => prev + 1);
      setRejectedOnce(true);
      const garmentDefectId = generateGarmentDefectId();
      const defects = Object.keys(currentTempDefects)
        .filter((key) => currentTempDefects[key] > 0)
        .map((key) => {
          const defect = defectsData[parseInt(key)];
          return {
            name: defect?.english || "Unknown",
            count: currentTempDefects[key],
            repair: defect?.repair || "Unknown"
          };
        });
      const totalCount = defects.reduce((sum, d) => sum + d.count, 0);
      const newRejectGarment = {
        totalCount,
        defects,
        garment_defect_id: garmentDefectId,
        rejectTime: new Date().toLocaleTimeString("en-US", { hour12: false })
      };
      const newRejectedGarments = [...rejectedGarments, newRejectGarment];
      setRejectedGarments(newRejectedGarments);
      const updatePayload = {
        totalPass: totalPass - 1,
        totalRejects: totalRejects + 1,
        totalRepair: totalRepair + 1,
        defectQty: defectQty + totalCount,
        rejectGarments: newRejectedGarments
      };
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload)
          }
        );
        if (!response.ok) throw new Error(await response.text());
        await updatePassBundleStatusForRejectedGarment(garmentDefectId);
      } catch (err) {
        setError(`Failed to update inspection record: ${err.message}`);
      }
    }
  };

  const updatePassBundleStatusForRejectedGarment = async (garmentNumber) => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    try {
      const rejectedGarment = rejectedGarments.find(
        (garment) => garment.garment_defect_id === garmentNumber
      );
      if (!rejectedGarment) {
        console.error(
          `Rejected garment with number ${garmentNumber} not found.`
        );
        return;
      }
      const updatePromises = rejectedGarment.defects.map(async (defect) => {
        let defect_print_id;
        if (isReturnInspection) {
          defect_print_id = sessionData.printEntry.defect_print_id;
        } else {
          defect_print_id = bundleData.printArray.find(
            (item) => item.defect_print_id
          ).defect_print_id;
        }
        const payload = {
          defect_print_id: defect_print_id,
          garmentNumber: garmentNumber,
          defectName: defect.name,
          status: "Fail"
        };
        await updateDefectStatusInRepairTracking(
          defect_print_id,
          garmentNumber,
          defect.name,
          "Fail"
        );
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to update pass_bundle status for defect ${defect.name}: ${errorText}`
          );
        }
      });
      await Promise.all(updatePromises);
    } catch (err) {
      setError(
        `Failed to update pass_bundle status for rejected garment ${garmentNumber}: ${err.message}`
      );
    }
  };

  const handleReReturnGarment = async (garmentNumber, garmentDefects) => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    try {
      const failedDefects = garmentDefects.map((defect) => ({
        name: defect.name,
        count: defect.count,
        status: "Fail",
        pass_bundle: "Fail"
      }));
      const payload = {
        defect_print_id: sessionData.printEntry.defect_print_id,
        garmentNumber,
        failedDefects,
        isRejecting: true
      };
      const repairUpdateResponse = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!repairUpdateResponse.ok) {
        const errorText = await repairUpdateResponse.text();
        throw new Error(`Failed to update repair tracking: ${errorText}`);
      }
    } catch (err) {
      setError(`Failed to update repair tracking: ${err.message}`);
    }
  };

  const handleGenerateQRCodes = async () => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    if (generateQRDisabled || isReturnInspection) return;
    setGenerateQRDisabled(true);
    const now = new Date();
    const print_time = now.toLocaleTimeString("en-US", { hour12: false });
    const inspection_date = now.toLocaleDateString("en-US");
    const repairQrCodes = [];
    const garmentQrCodes = [];
    const bundleQrCodes = [];
    const defectGroups = groupDefectsByRepair();
    for (const [repair, group] of Object.entries(defectGroups)) {
      for (const chunk of group.defectChunks) {
        const defectId = generateDefectId();
        const qrData = {
          factory: bundleData.factory || "YM",
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          custStyle: bundleData.custStyle,
          color: bundleData.color,
          size: bundleData.size,
          repair,
          count: group.totalCount,
          count_print: chunk.count_print,
          defects: chunk.defects,
          inspection_time: print_time,
          defect_id: defectId,
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: bundleData.bundle_id,
          bundle_random_id: bundleData.bundle_random_id
        };
        try {
          const response = await fetch(`${API_BASE_URL}/api/qc2-defect-print`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(qrData)
          });
          if (!response.ok) throw new Error("Failed to save defect print data");
          repairQrCodes.push(qrData);
        } catch (error) {
          setError(`Failed to generate QR codes (Repair): ${error.message}`);
          setGenerateQRDisabled(false);
          return;
        }
      }
    }
    garmentQrCodes.push(
      ...rejectedGarments.map((garment) => {
        const defectId = generateDefectId();
        const garmentDefectId = garment.garment_defect_id;
        const defectsWithRepair = garment.defects.map((d) => ({
          name: d.name,
          count: d.count,
          repair:
            defectsData.find((def) => def.english === d.name)?.repair ||
            "Unknown"
        }));
        return {
          factory: bundleData.factory || "YM",
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          custStyle: bundleData.custStyle,
          color: bundleData.color,
          size: bundleData.size,
          lineNo: bundleData.lineNo,
          department: bundleData.department,
          checkedQty: bundleData.passQtyIron,
          totalPass,
          totalRejects,
          defectQty: garment.totalCount,
          rejectGarments: [
            {
              totalCount: garment.totalCount,
              defects: defectsWithRepair,
              garment_defect_id: garmentDefectId
            }
          ],
          inspection_time: print_time,
          inspection_date,
          emp_id_inspection: user.emp_id,
          eng_name_inspection: user.eng_name,
          kh_name_inspection: user.kh_name,
          job_title_inspection: user.job_title,
          dept_name_inspection: user.dept_name,
          sect_name_inspection: user.sect_name,
          bundle_id: bundleData.bundle_id,
          bundle_random_id: bundleData.bundle_random_id,
          defect_id: defectId,
          count: garment.totalCount,
          defects: defectsWithRepair
        };
      })
    );
    if (rejectedGarments.length > 0) {
      const chunks = groupRejectedGarmentsForBundle();
      chunks.forEach((chunk) => {
        const defectPrintId = generateGarmentDefectId();
        const totalRejectGarmentCount = chunk.length;
        const totalPrintDefectCount = chunk.reduce(
          (sum, garment) => sum + garment.totalCount,
          0
        );
        const printData = chunk.map((garment, index) => {
          const defects =
            garment.defects.length > 6
              ? [
                  ...garment.defects.slice(0, 6).map((d) => ({
                    name: d.name,
                    count: d.count,
                    repair: d.repair || "Unknown"
                  })),
                  {
                    name: "Others",
                    count: garment.defects
                      .slice(6)
                      .reduce((sum, d) => sum + d.count, 0),
                    repair: "Various"
                  }
                ]
              : garment.defects.map((d) => ({
                  name: d.name,
                  count: d.count,
                  repair: d.repair || "Unknown"
                }));
          return { garmentNumber: index + 1, defects };
        });
        bundleQrCodes.push({
          package_no: bundleData.package_no,
          moNo: bundleData.selectedMono,
          color: bundleData.color,
          size: bundleData.size,
          lineNo: bundleData.lineNo,
          bundleQty: bundleData.passQtyIron,
          totalRejectGarments: totalRejectGarmentCount,
          totalRejectGarment_Var: totalRejectGarmentCount,
          totalDefectCount: totalPrintDefectCount,
          defects: printData,
          defect_print_id: defectPrintId
        });
      });
    }
    setQrCodesData({
      repair: repairQrCodes,
      garment: garmentQrCodes,
      bundle: bundleQrCodes
    });
    const defectArray = computeDefectArray();
    const updatePayload = {
      inspection_time: print_time,
      defectArray: defectArray
    };
    if (bundleQrCodes.length > 0) {
      updatePayload.printArray = bundleQrCodes.map((qrCode) => ({
        method: "bundle",
        defect_print_id: qrCode.defect_print_id,
        totalRejectGarmentCount: qrCode.totalRejectGarments,
        totalRejectGarment_Var: qrCode.totalRejectGarment_Var,
        totalPrintDefectCount: qrCode.totalDefectCount,
        repairGarmentsDefects: [],
        printData: qrCode.defects,
        isCompleted: false
      }));
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle/${bundleData.bundle_random_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
        }
      );
      if (!response.ok) throw new Error("Failed to update inspection record");
    } catch (err) {
      setError(`Failed to update inspection record: ${err.message}`);
      setGenerateQRDisabled(false);
      return;
    }
  };

  const handlePrintQRCode = async () => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    if (!isBluetoothConnected || isReturnInspection) {
      alert("Please connect to a printer first");
      return;
    }
    if (!bluetoothRef.current) {
      alert("Bluetooth reference is not initialized.");
      return;
    }
    try {
      setPrinting(true);
      const selectedQrCodes = qrCodesData[printMethod];
      for (const qrCode of selectedQrCodes) {
        if (printMethod === "repair") {
          await bluetoothRef.current.printDefectData(qrCode);
        } else if (printMethod === "garment") {
          await bluetoothRef.current.printGarmentDefectData(qrCode);
          if (!passBundleCountdown) setPassBundleCountdown(5);
        } else if (printMethod === "bundle") {
          await bluetoothRef.current.printBundleDefectData(qrCode);
        }
      }
      if (totalRejects > 0) {
        setPassBundleCountdown(3);
      }
    } catch (error) {
      console.error("Print error:", error);
      alert(`Failed to print QR codes: ${error.message || "Unknown error"}`);
    } finally {
      setPrinting(false);
    }
  };

  const updatePassBundleStatusForOKDefects = async (defect_print_id) => {
    // THIS FUNCTION IS UNCHANGED AND CORRECT
    try {
      const payload = { defect_print_id: defect_print_id, pass_bundle: "Pass" };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-pass-bundle-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update pass_bundle status for defect ${defect_print_id}: ${errorText}`
        );
      }
    } catch (err) {
      setError(
        `Failed to update pass_bundle status for OK defects: ${err.message}`
      );
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  // --- FIX #2: Corrected Translation useEffect ---
  useEffect(() => {
    if (defectTrackingDetails && defectsData.length > 0) {
      const updatedDetails = {
        ...defectTrackingDetails,
        garments: defectTrackingDetails.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = defectsData.find(
              (d) => d.english === defect.name
            );
            // Use the current `language` from state to get the translation
            const displayName = defectEntry
              ? defectEntry[language] || defectEntry.english
              : defect.name;
            return { ...defect, displayName };
          })
        }))
      };
      setDefectTrackingDetails(updatedDetails);
    }
    // Add `defectTrackingDetails` to the dependency array.
    // This ensures that if the raw data is ever re-fetched (e.g., new scan),
    // the translation logic will re-run.
  }, [language, defectsData, defectTrackingDetails]);

  useEffect(() => {
    setShowDefectBoxes(!isReturnInspection);
  }, [isReturnInspection]);

  if (defectsLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100 text-indigo-700">
        <Loader2 className="w-10 h-10 animate-spin mr-4" />
        <span className="text-xl font-semibold">Loading Defect Data...</span>
      </div>
    );
  }

  if (defectsError) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50 text-red-700">
        <AlertCircle className="w-10 h-10 mr-4" />
        <span className="text-xl font-semibold">Error: {defectsError}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <QC2InspectionSidebar
        handleLanguageChange={handleLanguageChange}
        defectTypeFilter={defectTypeFilter}
        setDefectTypeFilter={setDefectTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        printMethod={printMethod}
        setPrintMethod={setPrintMethod}
        bluetoothRef={bluetoothRef}
        isBluetoothConnected={isBluetoothConnected}
      />
      <div style={{ position: "absolute", left: "-9999px" }}>
        <BluetoothComponent ref={bluetoothRef} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md p-3 sticky top-0 z-20">
          <QC2InspectionPageTitle user={user} />
          {!inDefectWindow && (
            <QC2InspectionTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </header>

        <main className="flex-grow overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md m-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {activeTab === "edit" && <EditInspection />}
          {activeTab === "return" && <DefectNames />}
          {activeTab === "data" && <QC2Data />}
          {activeTab === "defect-cards" && (
            <DefectPrint
              bluetoothRef={bluetoothRef}
              printMethod={printMethod}
            />
          )}

          {activeTab === "first" &&
            (!inDefectWindow ? (
              <QC2InspectionScannerView
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                loadingData={loadingData}
              />
            ) : (
              <QC2InspectionWindow
                defectsData={defectsData}
                bundleData={bundleData}
                isReturnInspection={isReturnInspection}
                sessionData={sessionData}
                totalPass={totalPass}
                totalRejects={totalRejects}
                defectQty={defectQty}
                hasDefects={hasDefects}
                selectedGarment={selectedGarment}
                rejectedGarmentNumbers={rejectedGarmentNumbers}
                qrCodesData={qrCodesData}
                printMethod={printMethod}
                isPassingBundle={isPassingBundle}
                rejectedOnce={rejectedOnce}
                passBundleCountdown={passBundleCountdown}
                generateQRDisabled={generateQRDisabled}
                isBluetoothConnected={isBluetoothConnected}
                printing={printing}
                handleRejectGarment={handleRejectGarment}
                handlePassBundle={handlePassBundle}
                handleGenerateQRCodes={handleGenerateQRCodes}
                handlePrintQRCode={handlePrintQRCode}
                setShowQRPreview={setShowQRPreview}
                defectTrackingDetails={defectTrackingDetails}
                language={language}
                handleLanguageChange={handleLanguageChange}
                lockedGarments={lockedGarments}
                repairStatuses={repairStatuses}
                handleDefectStatusToggle={handleDefectStatusToggle}
                rejectedGarmentDefects={rejectedGarmentDefects}
                showDefectBoxes={showDefectBoxes}
                tempDefects={tempDefects}
                setTempDefects={setTempDefects}
                activeFilter={activeFilter}
                confirmedDefects={confirmedDefects}
                sortOption={sortOption}
              />
            ))}
        </main>
      </div>

      <QRCodePreview
        isOpen={showQRPreview}
        onClose={() => setShowQRPreview(false)}
        qrData={qrCodesData[printMethod]}
        onPrint={handlePrintQRCode}
        mode={printMethod === "repair" ? "inspection" : printMethod}
      />
    </div>
  );
};

export default QC2InspectionPage;
