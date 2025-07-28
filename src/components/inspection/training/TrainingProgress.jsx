import React from "react";
import { useTranslation } from "react-i18next";

const TrainingProgress = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {t("training.progress.title", "Training Progress")}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {t(
          "training.progress.underDevelopment",
          "This section is under development."
        )}
      </p>
    </div>
  );
};

export default TrainingProgress;
