import React from "react";
import { useTranslation } from "react-i18next";

const CartonLoadingPageTitle = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-8">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
        {t("cartonLoading.title", "Plan Packing List Upload Center")}
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
      </p>
    </div>
  );
};

export default CartonLoadingPageTitle;
