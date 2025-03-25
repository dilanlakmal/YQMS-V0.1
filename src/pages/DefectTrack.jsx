// import React, { useState } from "react";
// import { API_BASE_URL } from "../../config"; // Adjust path as needed
// import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
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
//   InputLabel
// } from "@mui/material";
// import { allDefects } from "../constants/defects";

// const DefectTrack = () => {
//   const [scannedData, setScannedData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [language, setLanguage] = useState("khmer"); // Default to Khmer

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

//       // Map defect names to selected language
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
//                 : defect.name // Fallback to original name if not found
//             };
//           })
//         }))
//       };
//       setScannedData(mappedData);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onScanError = (err) => {
//     setError(err);
//   };

//   const handleOkClick = (garmentNumber, defectName) => {
//     setScannedData((prev) => {
//       const updatedGarments = prev.garments.map((garment) => {
//         if (garment.garmentNumber === garmentNumber) {
//           const updatedDefects = garment.defects.map((defect) => {
//             if (defect.name === defectName) {
//               const now = new Date();
//               return {
//                 ...defect,
//                 status: "OK",
//                 repair_date: now.toLocaleDateString("en-US", {
//                   month: "2-digit",
//                   day: "2-digit",
//                   year: "numeric"
//                 }),
//                 repair_time: now.toLocaleTimeString("en-US", {
//                   hour12: false,
//                   hour: "2-digit",
//                   minute: "2-digit",
//                   second: "2-digit"
//                 })
//               };
//             }
//             return defect;
//           });
//           return { ...garment, defects: updatedDefects };
//         }
//         return garment;
//       });
//       return { ...prev, garments: updatedGarments };
//     });
//   };

//   const handleSave = async () => {
//     if (!scannedData) return;

//     const repairArray = [];
//     scannedData.garments.forEach((garment) => {
//       garment.defects.forEach((defect) => {
//         repairArray.push({
//           defectName: defect.name, // Use original English name for storage
//           defectCount: defect.count,
//           repairGroup: defect.repair,
//           status: defect.status || "Not Repaired",
//           repair_date: defect.repair_date || "",
//           repair_time: defect.repair_time || ""
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

//       alert("Repair tracking saved successfully");
//       setScannedData(null); // Reset scanned data to return to scanner window
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const handleCancel = () => {
//     setScannedData(null); // Clear scanned data to return to scanner window
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

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Defect Tracking</h1>

//       {/* Language Selection Dropdown with Enhanced Styling */}
//       <FormControl
//         variant="outlined"
//         className="mb-6" // Increased margin-bottom for spacing
//         style={{ minWidth: 200 }}
//       >
//         <InputLabel style={{ color: "#1976d2", fontWeight: "bold" }}>
//           Select Language
//         </InputLabel>
//         <Select
//           value={language}
//           onChange={handleLanguageChange}
//           label="Select Language"
//           style={{
//             backgroundColor: "#f5f5f5",
//             borderRadius: "8px",
//             "&:hover": {
//               backgroundColor: "#e0e0e0"
//             }
//           }}
//         >
//           <MenuItem value="english">English</MenuItem>
//           <MenuItem value="khmer">Khmer</MenuItem>
//           <MenuItem value="chinese">Chinese</MenuItem>
//         </Select>
//       </FormControl>

//       <QrCodeScannerRepair
//         onScanSuccess={onScanSuccess}
//         onScanError={onScanError}
//       />
//       {loading && <p className="mt-4">Loading...</p>}
//       {error && <p className="mt-4 text-red-500">Error: {error}</p>}
//       {scannedData && (
//         <div className="mt-6">
//           <h2 className="text-xl font-semibold">Defect Card Details</h2>
//           <div className="grid grid-cols-2 gap-4 mt-2">
//             <p>
//               <strong>MO No:</strong> {scannedData.moNo}
//             </p>
//             <p>
//               <strong>Line No:</strong> {scannedData.lineNo}
//             </p>
//             <p>
//               <strong>Color:</strong> {scannedData.color}
//             </p>
//             <p>
//               <strong>Size:</strong> {scannedData.size}
//             </p>
//           </div>
//           <Table className="mt-4">
//             <TableHead>
//               <TableRow>
//                 <TableCell>Garment No</TableCell>
//                 <TableCell>Repair Group</TableCell>
//                 <TableCell>Defect Name</TableCell>
//                 <TableCell>Count</TableCell>
//                 <TableCell>Remarks</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {scannedData.garments.map((garment) =>
//                 garment.defects.map((defect, index) => (
//                   <TableRow
//                     key={`${garment.garmentNumber}-${defect.name}-${index}`}
//                     style={{
//                       backgroundColor:
//                         defect.status === "OK" ? "#e6ffe6" : "inherit"
//                     }}
//                   >
//                     <TableCell>{garment.garmentNumber}</TableCell>
//                     <TableCell>{defect.repair}</TableCell>
//                     <TableCell>{defect.displayName}</TableCell>
//                     <TableCell>{defect.count}</TableCell>
//                     <TableCell>
//                       <Button
//                         onClick={() =>
//                           handleOkClick(garment.garmentNumber, defect.name)
//                         }
//                         disabled={defect.status === "OK"}
//                         style={{
//                           backgroundColor:
//                             defect.status === "OK" ? "green" : "gray",
//                           color: "white"
//                         }}
//                       >
//                         OK
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//           <div className="mt-4 flex gap-4">
//             <Button onClick={handleSave} variant="contained" color="primary">
//               Save
//             </Button>
//             <Button
//               onClick={handleCancel}
//               variant="contained"
//               color="secondary"
//             >
//               Cancel
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DefectTrack;

// import React, { useState, useEffect } from "react";
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
//                 : defect.name
//             };
//           })
//         }))
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
//     setError(err);
//   };

//   const handleOkClick = (garmentNumber, defectName) => {
//     setScannedData((prev) => {
//       const updatedGarments = prev.garments.map((garment) => {
//         if (garment.garmentNumber === garmentNumber) {
//           const updatedDefects = garment.defects.map((defect) => {
//             if (defect.name === defectName) {
//               const now = new Date();
//               return {
//                 ...defect,
//                 status: "OK",
//                 repair_date: now.toLocaleDateString("en-US", {
//                   month: "2-digit",
//                   day: "2-digit",
//                   year: "numeric"
//                 }),
//                 repair_time: now.toLocaleTimeString("en-US", {
//                   hour12: false,
//                   hour: "2-digit",
//                   minute: "2-digit",
//                   second: "2-digit"
//                 }),
//                 garmentNumber: garment.garmentNumber
//               };
//             }
//             return defect;
//           });
//           return { ...garment, defects: updatedDefects };
//         }
//         return garment;
//       });
//       return { ...prev, garments: updatedGarments };
//     });
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
//           status: defect.status || "Not Repaired",
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
//                     garment.defects.map((defect, index) => (
//                       <TableRow
//                         key={`${garment.garmentNumber}-${defect.name}-${index}`}
//                         className={
//                           defect.status === "OK"
//                             ? "bg-green-100"
//                             : "hover:bg-gray-100"
//                         }
//                       >
//                         <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                           {garment.garmentNumber}
//                         </TableCell>
//                         <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                           {defect.repair}
//                         </TableCell>
//                         <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                           {defect.displayName}
//                         </TableCell>
//                         <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                           {defect.count}
//                         </TableCell>
//                         <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
//                           <div className="flex justify-center">
//                             <button
//                               onClick={() =>
//                                 handleOkClick(
//                                   garment.garmentNumber,
//                                   defect.name
//                                 )
//                               }
//                               disabled={defect.status === "OK"}
//                               className={`px-4 py-2 rounded ${
//                                 defect.status === "OK"
//                                   ? "bg-green-600"
//                                   : "bg-gray-400"
//                               } text-white`}
//                             >
//                               OK
//                             </button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))
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

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { allDefects } from "../constants/defects";
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
  Paper
} from "@mui/material";

const DefectTrack = () => {
  const { user, loading: authLoading } = useAuth();
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("khmer");
  const [showScanner, setShowScanner] = useState(true);
  const [tempOkDefects, setTempOkDefects] = useState([]);

  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/defect-track/${decodedText}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch defect data");
      }
      const data = await response.json();
      const mappedData = {
        ...data,
        garments: data.garments.map((garment) => ({
          ...garment,
          defects: garment.defects.map((defect) => {
            const defectEntry = allDefects.find(
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
        }))
      };
      setScannedData(mappedData);
      setShowScanner(false);
      setTempOkDefects([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    setError(err);
  };

  const updateDefectStatusInRepairTracking = async (
    defect_print_id,
    garmentNumber,
    defectName,
    status
  ) => {
    try {
      console.log("Updating defect status with:", {
        defect_print_id,
        garmentNumber,
        defectName,
        status
      }); // Log the values
      const payload = {
        defect_print_id,
        garmentNumber,
        defectName,
        status
      };
      // // Only add pass_bundle if updatePassBundle is true
      // if (updatePassBundle && (status === "OK" || status === "Fail")) {
      //   payload.pass_bundle = passBundleStatus;
      // }
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
          `Failed to update defect status in repair tracking: ${errorText}`
        );
      }
      console.log("Defect status updated in repair tracking successfully");
    } catch (err) {
      setError(
        `Failed to update defect status in repair tracking: ${err.message}`
      );
      console.error(
        "Error updating defect status in repair tracking:",
        err.message
      );
    }
  };

  const handleOkClick = async (garmentNumber, defectName) => {
    try {
      setLoading(true);
      // await updateDefectStatusInRepairTracking(scannedData.defect_print_id, garmentNumber, defectName, "OK");
      setTempOkDefects((prev) => [...prev, { garmentNumber, defectName }]);
      setScannedData((prev) => {
        const updatedGarments = prev.garments.map((garment) => {
          if (garment.garmentNumber === garmentNumber) {
            const updatedDefects = garment.defects.map((defect) => {
              if (defect.name === defectName) {
                const now = new Date();
                return {
                  ...defect,
                  status: "OK",
                  repair_date: now.toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric"
                  }),
                  repair_time: now.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }),
                  garmentNumber: garment.garmentNumber
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
    } catch (error) {
      setError(error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scannedData) return;
    const repairArray = [];
    scannedData.garments.forEach((garment) => {
      garment.defects.forEach((defect) => {
        repairArray.push({
          defectName: defect.name,
          defectCount: defect.count,
          repairGroup: defect.repair,
          status: defect.status || "Fail",
          repair_date: defect.repair_date || "",
          repair_time: defect.repair_time || "",
          garmentNumber: garment.garmentNumber
        });
      });
    });
    try {
      const response = await fetch(`${API_BASE_URL}/api/repair-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defect_print_id: scannedData.defect_print_id,
          package_no: scannedData.package_no,
          moNo: scannedData.moNo,
          custStyle: scannedData.custStyle,
          color: scannedData.color,
          size: scannedData.size,
          lineNo: scannedData.lineNo,
          department: scannedData.department,
          buyer: scannedData.buyer,
          factory: scannedData.factory,
          sub_con: scannedData.sub_con,
          sub_con_factory: scannedData.sub_con_factory,
          repairArray
        })
      });
      if (!response.ok) {
        throw new Error("Failed to save repair tracking");
      }
      // Update defect status in qc2_repair_tracking after saving
      for (const garment of scannedData.garments) {
        for (const defect of garment.defects) {
          if (defect.status === "OK") {
            await updateDefectStatusInRepairTracking(
              scannedData.defect_print_id,
              garment.garmentNumber,
              defect.name,
              "OK"
            );
          }
        }
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Repair tracking saved successfully!"
      });
      setScannedData(null);
      setShowScanner(true);
      setTempOkDefects([]);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message
      });
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel!"
    }).then((result) => {
      if (result.isConfirmed) {
        setScannedData(null);
        setShowScanner(true);
        setTempOkDefects([]);
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
            const defectEntry = allDefects.find(
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

  const isDefectTemporarilyOk = (garmentNumber, defectName) => {
    return tempOkDefects.some(
      (tempDefect) =>
        tempDefect.garmentNumber === garmentNumber &&
        tempDefect.defectName === defectName
    );
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Defect Tracking
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
            <p className="text-gray-700">Loading...</p>
          </div>
        )}
        {error && (
          <div className="text-center mt-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        {scannedData && (
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Defect Card Details
              </h3>
              <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
                <p className="text-gray-700">
                  <strong>MO No:</strong> {scannedData.moNo}
                </p>
                <p className="text-gray-700">
                  <strong>Line No:</strong> {scannedData.lineNo}
                </p>
                <p className="text-gray-700">
                  <strong>Color:</strong> {scannedData.color}
                </p>
                <p className="text-gray-700">
                  <strong>Size:</strong> {scannedData.size}
                </p>
              </div>
              <div className="flex justify-end mb-4">
                <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                  <InputLabel id="language-select-label">
                    Select Language
                  </InputLabel>
                  <Select
                    labelId="language-select-label"
                    id="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    label="Select Language"
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="khmer">Khmer</MenuItem>
                    <MenuItem value="chinese">Chinese</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            <TableContainer component={Paper} className="shadow-lg">
              <Table className="min-w-full">
                <TableHead>
                  <TableRow className="bg-gray-100 text-white">
                    <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Garment Number
                    </TableCell>
                    <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Repair Group
                    </TableCell>
                    <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Defect Name ({language})
                    </TableCell>
                    <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Defect Count
                    </TableCell>
                    <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedData.garments.map((garment) =>
                    garment.defects
                      .filter(
                        (defect) =>
                          defect.status !== "OK" ||
                          isDefectTemporarilyOk(
                            garment.garmentNumber,
                            defect.name
                          )
                      )
                      .map((defect, index) => (
                        <TableRow
                          key={`${garment.garmentNumber}-${defect.name}-${index}`}
                          className={
                            defect.status === "OK"
                              ? "bg-green-100"
                              : "hover:bg-gray-100"
                          }
                        >
                          <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                            {garment.garmentNumber}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                            {defect.repair}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                            {defect.displayName}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                            {defect.count}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                            <div className="flex justify-center">
                              <button
                                onClick={() =>
                                  handleOkClick(
                                    garment.garmentNumber,
                                    defect.name
                                  )
                                }
                                disabled={
                                  defect.status === "OK" &&
                                  !isDefectTemporarilyOk(
                                    garment.garmentNumber,
                                    defect.name
                                  )
                                }
                                className={`px-4 py-2 rounded ${
                                  isDefectTemporarilyOk(
                                    garment.garmentNumber,
                                    defect.name
                                  )
                                    ? "bg-green-600" // Green if temporarily OK
                                    : defect.status === "OK"
                                    ? "bg-green-600" // Green if already OK
                                    : "bg-gray-400" // Gray if not OK
                                } text-white`}
                              >
                                OK
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <div className="flex justify-center mt-4 space-x-4">
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectTrack;
