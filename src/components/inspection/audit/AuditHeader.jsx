import React from "react";
import { useTranslation } from "react-i18next";

const AuditHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-4 sm:mx-6 my-4 p-4 sm:p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
      <h3 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-2">
        {" "}
        {/* Corrected h3 size back to sm:text-xl */}
        {t("qaauditheaders.scopeTitle")}
      </h3>
      <p className="text-sm text-gray-700 leading-relaxed">
        {" "}
        {/* Changed to text-sm */}
        {t("qaauditheaders.scopeParagraph")}
      </p>
    </div>
  );
};

export default AuditHeader;
