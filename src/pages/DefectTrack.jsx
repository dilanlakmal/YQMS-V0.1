import React, { useState } from "react";
import { API_BASE_URL } from "../../config"; // Adjust path as needed
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
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
  InputLabel
} from "@mui/material";
import { allDefects } from "../constants/QC Inspection/defects";

const DefectTrack = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("khmer"); // Default to Khmer

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

      // Map defect names to selected language
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
                : defect.name // Fallback to original name if not found
            };
          })
        }))
      };
      setScannedData(mappedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    setError(err);
  };

  const handleOkClick = (garmentNumber, defectName) => {
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
                })
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

  const handleSave = async () => {
    if (!scannedData) return;

    const repairArray = [];
    scannedData.garments.forEach((garment) => {
      garment.defects.forEach((defect) => {
        repairArray.push({
          defectName: defect.name, // Use original English name for storage
          defectCount: defect.count,
          repairGroup: defect.repair,
          status: defect.status || "Not Repaired",
          repair_date: defect.repair_date || "",
          repair_time: defect.repair_time || ""
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

      alert("Repair tracking saved successfully");
      setScannedData(null); // Reset scanned data to return to scanner window
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setScannedData(null); // Clear scanned data to return to scanner window
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Defect Tracking</h1>

      {/* Language Selection Dropdown with Enhanced Styling */}
      <FormControl
        variant="outlined"
        className="mb-6" // Increased margin-bottom for spacing
        style={{ minWidth: 200 }}
      >
        <InputLabel style={{ color: "#1976d2", fontWeight: "bold" }}>
          Select Language
        </InputLabel>
        <Select
          value={language}
          onChange={handleLanguageChange}
          label="Select Language"
          style={{
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#e0e0e0"
            }
          }}
        >
          <MenuItem value="english">English</MenuItem>
          <MenuItem value="khmer">Khmer</MenuItem>
          <MenuItem value="chinese">Chinese</MenuItem>
        </Select>
      </FormControl>

      <QrCodeScannerRepair
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
      />
      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      {scannedData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Defect Card Details</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
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
          </div>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableCell>Garment No</TableCell>
                <TableCell>Repair Group</TableCell>
                <TableCell>Defect Name</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scannedData.garments.map((garment) =>
                garment.defects.map((defect, index) => (
                  <TableRow
                    key={`${garment.garmentNumber}-${defect.name}-${index}`}
                    style={{
                      backgroundColor:
                        defect.status === "OK" ? "#e6ffe6" : "inherit"
                    }}
                  >
                    <TableCell>{garment.garmentNumber}</TableCell>
                    <TableCell>{defect.repair}</TableCell>
                    <TableCell>{defect.displayName}</TableCell>
                    <TableCell>{defect.count}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() =>
                          handleOkClick(garment.garmentNumber, defect.name)
                        }
                        disabled={defect.status === "OK"}
                        style={{
                          backgroundColor:
                            defect.status === "OK" ? "green" : "gray",
                          color: "white"
                        }}
                      >
                        OK
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex gap-4">
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
  );
};

export default DefectTrack;
