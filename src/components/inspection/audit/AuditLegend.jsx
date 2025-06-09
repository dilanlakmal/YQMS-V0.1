import React from "react";
import { useTranslation } from "react-i18next";

const AuditLegend = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-4 sm:mx-6 mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
      <ul className="space-y-1">
        <li className="text-xs text-gray-600">{t("auditlegend.mustHave")}</li>
        <li className="text-xs text-gray-600">{t("auditlegend.levels")}</li>
        <li className="text-xs text-gray-600">
          {t("auditlegend.scoreDeduction")}
        </li>
      </ul>
    </div>
  );
};

export default AuditLegend;
