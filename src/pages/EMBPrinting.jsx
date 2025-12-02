import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Camera,
  Package,
  ClipboardCheck,
  CheckCircle
} from "lucide-react";
import EMBPrintingInspection from "../components/inspection/emb_printing/EMBPrintingInspection";

const EMBPrinting = () => {
  const { t } = useTranslation();
  const [inspectionType, setInspectionType] = useState("Output Inspection");

  const handleChangeType = () => {
    // Add logic to change inspection type if needed
    console.log("Change Type clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <div className="p-4 md:p-6">
          <EMBPrintingInspection />
        </div>
      </div>
    </div>
  );
};

export default EMBPrinting;

