//---This is a wrapper component for the entire inspection interface that appears after scanning a bundle.---//

import React from "react";
import QC2InspectionActions from "./QC2InspectionActions";
import QC2InspectionDashboard from "./QC2InspectionDashboard";
import QC2InspectionReturnDetails from "./QC2InspectionReturnDetails";
import DefectBox from "../DefectBox";

const QC2InspectionWindow = (props) => {
  const {
    bundleData,
    isReturnInspection,
    sessionData,
    totalPass,
    totalRejects,
    defectQty,
    hasDefects,
    selectedGarment,
    rejectedGarmentNumbers,
    qrCodesData,
    printMethod,
    isPassingBundle,
    rejectedOnce,
    passBundleCountdown,
    generateQRDisabled,
    isBluetoothConnected,
    printing,
    handleRejectGarment,
    handlePassBundle,
    handleGenerateQRCodes,
    handlePrintQRCode,
    setShowQRPreview,
    defectTrackingDetails,
    language,
    handleLanguageChange,
    lockedGarments,
    repairStatuses,
    handleDefectStatusToggle,
    rejectedGarmentDefects,
    showDefectBoxes,
    tempDefects,
    setTempDefects,
    activeFilter,
    confirmedDefects,
    sortOption
  } = props;

  return (
    <>
      <div className="p-2 bg-blue-100 border-b">
        <div className="flex items-center">
          <QC2InspectionActions
            hasDefects={hasDefects}
            isReturnInspection={isReturnInspection}
            totalPass={totalPass}
            selectedGarment={selectedGarment}
            rejectedGarmentNumbers={rejectedGarmentNumbers}
            qrCodesData={qrCodesData}
            printMethod={printMethod}
            isPassingBundle={isPassingBundle}
            rejectedOnce={rejectedOnce}
            passBundleCountdown={passBundleCountdown}
            defectQty={defectQty}
            generateQRDisabled={generateQRDisabled}
            isBluetoothConnected={isBluetoothConnected}
            printing={printing}
            handleRejectGarment={handleRejectGarment}
            handlePassBundle={handlePassBundle}
            handleGenerateQRCodes={handleGenerateQRCodes}
            handlePrintQRCode={handlePrintQRCode}
            setShowQRPreview={setShowQRPreview}
          />
          <QC2InspectionDashboard
            bundleData={bundleData}
            isReturnInspection={isReturnInspection}
            sessionData={sessionData}
            totalPass={totalPass}
            totalRejects={totalRejects}
            defectQty={defectQty}
          />
        </div>
      </div>
      <div className="h-[calc(100vh-200px)] overflow-y-auto p-2">
        <QC2InspectionReturnDetails
          defectTrackingDetails={defectTrackingDetails}
          language={language}
          handleLanguageChange={handleLanguageChange}
          lockedGarments={lockedGarments}
          rejectedGarmentNumbers={rejectedGarmentNumbers}
          repairStatuses={repairStatuses}
          handleDefectStatusToggle={handleDefectStatusToggle}
          rejectedGarmentDefects={rejectedGarmentDefects}
        />

        {showDefectBoxes && (
          <DefectBox
            language={language}
            tempDefects={tempDefects}
            onDefectUpdate={setTempDefects}
            activeFilter={activeFilter}
            confirmedDefects={confirmedDefects}
            sortOption={sortOption}
          />
        )}
      </div>
    </>
  );
};

export default QC2InspectionWindow;
