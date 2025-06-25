import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { allDefects } from "../constants/defects";
import Swal from "sweetalert2";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import { AlertCircle } from "lucide-react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

const BGradeDefect = () => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [language, setLanguage] = useState("khmer");

  const [allGarmentsCount, setAllGarmentsCount] = useState(0);
  const [passGarmentsCount, setPassGarmentsCount] = useState(0);
  const [rejectGarmentsCount, setRejectGarmentsCount] = useState(0);

  const [rejectedGarments, setRejectedGarments] = useState(new Set());

  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/defect-track/${decodedText}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch defect data: ${errorText || response.statusText}`
        );
      }
      const data = await response.json();
      // Fetch the main inspection document to get the bundle_random_id
      const bundleResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${decodedText}`
      );
      if (!bundleResponse.ok) {
        const errorText = await bundleResponse.text();
        throw new Error(
          `Failed to fetch associated bundle data for this defect card. Please ensure the defect card is correctly linked to an inspection bundle. Error details: ${
            errorText || bundleResponse.statusText
          }`
        );
      }
      const bundleData = await bundleResponse.json();

      const bGradeGarments = data.garments.filter((garment) =>
        garment.defects.some((defect) => defect.status === "B-Grade")
      );

      if (bGradeGarments.length === 0) {
        throw new Error("No B-Grade garments found for this defect card.");
      }

      const mappedData = {
        ...data,
        bundle_random_id: bundleData.bundle_random_id,
        garments: bGradeGarments.map((garment) => ({
          ...garment,
          defects: garment.defects
            .filter((d) => d.status === "B-Grade")
            .map((defect, index) => {
              const defectEntry = allDefects.find(
                (d) => d.english === defect.name
              );
              return {
                ...defect,
                id: `${garment.garmentNumber}-${defect.name}-${index}`, // Add unique ID
                decision: "none", // Add decision state, default to 'none' for initial gray state
                displayName: defectEntry
                  ? defectEntry[language] || defect.name
                  : defect.name
              };
            })
        }))
      };

      if (!mappedData.bundle_random_id) {
        mappedData.bundle_random_id = bundleData.bundle_random_id;
      }

      setScannedData(mappedData);
      setShowScanner(false);

      const totalGarments = mappedData.garments.length;
      setAllGarmentsCount(totalGarments);
      setPassGarmentsCount(totalGarments);
      setRejectGarmentsCount(0);
      setRejectedGarments(new Set());
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

  const onScanError = (err) => {
    setError(err.message);
  };

  useEffect(() => {
    if (!scannedData) return;

    const rejectedGarmentNumbers = new Set();
    scannedData.garments.forEach((garment) => {
      const isRejected = garment.defects.some((d) => d.decision === "rejected");
      if (isRejected) {
        rejectedGarmentNumbers.add(garment.garmentNumber);
      }
    });

    setRejectedGarments(rejectedGarmentNumbers);
    setRejectGarmentsCount(rejectedGarmentNumbers.size);
    setPassGarmentsCount(allGarmentsCount - rejectedGarmentNumbers.size);
  }, [scannedData, allGarmentsCount]);

  const handleDecisionChange = (garmentNumber, defectId, newDecision) => {
    setScannedData((prevData) => {
      const newGarments = prevData.garments.map((garment) => {
        if (garment.garmentNumber === garmentNumber) {
          const newDefects = garment.defects.map((defect) =>
            defect.id === defectId
              ? { ...defect, decision: newDecision }
              : defect
          );
          return { ...garment, defects: newDefects };
        }
        return garment;
      });
      return { ...prevData, garments: newGarments };
    });
  };

  const handleSave = async () => {
    if (!scannedData) return;

    // Construct a complete bGradeArray with updated confirmation statuses.
    // This makes the payload self-contained and suitable for an "upsert" operation.
    const bGradeArrayWithConfirmations = scannedData.garments.flatMap(
      (garment) => {
        const isRejected = garment.defects.some(
          (d) => d.decision === "rejected"
        );
        const isAccepted =
          garment.defects.length > 0 &&
          garment.defects.every((d) => d.decision === "pass");

        let confirmationStatus = "B-Grade"; // Default status
        if (isRejected) {
          confirmationStatus = "B-Grade_Rejected";
        } else if (isAccepted) {
          confirmationStatus = "B-Grade_Accept";
        }

        // Map each original defect to the format expected by the BGradeTrackingSchema
        return garment.defects.map((defect) => ({
          defectName: defect.name,
          defectCount: defect.count,
          garmentNumber: garment.garmentNumber,
          repairGroup: defect.repair,
          status: "B-Grade",
          confirmation: confirmationStatus // Apply the overall garment decision to each defect
        }));
      }
    );

    // Check if any decisions have been made by checking for non-default confirmation statuses
    const decisionsMade = bGradeArrayWithConfirmations.some(
      (d) => d.confirmation !== "B-Grade"
    );

    if (!decisionsMade) {
      Swal.fire({
        icon: "info",
        title: "No Complete Decisions",
        text: "Please make a decision (Accept or Reject) for all defects of at least one garment before saving."
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
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
        bGradeArray: bGradeArrayWithConfirmations // Send the complete array
      };

      // Reverting to use the POST endpoint which is known to exist from DefectTrack.jsx.
      // The server-side logic for this endpoint must be updated to handle both creation and updates.
      const endpoint = `${API_BASE_URL}/api/b-grade-tracking`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Read the body ONCE as text to prevent "body already read" errors.
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          // If the text is valid JSON, parse it and use its message.
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          // If it's not JSON, we'll just use the raw errorText.
        }
        throw new Error(
          `Failed to save B-Grade decisions. Server responded with ${response.status} (${response.statusText}) for POST ${endpoint}. Details: ${errorMessage}`
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "B-Grade decisions have been processed successfully!"
      });

      // Reset the page to initial state
      setScannedData(null);
      setShowScanner(true);
      setRejectedGarments(new Set());
      setAllGarmentsCount(0);
      setPassGarmentsCount(0);
      setRejectGarmentsCount(0);
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
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel!"
    }).then((result) => {
      if (result.isConfirmed) {
        setScannedData(null);
        setShowScanner(true);
        setRejectedGarments(new Set());
        setAllGarmentsCount(0);
        setPassGarmentsCount(0);
        setRejectGarmentsCount(0);
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
              // id and decision are preserved by spreading defect
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          B-Grade Defect Management
        </h1>
        {showScanner && (
          <div className="text-center mb-4">
            <QrCodeScannerRepair
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
            />
          </div>
        )}
        {loading && <p className="text-center text-gray-700">Loading...</p>}
        {error && (
          <div className="p-4 my-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-semibold">Error: {error}</p>
          </div>
        )}
        {scannedData && (
          <div>
            <Grid container spacing={3} className="mb-6">
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: "#e3f2fd" }}>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      All Garments
                    </Typography>
                    <Typography variant="h3" color="text.secondary">
                      {allGarmentsCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: "#c8e6c9" }}>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Pass Garments
                    </Typography>
                    <Typography variant="h3" color="text.secondary">
                      {passGarmentsCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: "#ffcdd2" }}>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Reject Garments
                    </Typography>
                    <Typography variant="h3" color="text.secondary">
                      {rejectGarmentsCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                B-Grade Defect Details
              </h3>
              <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
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
              <div className="flex justify-end mb-4">
                <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                  <InputLabel id="language-select-label">
                    Select Language
                  </InputLabel>
                  <Select
                    labelId="language-select-label"
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
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-100">
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
                  {scannedData.garments.map(
                    (garment) => {
                      // Start of block for calculating rowBgColor per garment
                      const isGarmentRejected = garment.defects.some(
                        (d) => d.decision === "rejected"
                      );
                      const isGarmentAccepted = garment.defects.every(
                        (d) => d.decision === "pass"
                      );
                      let rowBgColor = "inherit"; // Default neutral
                      if (isGarmentRejected) {
                        rowBgColor = "#ffcdd2"; // Light red for rejected
                      } else if (
                        isGarmentAccepted &&
                        garment.defects.length > 0
                      ) {
                        // Ensure there are defects to be accepted
                        rowBgColor = "#c8e6c9"; // Light green for accepted
                      }

                      return garment.defects.map((defect, index) => (
                        <TableRow
                          key={defect.id}
                          sx={{ backgroundColor: rowBgColor }}
                        >
                          {index === 0 && (
                            <TableCell
                              rowSpan={garment.defects.length}
                              className="px-2 py-1 text-sm text-gray-700 border border-gray-200 align-top"
                            >
                              {garment.garmentNumber}
                            </TableCell>
                          )}
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
                            <div className="flex space-x-2">
                              <Button
                                variant={
                                  defect.decision === "pass"
                                    ? "contained"
                                    : "outlined"
                                } // Contained if 'pass', outlined otherwise
                                color={
                                  defect.decision === "pass"
                                    ? "success"
                                    : "inherit"
                                } // Green if 'pass', inherit (gray) for outlined
                                onClick={() =>
                                  handleDecisionChange(
                                    garment.garmentNumber,
                                    defect.id,
                                    "pass"
                                  )
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                variant={
                                  defect.decision === "rejected"
                                    ? "contained"
                                    : "outlined"
                                } // Contained if 'rejected', outlined otherwise
                                color={
                                  defect.decision === "rejected"
                                    ? "error"
                                    : "inherit"
                                } // Red if 'rejected', inherit (gray) for outlined
                                onClick={() =>
                                  handleDecisionChange(
                                    garment.garmentNumber,
                                    defect.id,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    } // End of block for calculating rowBgColor per garment
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

export default BGradeDefect;
