import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AdditionalComments from "./AdditionalComments";
import AuditHeader from "./AuditHeader";
import AuditLegend from "./AuditLegend";
import AuditScoreCards from "./AuditScoreCards";
import AuditTable from "./AuditTable";
import { useAuditLogic } from "./useAuditLogic";

const AuditSection = ({ mainTitle }) => {
  const { t } = useTranslation();
  const [sectionEnabled, setSectionEnabled] = useState(true);

  const {
    isLoading,
    error,
    auditItems,
    handleAuditDataChange,
    sectionTitleForDisplay,
    currentLang,
    scores,
    hasData
  } = useAuditLogic(mainTitle);

  if (isLoading)
    return (
      <div className="p-6 text-center">
        {t("common.loading", "Loading audit data...")}
      </div>
    );
  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        {t("common.error", "Error")}: {error}
      </div>
    );
  if (!hasData) {
    return (
      <div className="p-6 text-center">
        {t("common.noDataFoundFor", { title: mainTitle }) ||
          `Audit data for "${mainTitle}" not found or failed to initialize.`}
      </div>
    );
  }

  return (
    <div className="p-1">
      <h2 className="text-sm sm:text-lg font-semibold text-gray-800 my-4 px-4 sm:px-6 text-center sm:text-left">
        {sectionTitleForDisplay}
      </h2>
      <AuditHeader />
      <AuditLegend />

      <div className="mx-4 sm:mx-6 my-3 flex items-center gap-2">
        <label
          htmlFor={`enableSectionToggle-${mainTitle}`}
          className="text-sm font-medium text-gray-700"
        >
          {t("auditTable.enableTable")}:
        </label>
        <div className="flex items-center">
          <button
            onClick={() => setSectionEnabled(true)}
            className={`px-3 py-1 text-xs rounded-l-md border ${
              sectionEnabled
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t("auditTable.yes")}
          </button>
          <button
            onClick={() => setSectionEnabled(false)}
            className={`px-3 py-1 text-xs rounded-r-md border ${
              !sectionEnabled
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t("auditTable.no")}
          </button>
        </div>
      </div>

      <AuditTable
        auditData={auditItems}
        onAuditDataChange={handleAuditDataChange}
        sectionEnabled={sectionEnabled}
        currentLang={currentLang}
      />

      <AdditionalComments
        sectionEnabled={sectionEnabled}
        mainTitle={mainTitle}
      />

      <AuditScoreCards
        maxScore={scores.maxScore}
        maxPossibleScore={scores.maxPossibleScore}
        totalScoreAchieved={scores.totalScoreAchieved}
        sectionEnabled={sectionEnabled}
      />
    </div>
  );
};

export default AuditSection;
