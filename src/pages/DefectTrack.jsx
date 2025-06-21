// import React, { useState } from "react";
// import { API_BASE_URL } from "../../config";
// import { allDefects } from "../constants/defects";
// import Swal from "sweetalert2";
// import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
// import { useAuth } from "../components/authentication/AuthContext";
// import {
//   Button,
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
//   Paper
// } from "@mui/material";

// const DefectTrack = () => {
//   const { user, loading: authLoading } = useAuth();
//   const [scannedData, setScannedData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [language, setLanguage] = useState("khmer");
//   const [showScanner, setShowScanner] = useState(true);
//   const [tempOkDefects, setTempOkDefects] = useState([]);

//   const onScanSuccess = async (decodedText) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/defect-track/${decodedText}`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch defect data");
//       }
//       const data = await response.json();
//       const mappedData = {
//         ...data,
//         garments: data.garments.map((garment) => ({
//           ...garment,
//           defects: garment.defects.map((defect) => {
//             const defectEntry = allDefects.find(
//               (d) => d.english === defect.name
//             );
//             return {
//               ...defect,
//               displayName: defectEntry
//                 ? defectEntry[language] || defect.name
//                 : defect.name,
//               status: defect.status || "Fail"
//             };
//           })
//         }))
//       };
//       setScannedData(mappedData);
//       setShowScanner(false);
//       setTempOkDefects([]);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onScanError = (err) => {
//     setError(err);
//   };

//   const updateDefectStatusInRepairTracking = async (
//     defect_print_id,
//     garmentNumber,
//     defectName,
//     status
//   ) => {
//     try {
//       console.log("Updating defect status with:", {
//         defect_print_id,
//         garmentNumber,
//         defectName,
//         status
//       });
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
//       // if (!response.ok) {
//       //   const errorText = await response.text();
//       //   throw new Error(`Failed to update defect status in repair tracking: ${errorText}`);
//       // }
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

//   const handleOkClick = async (garmentNumber, defectName) => {
//     try {
//       setLoading(true);
//       setTempOkDefects((prev) => [...prev, { garmentNumber, defectName }]);
//       setScannedData((prev) => {
//         const updatedGarments = prev.garments.map((garment) => {
//           if (garment.garmentNumber === garmentNumber) {
//             const updatedDefects = garment.defects.map((defect) => {
//               if (defect.name === defectName) {
//                 const now = new Date();
//                 return {
//                   ...defect,
//                   status: "OK",
//                   repair_date: now.toLocaleDateString("en-US", {
//                     month: "2-digit",
//                     day: "2-digit",
//                     year: "numeric"
//                   }),
//                   repair_time: now.toLocaleTimeString("en-US", {
//                     hour12: false,
//                     hour: "2-digit",
//                     minute: "2-digit",
//                     second: "2-digit"
//                   }),
//                   garmentNumber: garment.garmentNumber
//                 };
//               }
//               return defect;
//             });
//             return { ...garment, defects: updatedDefects };
//           }
//           return garment;
//         });
//         return { ...prev, garments: updatedGarments };
//       });
//     } catch (error) {
//       setError(error.message);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: error.message
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!scannedData) return;
//     const repairArray = [];
//     scannedData.garments.forEach((garment) => {
//       garment.defects.forEach((defect) => {
//         repairArray.push({
//           defectName: defect.name,
//           defectCount: defect.count,
//           repairGroup: defect.repair,
//           status: defect.status || "Fail",
//           repair_date: defect.repair_date || "",
//           repair_time: defect.repair_time || "",
//           garmentNumber: garment.garmentNumber
//         });
//       });
//     });
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/repair-tracking`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           defect_print_id: scannedData.defect_print_id,
//           package_no: scannedData.package_no,
//           moNo: scannedData.moNo,
//           custStyle: scannedData.custStyle,
//           color: scannedData.color,
//           size: scannedData.size,
//           lineNo: scannedData.lineNo,
//           department: scannedData.department,
//           buyer: scannedData.buyer,
//           factory: scannedData.factory,
//           sub_con: scannedData.sub_con,
//           sub_con_factory: scannedData.sub_con_factory,
//           repairArray
//         })
//       });
//       if (!response.ok) {
//         throw new Error("Failed to save repair tracking");
//       }
//       for (const garment of scannedData.garments) {
//         for (const defect of garment.defects) {
//           if (defect.status === "OK") {
//             await updateDefectStatusInRepairTracking(
//               scannedData.defect_print_id,
//               garment.garmentNumber,
//               defect.name,
//               "OK"
//             );
//           }
//         }
//       }
//       Swal.fire({
//         icon: "success",
//         title: "Success",
//         text: "Repair tracking saved successfully!"
//       });
//       setScannedData(null);
//       setShowScanner(true);
//       setTempOkDefects([]);
//     } catch (err) {
//       setError(err.message);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: err.message
//       });
//     }
//   };

//   const handleCancel = () => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "Unsaved changes will be lost.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#3085d6",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, cancel!"
//     }).then((result) => {
//       if (result.isConfirmed) {
//         setScannedData(null);
//         setShowScanner(true);
//         setTempOkDefects([]);
//       }
//     });
//   };

//   const handleLanguageChange = (event) => {
//     const newLanguage = event.target.value;
//     setLanguage(newLanguage);
//     if (scannedData) {
//       setScannedData((prev) => ({
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

//   const isDefectTemporarilyOk = (garmentNumber, defectName) => {
//     return tempOkDefects.some(
//       (tempDefect) =>
//         tempDefect.garmentNumber === garmentNumber &&
//         tempDefect.defectName === defectName
//     );
//   };

//   if (authLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
//       <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Defect Tracking
//         </h1>
//         {showScanner && (
//           <div className="text-center mb-4">
//             <QrCodeScannerRepair
//               onScanSuccess={onScanSuccess}
//               onScanError={onScanError}
//             />
//           </div>
//         )}
//         {loading && (
//           <div className="text-center mt-4">
//             <p className="text-gray-700">Loading...</p>
//           </div>
//         )}
//         {error && (
//           <div className="text-center mt-4">
//             <p className="text-red-600">Error: {error}</p>
//           </div>
//         )}
//         {scannedData && (
//           <div className="mt-4">
//             <div className="bg-gray-50 rounded-lg p-4 mb-4">
//               <h3 className="text-xl font-semibold text-gray-800 mb-4">
//                 Defect Card Details
//               </h3>
//               <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
//                 <p className="text-gray-700">
//                   <strong>MO No:</strong> {scannedData.moNo}
//                 </p>
//                 <p className="text-gray-700">
//                   <strong>Line No:</strong> {scannedData.lineNo}
//                 </p>
//                 <p className="text-gray-700">
//                   <strong>Color:</strong> {scannedData.color}
//                 </p>
//                 <p className="text-gray-700">
//                   <strong>Size:</strong> {scannedData.size}
//                 </p>
//               </div>
//               <div className="flex justify-end mb-4">
//                 <FormControl variant="outlined" sx={{ minWidth: 200 }}>
//                   <InputLabel id="language-select-label">
//                     Select Language
//                   </InputLabel>
//                   <Select
//                     labelId="language-select-label"
//                     id="language-select"
//                     value={language}
//                     onChange={handleLanguageChange}
//                     label="Select Language"
//                   >
//                     <MenuItem value="english">English</MenuItem>
//                     <MenuItem value="khmer">Khmer</MenuItem>
//                     <MenuItem value="chinese">Chinese</MenuItem>
//                   </Select>
//                 </FormControl>
//               </div>
//             </div>
//             <TableContainer component={Paper} className="shadow-lg">
//               <Table className="min-w-full">
//                 <TableHead>
//                   <TableRow className="bg-gray-100 text-white">
//                     <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                       Garment Number
//                     </TableCell>
//                     <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                       Repair Group
//                     </TableCell>
//                     <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                       Defect Name ({language})
//                     </TableCell>
//                     <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                       Defect Count
//                     </TableCell>
//                     <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
//                       Action
//                     </TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {scannedData.garments.map((garment) =>
//                     garment.defects
//                       .filter(
//                         (defect) =>
//                           defect.status !== "OK" ||
//                           isDefectTemporarilyOk(
//                             garment.garmentNumber,
//                             defect.name
//                           )
//                       )
//                       .map((defect, index) => (
//                         <TableRow
//                           key={`${garment.garmentNumber}-${defect.name}-${index}`}
//                           className={
//                             defect.status === "OK"
//                               ? "bg-green-100"
//                               : "hover:bg-gray-100"
//                           }
//                         >
//                           <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                             {garment.garmentNumber}
//                           </TableCell>
//                           <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                             {defect.repair}
//                           </TableCell>
//                           <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                             {defect.displayName}
//                           </TableCell>
//                           <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                             {defect.count}
//                           </TableCell>
//                           <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                             <div className="flex justify-center">
//                               <button
//                                 onClick={() =>
//                                   handleOkClick(
//                                     garment.garmentNumber,
//                                     defect.name
//                                   )
//                                 }
//                                 disabled={
//                                   defect.status === "OK" &&
//                                   !isDefectTemporarilyOk(
//                                     garment.garmentNumber,
//                                     defect.name
//                                   )
//                                 }
//                                 className={`px-4 py-2 rounded ${
//                                   isDefectTemporarilyOk(
//                                     garment.garmentNumber,
//                                     defect.name
//                                   )
//                                     ? "bg-green-600"
//                                     : defect.status === "OK"
//                                     ? "bg-green-600"
//                                     : "bg-gray-400"
//                                 } text-white`}
//                               >
//                                 OK
//                               </button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//             <div className="flex justify-center mt-4 space-x-4">
//               <Button onClick={handleSave} variant="contained" color="primary">
//                 Save
//               </Button>
//               <Button
//                 onClick={handleCancel}
//                 variant="contained"
//                 color="secondary"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DefectTrack;

// import React, { useState, useEffect } from "react";
// import { API_BASE_URL } from "../../config";
// import Swal from "sweetalert2";
// import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
// import { useAuth } from "../components/authentication/AuthContext";
// import {
//   Button,
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
//   Box,
//   CircularProgress
// } from "@mui/material";
// import { CheckCircle, AlertTriangle, Ban } from "lucide-react";

// const DefectTrack = () => {
//   const { user, loading: authLoading } = useAuth();
//   const [scannedData, setScannedData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [language, setLanguage] = useState("khmer");
//   const [showScanner, setShowScanner] = useState(true);

//   // --- NEW: State to hold defects data for translations ---
//   const [defectsMasterList, setDefectsMasterList] = useState([]);

//   // --- NEW: Fetch master list of defects on component mount ---
//   useEffect(() => {
//     const fetchAllDefects = async () => {
//       try {
//         const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
//         if (!response.ok) throw new Error("Could not load defect definitions.");
//         const data = await response.json();
//         setDefectsMasterList(data);
//       } catch (err) {
//         setError(err.message);
//       }
//     };
//     fetchAllDefects();
//   }, []);

//   const onScanSuccess = async (decodedText) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/defect-track/${decodedText}`
//       );
//       if (!response.ok) throw new Error("Failed to fetch defect data");
//       const data = await response.json();

//       const mappedData = {
//         ...data,
//         garments: data.garments.map((garment) => {
//           // Check if any defect in this garment is already 'B Grade'
//           const isBGradeGarment = garment.defects.some(
//             (d) => d.status === "B Grade"
//           );
//           return {
//             ...garment,
//             isBGrade: isBGradeGarment, // Add a flag to the garment object
//             defects: garment.defects.map((defect) => {
//               const defectEntry = defectsMasterList.find(
//                 (d) => d.english === defect.name
//               );
//               return {
//                 ...defect,
//                 displayName: defectEntry
//                   ? defectEntry[language] || defect.name
//                   : defect.name,
//                 status: defect.status || "Fail"
//               };
//             })
//           };
//         })
//       };

//       setScannedData(mappedData);
//       setShowScanner(false);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onScanError = (err) => {
//     setError(err.message || "Scanner error");
//   };

//   // --- NEW: Handle status change from the dropdown ---
//   const handleStatusChange = (newStatus, garmentNumber, defectName) => {
//     setScannedData((prevData) => {
//       const newData = { ...prevData };
//       newData.garments = newData.garments.map((garment) => {
//         if (garment.garmentNumber === garmentNumber) {
//           // If one defect is marked as 'B Grade', all defects for that garment get the same status
//           if (newStatus === "B Grade") {
//             return {
//               ...garment,
//               isBGrade: true,
//               defects: garment.defects.map((d) => ({ ...d, status: "B Grade" }))
//             };
//           }
//           // Otherwise, just update the specific defect
//           return {
//             ...garment,
//             defects: garment.defects.map((d) =>
//               d.name === defectName ? { ...d, status: newStatus } : d
//             )
//           };
//         }
//         return garment;
//       });
//       return newData;
//     });
//   };

//   // --- NEW: Combined save logic for OK and B-Grade ---
//   const handleSave = async () => {
//     if (!scannedData) return;
//     setLoading(true);

//     try {
//       // --- Step 1: Handle B-Grade garments ---
//       const bGradeGarments = scannedData.garments.filter(
//         (g) => g.isBGrade && g.defects[0].status !== "OK"
//       );
//       if (bGradeGarments.length > 0) {
//         for (const garment of bGradeGarments) {
//           const now = new Date();
//           const garmentDataForBGrade = {
//             garmentNumber: garment.garmentNumber,
//             record_date: now.toLocaleDateString("en-US"),
//             record_time: now.toLocaleTimeString("en-US", { hour12: false }),
//             defectDetails: garment.defects.map((d) => ({
//               defectName: d.name,
//               defectCount: d.count,
//               status: d.status // Will be 'B Grade' or 'Pass'
//             }))
//           };

//           const headerData = {
//             package_no: scannedData.package_no,
//             moNo: scannedData.moNo,
//             custStyle: scannedData.custStyle,
//             color: scannedData.color,
//             size: scannedData.size,
//             lineNo: scannedData.lineNo,
//             department: scannedData.department,
//             buyer: scannedData.buyer,
//             factory: scannedData.factory,
//             sub_con: scannedData.sub_con,
//             sub_con_factory: scannedData.sub_con_factory
//           };

//           // Save to qc2_bgrade collection
//           await fetch(`${API_BASE_URL}/api/qc2-bgrade`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               defect_print_id: scannedData.defect_print_id,
//               garmentData: garmentDataForBGrade,
//               headerData
//             })
//           });
//         }
//       }

//       // --- Step 2: Handle all garments by sending to the repair-tracking endpoint ---
//       const repairArray = scannedData.garments.flatMap((garment) =>
//         garment.defects.map((defect) => ({
//           defectName: defect.name,
//           defectCount: defect.count,
//           repairGroup: defect.repair,
//           status: defect.status,
//           garmentNumber: garment.garmentNumber
//         }))
//       );

//       const response = await fetch(`${API_BASE_URL}/api/repair-tracking`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           defect_print_id: scannedData.defect_print_id,
//           repairArray,
//           // Pass header data for initial creation if needed
//           package_no: scannedData.package_no,
//           moNo: scannedData.moNo,
//           custStyle: scannedData.custStyle,
//           color: scannedData.color,
//           size: scannedData.size,
//           lineNo: scannedData.lineNo,
//           department: scannedData.department,
//           buyer: scannedData.buyer,
//           factory: scannedData.factory,
//           sub_con: scannedData.sub_con,
//           sub_con_factory: scannedData.sub_con_factory
//         })
//       });

//       if (!response.ok) throw new Error("Failed to save repair tracking data.");

//       Swal.fire({
//         icon: "success",
//         title: "Success",
//         text: "Repair tracking saved successfully!"
//       });

//       setScannedData(null);
//       setShowScanner(true);
//     } catch (err) {
//       setError(err.message);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: err.message
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "Unsaved changes will be lost.",
//       icon: "AlertTriangle",
//       showCancelButton: true,
//       confirmButtonColor: "#3085d6",
//       cancelButtonColor: "#d33",
//       confirmButtonText: "Yes, cancel!"
//     }).then((result) => {
//       if (result.isConfirmed) {
//         setScannedData(null);
//         setShowScanner(true);
//       }
//     });
//   };

//   const handleLanguageChange = (event) => {
//     const newLanguage = event.target.value;
//     setLanguage(newLanguage);
//     if (scannedData) {
//       setScannedData((prev) => ({
//         ...prev,
//         garments: prev.garments.map((garment) => ({
//           ...garment,
//           defects: garment.defects.map((defect) => {
//             const defectEntry = defectsMasterList.find(
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

//   if (authLoading || (showScanner && defectsMasterList.length === 0)) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <CircularProgress />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
//       <Box
//         sx={{
//           maxWidth: "900px",
//           mx: "auto",
//           bgcolor: "white",
//           borderRadius: 2,
//           boxShadow: 3,
//           p: 3
//         }}
//       >
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
//           Repair Tracking
//         </h1>
//         {showScanner && (
//           <div className="text-center mb-4">
//             <QrCodeScannerRepair
//               onScanSuccess={onScanSuccess}
//               onScanError={onScanError}
//             />
//           </div>
//         )}
//         {loading && (
//           <div className="text-center mt-4">
//             <CircularProgress />
//           </div>
//         )}
//         {error && (
//           <div className="text-center mt-4 text-red-600 font-semibold">
//             Error: {error}
//           </div>
//         )}
//         {scannedData && (
//           <div className="mt-4">
//             <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
//               <h3 className="text-lg font-semibold text-gray-800 mb-3">
//                 Defect Card Details
//               </h3>
//               <Box
//                 sx={{
//                   display: "grid",
//                   gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
//                   gap: 2,
//                   mb: 2
//                 }}
//               >
//                 <p>
//                   <strong>MO No:</strong> {scannedData.moNo}
//                 </p>
//                 <p>
//                   <strong>Line No:</strong> {scannedData.lineNo}
//                 </p>
//                 <p>
//                   <strong>Color:</strong> {scannedData.color}
//                 </p>
//                 <p>
//                   <strong>Size:</strong> {scannedData.size}
//                 </p>
//               </Box>
//               <div className="flex justify-end">
//                 <FormControl
//                   variant="outlined"
//                   size="small"
//                   sx={{ minWidth: 180 }}
//                 >
//                   <InputLabel>Language</InputLabel>
//                   <Select
//                     value={language}
//                     onChange={handleLanguageChange}
//                     label="Language"
//                   >
//                     <MenuItem value="english">English</MenuItem>
//                     <MenuItem value="khmer">Khmer</MenuItem>
//                     <MenuItem value="chinese">Chinese</MenuItem>
//                   </Select>
//                 </FormControl>
//               </div>
//             </Paper>

//             <TableContainer component={Paper} elevation={3}>
//               <Table stickyHeader>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Garment No.</TableCell>
//                     <TableCell>Defect Name ({language})</TableCell>
//                     <TableCell align="center">Count</TableCell>
//                     <TableCell align="center">Action</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {scannedData.garments.map((garment) =>
//                     garment.defects.map((defect, index) => (
//                       <TableRow
//                         key={`${garment.garmentNumber}-${defect.name}-${index}`}
//                         sx={{
//                           backgroundColor: garment.isBGrade
//                             ? "rgba(255, 230, 230, 1)"
//                             : defect.status === "OK"
//                             ? "rgba(230, 255, 230, 1)"
//                             : "inherit",
//                           "&:hover": {
//                             backgroundColor: garment.isBGrade
//                               ? "rgba(255,220,220,1)"
//                               : "rgba(0, 0, 0, 0.04)"
//                           }
//                         }}
//                       >
//                         {index === 0 && (
//                           <TableCell
//                             rowSpan={garment.defects.length}
//                             sx={{
//                               fontWeight: "bold",
//                               verticalAlign: "top",
//                               borderRight: "1px solid #e0e0e0"
//                             }}
//                           >
//                             {garment.garmentNumber}
//                           </TableCell>
//                         )}
//                         <TableCell>{defect.displayName}</TableCell>
//                         <TableCell align="center">{defect.count}</TableCell>
//                         <TableCell align="center">
//                           <FormControl
//                             fullWidth
//                             size="small"
//                             variant="outlined"
//                             disabled={garment.isBGrade}
//                           >
//                             <Select
//                               value={defect.status}
//                               onChange={(e) =>
//                                 handleStatusChange(
//                                   e.target.value,
//                                   garment.garmentNumber,
//                                   defect.name
//                                 )
//                               }
//                               sx={{
//                                 backgroundColor:
//                                   defect.status === "OK"
//                                     ? "success.light"
//                                     : defect.status === "B Grade"
//                                     ? "error.light"
//                                     : "grey.200",
//                                 fontWeight: "bold",
//                                 ".MuiSelect-select": {
//                                   display: "flex",
//                                   alignItems: "center"
//                                 }
//                               }}
//                             >
//                               <MenuItem value="Fail">
//                                 <Ban fontSize="small" sx={{ mr: 1 }} /> Fail
//                               </MenuItem>
//                               <MenuItem value="OK">
//                                 <CheckCircle fontSize="small" sx={{ mr: 1 }} />{" "}
//                                 OK
//                               </MenuItem>
//                               <MenuItem value="B Grade">
//                                 <AlertTriangle
//                                   fontSize="small"
//                                   sx={{ mr: 1 }}
//                                 />{" "}
//                                 B Grade
//                               </MenuItem>
//                             </Select>
//                           </FormControl>
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//             <div className="flex justify-center mt-6 space-x-4">
//               <Button
//                 onClick={handleSave}
//                 variant="contained"
//                 color="primary"
//                 size="large"
//                 disabled={loading}
//               >
//                 Save
//               </Button>
//               <Button
//                 onClick={handleCancel}
//                 variant="outlined"
//                 color="secondary"
//                 size="large"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         )}
//       </Box>
//     </div>
//   );
// };

// export default DefectTrack;

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import { useAuth } from "../components/authentication/AuthContext";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TableContainer,
  Paper,
  Box,
  CircularProgress
} from "@mui/material";
import { CheckCircle, AlertTriangle, Ban } from "lucide-react";

const DefectTrack = () => {
  const { user, loading: authLoading } = useAuth();
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("khmer");
  const [showScanner, setShowScanner] = useState(true);
  const [defectsMasterList, setDefectsMasterList] = useState([]);

  // This useEffect to fetch master defects is correct and unchanged.
  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc2-defects`);
        if (!response.ok) throw new Error("Could not load defect definitions.");
        const data = await response.json();
        setDefectsMasterList(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchAllDefects();
  }, []);

  // This function is correct and unchanged.
  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/defect-track/${decodedText}`
      );
      if (!response.ok) throw new Error("Failed to fetch defect data");
      const data = await response.json();

      const mappedData = {
        ...data,
        garments: data.garments.map((garment) => {
          // Determine if the garment has a B-Grade status from the database
          const isInitiallyBGrade = garment.defects.some(
            (d) => d.status === "B Grade"
          );
          return {
            ...garment,
            // This flag is now used to lock the garment if it was ALREADY B-Grade on load.
            isPermanentlyBGrade: isInitiallyBGrade,
            defects: garment.defects.map((defect) => {
              const defectEntry = defectsMasterList.find(
                (d) => d.english === defect.name
              );
              return {
                ...defect,
                displayName: defectEntry
                  ? defectEntry[language] || defect.name
                  : defect.name,
                status: defect.status || "Fail"
              };
            })
          };
        })
      };
      setScannedData(mappedData);
      setShowScanner(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    setError(err.message || "Scanner error");
  };

  const handleStatusChange = (newStatus, garmentNumber, defectName) => {
    setScannedData((prevData) => {
      // Create a new top-level object to ensure no mutation
      const newData = {
        ...prevData,
        // Create a new 'garments' array
        garments: prevData.garments.map((garment) => {
          // If it's not the garment we're looking for, return it as is
          if (garment.garmentNumber !== garmentNumber) {
            return garment;
          }

          // It IS the correct garment, so create a new garment object
          return {
            ...garment,
            // And create a new 'defects' array for it
            defects: garment.defects.map((defect) => {
              // If it's not the defect we're looking for, return it as is
              if (defect.name !== defectName) {
                return defect;
              }
              // It IS the correct defect, so return a new defect object with the updated status
              return { ...defect, status: newStatus };
            })
          };
        })
      };
      return newData;
    });
  };

  // The handleSave function logic is correct and remains unchanged.
  const handleSave = async () => {
    if (!scannedData) return;
    setLoading(true);

    try {
      // Correctly identify garments that have at least one B-Grade defect
      const bGradeGarments = scannedData.garments.filter((g) =>
        g.defects.some((d) => d.status === "B Grade")
      );

      for (const garment of bGradeGarments) {
        const now = new Date();
        const garmentDataForBGrade = {
          garmentNumber: garment.garmentNumber,
          record_date: now.toLocaleDateString("en-US"),
          record_time: now.toLocaleTimeString("en-US", { hour12: false }),
          defectDetails: garment.defects.map((d) => ({
            defectName: d.name,
            defectCount: d.count,
            status: d.status
          }))
        };

        const headerData = {
          package_no: scannedData.package_no,
          moNo: scannedData.moNo,
          custStyle: scannedData.custStyle,
          color: scannedData.color,
          size: scannedData.size,
          lineNo: scannedData.lineNo,
          department: scannedData.department
        };

        await fetch(`${API_BASE_URL}/api/qc2-bgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defect_print_id: scannedData.defect_print_id,
            garmentData: garmentDataForBGrade,
            headerData
          })
        });
      }

      const repairArray = scannedData.garments.flatMap((garment) =>
        garment.defects.map((defect) => ({
          defectName: defect.name,
          defectCount: defect.count,
          repairGroup: defect.repair,
          status: defect.status,
          garmentNumber: garment.garmentNumber
        }))
      );

      // --- THIS IS THE CORRECTED PAYLOAD ---
      const payload = {
        defect_print_id: scannedData.defect_print_id,
        repairArray,
        // All header data from the schema must be included
        package_no: scannedData.package_no,
        moNo: scannedData.moNo,
        custStyle: scannedData.custStyle,
        color: scannedData.color,
        size: scannedData.size,
        lineNo: scannedData.lineNo,
        department: scannedData.department,
        buyer: scannedData.buyer, // <-- ADDED
        factory: scannedData.factory, // <-- ADDED
        sub_con: scannedData.sub_con, // <-- ADDED
        sub_con_factory: scannedData.sub_con_factory // <-- ADDED
      };

      const response = await fetch(`${API_BASE_URL}/api/repair-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) // Send the complete payload
      });

      if (!response.ok) throw new Error("Failed to save repair tracking data.");

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Repair tracking saved successfully!"
      });

      setScannedData(null);
      setShowScanner(true);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Unsaved changes will be lost.",
      icon: "AlertTriangle",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel!"
    }).then((result) => {
      if (result.isConfirmed) {
        setScannedData(null);
        setShowScanner(true);
      }
    });
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    if (scannedData) {
      setScannedData((prev) => ({
        ...prev,
        garments: prev.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = defectsMasterList.find(
              (d) => d.english === defect.name
            );
            return {
              ...defect,
              displayName: defectEntry
                ? defectEntry[newLanguage] || defect.name
                : defect.name
            };
          })
        }))
      }));
    }
  };

  // --- THIS IS THE CORRECTED JSX ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <Box
        sx={{
          maxWidth: "900px",
          mx: "auto",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: 3,
          p: 3
        }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Repair Tracking
        </h1>
        {showScanner && (
          <div className="text-center mb-4">
            <QrCodeScannerRepair
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
            />
          </div>
        )}
        {loading && (
          <div className="text-center mt-4">
            <CircularProgress />
          </div>
        )}
        {error && (
          <div className="text-center mt-4 text-red-600 font-semibold">
            Error: {error}
          </div>
        )}
        {scannedData && (
          <div className="mt-4">
            <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Defect Card Details
              </h3>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2,
                  mb: 2
                }}
              >
                <p>
                  <strong>MO No:</strong> {scannedData.moNo}
                </p>
                <p>
                  <strong>Line No:</strong> {scannedData.lineNo}
                </p>
                <p>
                  <strong>Color:</strong> {scannedData.color}
                </p>
                <p>
                  <strong>Size:</strong> {scannedData.size}
                </p>
              </Box>
              <div className="flex justify-end">
                <FormControl
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    label="Language"
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="khmer">Khmer</MenuItem>
                    <MenuItem value="chinese">Chinese</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </Paper>

            <TableContainer component={Paper} elevation={3}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Garment No.</TableCell>
                    <TableCell>Defect Name ({language})</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedData.garments.map((garment) => {
                    // This logic is for STYLING ONLY. It checks the CURRENT state.
                    const isBGradeNow = garment.defects.some(
                      (d) => d.status === "B Grade"
                    );

                    return garment.defects.map((defect, index) => (
                      <TableRow
                        key={`${garment.garmentNumber}-${defect.name}-${index}`}
                        sx={{
                          // The visual style is based on the current state, which is fine.
                          // This will make the whole row group red if one defect is B-Grade.
                          backgroundColor: isBGradeNow
                            ? "rgba(255, 230, 230, 1)" // B-Grade style
                            : defect.status === "OK"
                            ? "rgba(230, 255, 230, 1)" // OK style
                            : "inherit",
                          "&:hover": {
                            backgroundColor: isBGradeNow
                              ? "rgba(255,220,220,1)"
                              : "rgba(0, 0, 0, 0.04)"
                          }
                        }}
                      >
                        {index === 0 && (
                          <TableCell
                            rowSpan={garment.defects.length}
                            sx={{
                              fontWeight: "bold",
                              verticalAlign: "top",
                              borderRight: "1px solid #e0e0e0"
                            }}
                          >
                            {garment.garmentNumber}
                          </TableCell>
                        )}
                        <TableCell>{defect.displayName}</TableCell>
                        <TableCell align="center">{defect.count}</TableCell>
                        <TableCell align="center">
                          <FormControl
                            fullWidth
                            size="small"
                            variant="outlined"
                            disabled={garment.isPermanentlyBGrade}
                          >
                            <Select
                              value={defect.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  e.target.value,
                                  garment.garmentNumber,
                                  defect.name
                                )
                              }
                              sx={{
                                backgroundColor:
                                  defect.status === "OK"
                                    ? "success.light"
                                    : defect.status === "B Grade"
                                    ? "error.light"
                                    : "grey.200",
                                fontWeight: "bold",
                                ".MuiSelect-select": {
                                  display: "flex",
                                  alignItems: "center"
                                }
                              }}
                            >
                              <MenuItem value="Fail">
                                <Ban fontSize="small" sx={{ mr: 1 }} /> Fail
                              </MenuItem>
                              <MenuItem value="OK">
                                <CheckCircle fontSize="small" sx={{ mr: 1 }} />{" "}
                                OK
                              </MenuItem>
                              <MenuItem value="B Grade">
                                <AlertTriangle
                                  fontSize="small"
                                  sx={{ mr: 1 }}
                                />{" "}
                                B Grade
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <div className="flex justify-center mt-6 space-x-4">
              <Button
                onClick={handleSave}
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
              >
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outlined"
                color="secondary"
                size="large"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Box>
    </div>
  );
};

export default DefectTrack;
