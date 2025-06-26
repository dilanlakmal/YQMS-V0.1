import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import { AlertCircle, Check, X } from "lucide-react";
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
  Box,
  CircularProgress
} from "@mui/material";
import QC2InspectionPageTitle from "../components/inspection/qc2/QC2InspectionPageTitle";
import { useAuth } from "../components/authentication/AuthContext";

const BGradeDefect = () => {
  const { user } = useAuth();
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [decisions, setDecisions] = useState({});
  const [displayBGradeQty, setDisplayBGradeQty] = useState(0);

  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    setError(null);
    setScannedData(null);
    try {
      // This endpoint just fetches the B-Grade data.
      const response = await fetch(
        `${API_BASE_URL}/api/qc2-bgrade/by-defect-id/${decodedText}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch B-Grade defect data."
        );
      }
      const data = await response.json();

      const garmentsNeedingDecision = data.bgradeArray.filter(
        (garment) => garment.leader_status === "B Grade"
      );

      if (garmentsNeedingDecision.length === 0) {
        throw new Error(
          "All B-Grade garments for this card have already been processed."
        );
      }

      const processedData = {
        ...data,
        garments: garmentsNeedingDecision
      };
      setScannedData(processedData);

      const initialDecisions = {};
      garmentsNeedingDecision.forEach((g) => {
        initialDecisions[g.garmentNumber] = "Accept";
      });
      setDecisions(initialDecisions);
      setDisplayBGradeQty(garmentsNeedingDecision.length);
      setShowScanner(false);
    } catch (err) {
      setError(err.message);
      Swal.fire({ icon: "error", title: "Scan Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    setError(err.message || "QR Scanner Error");
  };

  const handleDecisionChange = (garmentNumber, newDecision) => {
    setDecisions((prev) => ({
      ...prev,
      [garmentNumber]: newDecision
    }));
  };

  useEffect(() => {
    if (!scannedData) return;
    const initialCount = scannedData.garments.length;
    const notBGradeCount = Object.values(decisions).filter(
      (d) => d === "Not B Grade"
    ).length;
    setDisplayBGradeQty(initialCount - notBGradeCount);
  }, [decisions, scannedData]);

  const handleSave = async () => {
    if (!scannedData) return;

    // This check is to ensure the user actually made a decision to reject a B-Grade.
    const madeChanges = Object.values(decisions).some(
      (d) => d === "Not B Grade"
    );

    if (!madeChanges) {
      Swal.fire({
        icon: "info",
        title: "No Changes to Save",
        text: 'All garments are still marked as "Accept". To save, you must change at least one garment to "Not B-Grade".'
      });
      return;
    }

    setLoading(true);
    try {
      // It ONLY contains the defect_print_id and the decisions object.
      const payload = {
        defect_print_id: scannedData.defect_print_id,
        decisions: decisions
      };

      // It calls the same endpoint, which is now expecting this simpler payload.
      const response = await fetch(
        `${API_BASE_URL}/api/b-grade-defects/process-decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to save B-Grade decisions."
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "B-Grade decisions processed successfully!"
      });

      // Reset the page after successful save
      handleCancel(true); // 'true' forces the reset without a popup
    } catch (err) {
      setError(err.message);
      Swal.fire({ icon: "error", title: "Save Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (force = false) => {
    const resetState = () => {
      setScannedData(null);
      setShowScanner(true);
      setDecisions({});
      setDisplayBGradeQty(0);
      setError(null);
    };

    if (force) {
      resetState();
      return;
    }

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
        resetState();
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: 3,
          p: 3
        }}
      >
        <QC2InspectionPageTitle user={user} />
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center mt-2">
          B-Grade Defect Confirmation
        </h2>
        {showScanner && (
          <div className="text-center mb-4 max-w-md mx-auto">
            <QrCodeScannerRepair
              onScanSuccess={onScanSuccess}
              onScanError={onScanError}
            />
          </div>
        )}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <div className="p-4 my-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}
        {scannedData && (
          <div>
            <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
              <Grid
                container
                spacing={2}
                sx={{
                  "& .MuiGrid-item": { display: "flex", alignItems: "center" }
                }}
              >
                <Grid item xs={6} sm={4} md={2}>
                  <strong>Package No:</strong> {scannedData.package_no}
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <strong>MO No:</strong> {scannedData.moNo}
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <strong>Line No:</strong> {scannedData.lineNo}
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <strong>Color:</strong> {scannedData.color}
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <strong>Size:</strong> {scannedData.size}
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <strong>Style:</strong> {scannedData.custStyle}
                </Grid>
              </Grid>
            </Paper>
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.200" } }}
                  >
                    <TableCell>Garment No.</TableCell>
                    <TableCell>Defect Details</TableCell>
                    <TableCell align="center" sx={{ width: "300px" }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedData.garments.map((garment) => (
                    <TableRow key={garment.garmentNumber}>
                      <TableCell
                        sx={{ fontWeight: "bold", verticalAlign: "top" }}
                      >
                        {garment.garmentNumber}
                      </TableCell>
                      <TableCell>
                        {garment.defectDetails.map((defect, idx) => (
                          <div key={idx}>
                            {defect.defectName} - {defect.defectCount} (
                            {defect.status})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "top" }}>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center"
                          }}
                        >
                          <Button
                            variant={
                              decisions[garment.garmentNumber] === "Accept"
                                ? "contained"
                                : "outlined"
                            }
                            color="success"
                            startIcon={<Check />}
                            onClick={() =>
                              handleDecisionChange(
                                garment.garmentNumber,
                                "Accept"
                              )
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            variant={
                              decisions[garment.garmentNumber] === "Not B Grade"
                                ? "contained"
                                : "outlined"
                            }
                            color="error"
                            startIcon={<X />}
                            onClick={() =>
                              handleDecisionChange(
                                garment.garmentNumber,
                                "Not B Grade"
                              )
                            }
                          >
                            Not B-Grade
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Card
              sx={{ mt: 3, bgcolor: "#e3f2fd", maxWidth: "300px", mx: "auto" }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" component="div">
                  Final B-Grade Qty
                </Typography>
                <Typography
                  variant="h3"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {displayBGradeQty}
                </Typography>
              </CardContent>
            </Card>
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}
            >
              <Button
                onClick={handleSave}
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
              >
                Save Decisions
              </Button>
              <Button
                onClick={() => handleCancel(false)}
                variant="outlined"
                color="secondary"
                size="large"
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </div>
        )}
      </Box>
    </div>
  );
};

export default BGradeDefect;
