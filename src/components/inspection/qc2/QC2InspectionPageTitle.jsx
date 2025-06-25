//---This component is responsible for rendering the main page title and user information.---//

import React from "react";
import { useTranslation } from "react-i18next";

const QC2InspectionPageTitle = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <h1 className="text-xl md:text-2xl font-bold text-indigo-700 tracking-tight">
        Yorkmars (Cambodia) Garment MFG Co., LTD
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 md:mt-1">
        {t("qc2In.title", "QC2 Inspection")}
        {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
      </p>
    </div>
  );
};

export default QC2InspectionPageTitle;
