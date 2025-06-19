import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import Scanner from "../../forms/Scanner";

const QC2InspectionScannerView = ({
  onScanSuccess,
  onScanError,
  loadingData
}) => {
  const { t } = useTranslation();

  return (
    // This outer div centers the entire scanner block on the page.
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* 
        This is the new container that mimics the style of Washing.jsx scanner.
        - `bg-white`: Gives it a distinct background.
        - `p-4 md:p-6`: Adds padding inside the box.
        - `rounded-lg`: Rounds the corners.
        - `shadow-xl`: Adds a prominent shadow to make it "pop" off the page.
        - `w-full max-w-md`: Makes it responsive but constrains the max width to be small and manageable.
      */}
      <div className="bg-white p-2 md:p-4 rounded-lg shadow-xl w-full max-w-md">
        <div className="w-full">
          <Scanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
        </div>

        {loadingData && (
          <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>{t("qc2In.loading_data", "Loading Data...")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QC2InspectionScannerView;
