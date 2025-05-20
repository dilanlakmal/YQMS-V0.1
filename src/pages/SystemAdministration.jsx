import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DefectBuyerStatus from "../components/inspection/qc_roving/defectBuyserStatus";

const SystemAdministrationPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("defectStatus");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t("systemAdministration.title", "System Administration")}
        </h1>
      
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab("defectStatus")} 
            className={`px-4 py-2 ${activeTab === 'defectStatus' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-lg`}
          >
           {t("qcRoving.defectStatus")}
          </button>
         
          <button
            onClick={() => setActiveTab("cuttingEdit")} 
            className={`px-4 py-2 ${activeTab === 'cuttingEdit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {t("systemAdministration.cuttingEditTab", "Cutting Edit")} 
          </button>
           <button
            onClick={() => setActiveTab("cuttingModify")} 
            className={`px-4 py-2 ${activeTab === 'cuttingModify' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-lg`}
          >
            {t("systemAdministration.cuttingModifyTab", "Cutting Modify")} 
          </button>
          
        </div>

        {activeTab === "defectStatus" && <DefectBuyerStatus />}
        {(activeTab === "cuttingEdit" || activeTab === "cuttingModify") && (
          <div className="flex justify-center items-center h-64 text-2xl text-gray-500">
            {t("systemAdministration.comingSoon", "Coming Soon!")}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAdministrationPage;