//---This component displays the QR code scanner interface.---//

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
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-2xl h-96">
        <Scanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
        {loadingData && (
          <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>{t("qc2In.loading_data")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QC2InspectionScannerView;
