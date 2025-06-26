import React, { useState, useEffect, useCallback } from "react";
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
import {
  CheckCircle,
  AlertTriangle,
  Ban,
  CalendarDays,
  Clock
} from "lucide-react";
import { useTranslation } from "react-i18next";

const DefectTrack = () => {
  const { t } = useTranslation(); // Add translation hook
  const { user, loading: authLoading } = useAuth();
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("khmer");
  const [showScanner, setShowScanner] = useState(true);
  const [defectsMasterList, setDefectsMasterList] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date()); // Add currentTime state

  // Add useEffect for the clock
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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

  // Create the PageTitle component, exactly like in Packing.jsx
  const PageTitle = useCallback(
    () => (
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
          {t("defectTrack.header", "Repair Tracking")}{" "}
          {/* Using a new translation key */}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap justify-center items-center">
          <span className="mx-1.5 text-slate-400">|</span>
          <CalendarDays className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleDateString()}
          </span>
          <span className="mx-1.5 text-slate-400">|</span>
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span className="text-slate-700">
            {currentTime.toLocaleTimeString()}
          </span>
        </p>
      </div>
    ),
    [t, user, currentTime]
  );

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
                status: defect.status || "Fail",
                isLocked: defect.pass_bundle === "Pass"
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
      // 1. Fetch the bundle_random_id needed for the B-Grade record.

      const bundleResponse = await fetch(
        `${API_BASE_URL}/api/qc2-inspection-pass-bundle-by-defect-print-id/${scannedData.defect_print_id}`
      );
      if (!bundleResponse.ok) {
        // If this fails, we can still proceed with saving repair tracking, but we'll warn the user.
        console.warn(
          "Could not find the parent inspection bundle. B-Grade records will not be created."
        );
      } else {
        const bundleData = await bundleResponse.json();
        const bundle_random_id = bundleData.bundle_random_id;

        // 2. Identify garments that have at least one 'B Grade' defect.
        const bGradeGarments = scannedData.garments.filter((g) =>
          g.defects.some((d) => d.status === "B Grade")
        );

        // 3. Loop through them and send a request for EACH new B-Grade garment.
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

          if (garmentDataForBGrade.defectDetails.length === 0) continue;

          const headerData = {
            package_no: scannedData.package_no,
            moNo: scannedData.moNo,
            custStyle: scannedData.custStyle,
            color: scannedData.color,
            size: scannedData.size,
            lineNo: scannedData.lineNo,
            department: scannedData.department
          };

          // This calls original B-Grade endpoint with the new ID.
          await fetch(`${API_BASE_URL}/api/qc2-bgrade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              defect_print_id: scannedData.defect_print_id,
              bundle_random_id: bundle_random_id, // Pass the ID here
              garmentData: garmentDataForBGrade,
              headerData
            })
          });
        }
      }

      const repairArray = scannedData.garments.flatMap((garment) =>
        garment.defects.map((defect) => ({
          defectName: defect.name,
          defectCount: defect.count,
          repairGroup: defect.repair,
          status: defect.status,
          garmentNumber: garment.garmentNumber,
          pass_bundle: defect.pass_bundle
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
        text: "Data saved successfully!"
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
        {/* Render the PageTitle component here */}
        <PageTitle />

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
                          backgroundColor: defect.isLocked
                            ? "rgba(220, 220, 220, 0.7)" // Locked (Pass Bundle)
                            : isBGradeNow
                            ? "rgba(255, 230, 230, 1)" // B-Grade style
                            : defect.status === "OK"
                            ? "rgba(230, 255, 230, 1)" // OK style
                            : "inherit",
                          "&:hover": {
                            backgroundColor: defect.isLocked
                              ? "rgba(220, 220, 220, 0.7)"
                              : isBGradeNow
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
                            disabled={
                              garment.isPermanentlyBGrade || defect.isLocked
                            }
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
