//---This is a wrapper component for the entire inspection interface that appears after scanning a bundle.---//

import React from "react";
import QC2InspectionActions from "./QC2InspectionActions";
import QC2InspectionDashboard from "./QC2InspectionDashboard";
import QC2InspectionReturnDetails from "./QC2InspectionReturnDetails";
import DefectBox from "../DefectBox";

const QC2InspectionWindow = (props) => {
  const {
    // --- FIX: Receive the master defects list ---
    defectsData,
    language,
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
          {/* These components seem correct and just receive props */}
          <QC2InspectionActions {...props} />
          <QC2InspectionDashboard {...props} />
        </div>
      </div>
      <div className="h-[calc(100vh-200px)] overflow-y-auto p-2">
        {/* QC2InspectionReturnDetails also receives all props it needs */}
        <QC2InspectionReturnDetails {...props} />

        {showDefectBoxes && (
          // --- FIX: Pass all required props to DefectBox ---
          <DefectBox
            defectsData={defectsData} // Pass the master data
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
