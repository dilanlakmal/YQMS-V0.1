import React from "react";
import { useTranslation } from "react-i18next";
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

  if (!defectTrackingDetails) return null;

  return (
    <div className="mt-4 max-w-5xl mx-auto mb-4">
      <div className="bg-gray-50 rounded-lg p-4 mb-1">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {t("qc2In.defect_card_details", "Defect Card Details")}
        </h3>
        {/* ... (Header info is correct) ... */}
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
              {/* ... (Table Head cells are correct) ... */}
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
                  .map((defect, index) => (
                    <TableRow
                      key={`${garment.garmentNumber}-${defect.name}-${index}`}
                      className={
                        /* ... (className logic is correct) ... */
                        lockedGarments.has(garment.garmentNumber) ||
                        rejectedGarmentNumbers.has(garment.garmentNumber)
                          ? "bg-gray-300"
                          : defect.status === "OK"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }
                    >
                      <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                        {garment.garmentNumber}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                        {defect.repair}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                        {/* --- FIX: Use the new displayName property --- */}
                        {/* Fallback to defect.name if displayName isn't available */}
                        {defect.displayName || defect.name}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                        {defect.count}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                        {/* ... (Button logic is correct) ... */}
                        <Button
                          variant="contained"
                          color={
                            repairStatuses[
                              `${garment.garmentNumber}-${defect.name}`
                            ] === "OK"
                              ? "success"
                              : "error"
                          }
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
                          {repairStatuses[
                            `${garment.garmentNumber}-${defect.name}`
                          ] === "OK"
                            ? "PASS"
                            : "Fail"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
