// src/components/inspection/qc_accuracy/QAPageTitle.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const QAPageTitle = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-6">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
        {/* Use the translation key for the page title */}
        {t("qcAccuracy.title", "QA Random Inspection")}

        {/* Conditionally render user information if the user object is available */}
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
      </p>
    </div>
  );
};

export default QAPageTitle;
