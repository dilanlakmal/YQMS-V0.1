import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DefectBuyerStatus from "../components/inspection/qc_roving/DefectBuyserStatus";
import CuttingMeasurementPointsModify from "../components/inspection/cutting/CuttingMeasurementPointsModify";
import CuttingOrderModify from "../components/inspection/cutting/CuttingOrderModify";

const SystemAdmin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("rovingDefects");

  // Placeholder components for other tabs
  const CuttingPoints = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {t("systemAdmin.cuttingPoints", "Cutting Points")}
      </h2>
      <p className="text-gray-600">
        {t(
          "systemAdmin.cuttingPointsPlaceholder",
          "Cutting Points content will be implemented here."
        )}
      </p>
    </div>
  );

  const CuttingAdding = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {t("systemAdmin.cuttingAdding", "Cutting Adding")}
      </h2>
      <p className="text-gray-600">
        {t(
          "systemAdmin.cuttingAddingPlaceholder",
          "Cutting Adding content will be implemented here."
        )}
      </p>
    </div>
  );

  const CuttingDefects = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {t("systemAdmin.cuttingDefects", "Cutting Defects")}
      </h2>
      <p className="text-gray-600">
        {t(
          "systemAdmin.cuttingDefectsPlaceholder",
          "Cutting Defects content will be implemented here."
        )}
      </p>
    </div>
  );

  const QC2Defects = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {t("systemAdmin.qc2Defects", "QC2 Defects")}
      </h2>
      <p className="text-gray-600">
        {t(
          "systemAdmin.qc2DefectsPlaceholder",
          "QC2 Defects content will be implemented here."
        )}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t("systemAdmin.title", "System Administration")}
        </h1>
        <div className="flex justify-center mb-6 space-x-2">
          <button
            onClick={() => setActiveTab("rovingDefects")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "rovingDefects"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            {t("systemAdmin.rovingDefects", "Roving Defects")}
          </button>
          <button
            onClick={() => setActiveTab("cuttingPoints")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "cuttingPoints"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            {t("systemAdmin.cuttingPoints", "Cutting Points")}
          </button>
          <button
            onClick={() => setActiveTab("cuttingAdding")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "cuttingAdding"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            {t("systemAdmin.cuttingAdding", "Cutting Adding")}
          </button>
          <button
            onClick={() => setActiveTab("cuttingDefects")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "cuttingDefects"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            {t("systemAdmin.cuttingDefects", "Cutting Defects")}
          </button>
          <button
            onClick={() => setActiveTab("qc2Defects")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "qc2Defects"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            {t("systemAdmin.qc2Defects", "QC2 Defects")}
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "rovingDefects" && <DefectBuyerStatus />}
          {activeTab === "cuttingPoints" && <CuttingMeasurementPointsModify />}
          {activeTab === "cuttingAdding" && <CuttingOrderModify />}
          {/* {activeTab === "cuttingDefects" && <CuttingDefects />}
          {activeTab === "qc2Defects" && <QC2Defects />}  */}
        </div>
      </div>
    </div>
  );
};

export default SystemAdmin;
