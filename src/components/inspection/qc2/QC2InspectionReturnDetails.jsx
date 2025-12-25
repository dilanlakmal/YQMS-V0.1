import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import {
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
  Button
} from "@mui/material";

const QC2InspectionReturnDetails = ({
  defectTrackingDetails,
  language,
  handleLanguageChange,
  lockedGarments,
  rejectedGarmentNumbers,
  repairStatuses,
  handleDefectStatusToggle,
  rejectedGarmentDefects
}) => {
  const { t } = useTranslation();
  const [bGradeData, setBGradeData] = useState(null);
  const [loadingBGrade, setLoadingBGrade] = useState(false);

  // Fetch B-Grade data when defectTrackingDetails changes
  useEffect(() => {
    const fetchBGradeData = async () => {
      if (!defectTrackingDetails?.defect_print_id) return;

      setLoadingBGrade(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/qc2-bgrade/by-defect-id/${defectTrackingDetails.defect_print_id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setBGradeData(data);
        } else {
          setBGradeData(null);
        }
      } catch (error) {
        console.error("Error fetching B-Grade data:", error);
        setBGradeData(null);
      } finally {
        setLoadingBGrade(false);
      }
    };

    fetchBGradeData();
  }, [defectTrackingDetails?.defect_print_id]);

  // Helper function to determine effective status considering B-Grade leader status
  const getEffectiveStatus = (garment, defect) => {
    // If the original status is not "B Grade", return as is
    if (defect.status !== "B Grade") {
      return defect.status;
    }

    // If status is "B Grade", check the B-Grade collection data
    if (bGradeData && bGradeData.bgradeArray) {
      const bGradeGarment = bGradeData.bgradeArray.find(
        bg => bg.garmentNumber === garment.garmentNumber
      );

      if (bGradeGarment) {
        // FIXED: Check leader_status instead of individual defect status
        if (bGradeGarment.leader_status === "Not B Grade") {
          return "OK";
        }
      }
    }

    // Default: return original status
    return defect.status;
  };

  // Helper function to get effective button color
  const getEffectiveButtonColor = (garment, defect) => {
    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;
    
    // Check repair status first (user interaction - highest priority)
    if (repairStatuses[repairStatusKey] === "OK") {
      return "success";
    }
    
    // Then check effective status (including B-Grade logic)
    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "success";
    }
    
    return "error";
  };

  // Helper function to get effective button text
  const getEffectiveButtonText = (garment, defect) => {
    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;
    
    // Check repair status first (user interaction - highest priority)
    if (repairStatuses[repairStatusKey] === "OK") {
      return "PASS";
    }
    
    // Then check effective status (including B-Grade logic)
    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "PASS";
    }
    
    return "Fail";
  };

  // Helper function to get effective row background color
  const getEffectiveRowClassName = (garment, defect) => {
    if (lockedGarments.has(garment.garmentNumber) || 
        rejectedGarmentNumbers.has(garment.garmentNumber)) {
      return "bg-gray-300";
    }

    const repairStatusKey = `${garment.garmentNumber}-${defect.name}`;
    
    // Check repair status first (user interaction - highest priority)
    if (repairStatuses[repairStatusKey] === "OK") {
      return "bg-green-100";
    }
    
    // Then check effective status (including B-Grade logic)
    const effectiveStatus = getEffectiveStatus(garment, defect);
    if (effectiveStatus === "OK") {
      return "bg-green-100";
    }
    
    return "bg-red-100";
  };

  // Helper function to check if status was overridden by B-Grade
  const isOverriddenByBGrade = (garment, defect) => {
    if (defect.status !== "B Grade") return false;
    
    if (bGradeData && bGradeData.bgradeArray) {
      const bGradeGarment = bGradeData.bgradeArray.find(
        bg => bg.garmentNumber === garment.garmentNumber
      );
      
      return bGradeGarment && bGradeGarment.leader_status === "Not B Grade";
    }
    
    return false;
  };

  if (!defectTrackingDetails) return null;

  return (
    <div className="mt-4 max-w-5xl mx-auto mb-4">
      <div className="bg-gray-50 rounded-lg p-4 mb-1">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {t("qc2In.defect_card_details", "Defect Card Details")}
        </h3>

        <div className="flex justify-between mb-6 bg-gray-100 p-2 rounded">
          <p className="text-gray-700">
            <strong>{t("bundle.mono")}:</strong> {defectTrackingDetails.moNo}
          </p>
          <p className="text-gray-700">
            <strong>{t("bundle.line_no")}:</strong>{" "}
            {defectTrackingDetails.lineNo}
          </p>
          <p className="text-gray-700">
            <strong>{t("bundle.color")}:</strong> {defectTrackingDetails.color}
          </p>
          <p className="text-gray-700">
            <strong>{t("bundle.size")}:</strong> {defectTrackingDetails.size}
          </p>
        </div>

        {/* B-Grade Status Indicator */}
        {loadingBGrade && (
          <div className="mb-2 text-sm text-blue-600">
            Loading B-Grade status...
          </div>
        )}
        
        {bGradeData && (
          <div className="mb-2 text-sm text-green-600 bg-green-50 p-2 rounded">
            ✓ B-Grade data loaded - garments with "Not B Grade" leader status will show as PASS
          </div>
        )}

        <div className="flex justify-end mb-1">
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel id="language-select-label">
              {t("qc2In.select_language", "Select Language")}
            </InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              label={t("qc2In.select_language", "Select Language")}
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
                {t("qc2In.garment_number", "Garment Number")}
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                {t("qc2In.repair_group", "Repair Group")}
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                {t("defIm.defect_name")} ({language})
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                {t("qc2In.defect_count", "Defect Count")}
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-200">
                {t("qc2In.status", "Status")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {defectTrackingDetails.garments.some((g) =>
              g.defects.some((d) => d.pass_bundle !== "Pass")
            ) ? (
              defectTrackingDetails.garments.map((garment) =>
                garment.defects
                  .filter((defect) => defect.pass_bundle !== "Pass")
                  .map((defect, index) => {
                    const effectiveStatus = getEffectiveStatus(garment, defect);
                    const isOverridden = isOverriddenByBGrade(garment, defect);
                    
                    return (
                      <TableRow
                        key={`${garment.garmentNumber}-${defect.name}-${index}`}
                        className={getEffectiveRowClassName(garment, defect)}
                      >
                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                          {garment.garmentNumber}
                          {/* Show B-Grade status indicator */}
                          {isOverridden && (
                            <span className="ml-1 text-xs bg-green-200 text-green-800 px-1 rounded">
                              B→PASS
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                          {defect.repair}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                          {defect.displayName || defect.name}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                          {defect.count}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                          <Button
                            variant="contained"
                            color={getEffectiveButtonColor(garment, defect)}
                            onClick={() =>
                              handleDefectStatusToggle(
                                garment.garmentNumber,
                                defect.name
                              )
                            }
                            disabled={
                              rejectedGarmentDefects.has(garment.garmentNumber) &&
                              rejectedGarmentNumbers.has(garment.garmentNumber)
                            }
                          >
                            {getEffectiveButtonText(garment, defect)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-700">
                  {t("qc2In.no_garments_found", "No garments found.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default QC2InspectionReturnDetails;
