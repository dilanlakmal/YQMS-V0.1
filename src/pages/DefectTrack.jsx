import React, { useState } from "react";
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
      });
      const payload = {
        defect_print_id,
        garmentNumber,
        defectName,
        status
      };
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-repair-tracking/update-defect-status-by-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      // if (!response.ok) {
      //   const errorText = await response.text();
      //   throw new Error(`Failed to update defect status in repair tracking: ${errorText}`);
      // }
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
                                    ? "bg-green-600"
                                    : defect.status === "OK"
                                    ? "bg-green-600"
                                    : "bg-gray-400"
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
