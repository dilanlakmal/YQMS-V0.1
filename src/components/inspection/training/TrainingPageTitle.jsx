import React from "react";
import { useTranslation } from "react-i18next";

const TrainingPageTitle = ({ user }) => {
  const { t } = useTranslation();

  return (
    // This container centers the text and provides bottom margin, just like the example.
    <div className="text-center mb-6">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
        {/* Use the translation key for the specific training page title */}
        {t("training.pageTitle", "YQMS Training Schedule")}

        {/* Conditionally render user information, following the exact pattern of QAPageTitle */}
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id || "N/A"}`}
      </p>
    </div>
  );
};

export default TrainingPageTitle;
