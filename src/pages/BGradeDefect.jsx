import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../config";
import Swal from "sweetalert2";
import QrCodeScannerRepair from "../components/forms/QrCodeScannerRepair";
import QRCodeUpload from "../components/forms/QRCodeUpload"; // Import the upload component
import {
  AlertCircle,
  Check,
  X,
  Sparkles,
  User,
  Scan,
  CalendarDays,
  Clock,
  ShieldCheck,
  Camera,
  Upload
} from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("scan");
  const [scanMethod, setScanMethod] = useState("camera"); // "camera" or "upload"

  // Define tabs with modern icons
  const tabs = useMemo(
    () => [
      {
        id: "scan",
        label: "B-Grade Confirmation",
        icon: <Scan size={20} />,
        description: "Scan and Process B-Grade Defects"
      }
    ],
    []
  );

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Update current time
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      B-Grade Defect Confirmation
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        QC
                      </span>
                    </div>
                  </div>
                  {/* Active Tab Indicator - Inline with title */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </div>
                    <p className="text-[10px] text-indigo-100 font-medium truncate">
                      {activeTabData?.label} • Active
                    </p>
                  </div>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Inspector"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Date and Time Info */}
            <div className="flex items-center justify-center gap-4 text-white/80 text-xs">
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <ShieldCheck size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        B-Grade Defect Confirmation
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">QC</span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Yorkmars (Cambodia) Garment MFG Co., LTD
                    </p>
                  </div>
                </div>

                {/* Date and Time Info */}
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {activeTabData?.label}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      Active Module
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Inspector"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              boxShadow: 3,
              p: 3
            }}
          >
            {showScanner && (
              <div className="space-y-6">
                {/* Scan Method Selection */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setScanMethod("camera")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "camera"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <Camera size={18} />
                      <span className="font-medium">Camera Scan</span>
                    </button>
                    <button
                      onClick={() => setScanMethod("upload")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                        scanMethod === "upload"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <Upload size={18} />
                      <span className="font-medium">Upload Image</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Rendering based on scan method */}
                <div className="text-center mb-4 max-w-md mx-auto">
                  {scanMethod === "camera" ? (
                    <QrCodeScannerRepair
                      onScanSuccess={onScanSuccess}
                      onScanError={onScanError}
                    />
                  ) : (
                    <QRCodeUpload
                      onScanSuccess={onScanSuccess}
                      onScanError={onScanError}
                      disabled={loading}
                    />
                  )}
                </div>
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
                      "& .MuiGrid-item": {
                        display: "flex",
                        alignItems: "center"
                      }
                    }}
                  >
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>Package No:</strong> {scannedData.package_no}
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>MO No:</strong> {scannedData.moNo}
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>Line No:</strong> {scannedData.lineNo}
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>Color:</strong> {scannedData.color}
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>Size:</strong> {scannedData.size}
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <strong>Style:</strong> {scannedData.custStyle}
                    </Grid>
                  </Grid>
                </Paper>

                <TableContainer component={Paper} elevation={3}>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": { fontWeight: "bold", bgcolor: "grey.200" }
                        }}
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
                          <TableCell
                            align="center"
                            sx={{ verticalAlign: "top" }}
                          >
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
                                  decisions[garment.garmentNumber] ===
                                  "Not B Grade"
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
                  sx={{
                    mt: 3,
                    bgcolor: "#e3f2fd",
                    maxWidth: "300px",
                    mx: "auto"
                  }}
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
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 4,
                    gap: 2
                  }}
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
      </div>

      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0; 
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .bg-grid-white {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default BGradeDefect;
