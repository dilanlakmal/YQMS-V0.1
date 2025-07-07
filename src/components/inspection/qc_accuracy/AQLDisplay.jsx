import React from "react";
import { useTranslation } from "react-i18next";
import { getAqlDetails } from "./aqlHelper";
import {
  ListChecks,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users
} from "lucide-react";

const AQLDisplay = ({ checkedQty }) => {
  const { t } = useTranslation();
  const aql = getAqlDetails(checkedQty);

  if (!checkedQty || checkedQty <= 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-100 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg shadow-sm">
      <h4 className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
        <ListChecks size={20} className="mr-2" />
        {t("qcAccuracy.aqlSamplingPlan", "AQL Sampling Plan")}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-center">
          <FileText size={16} className="mr-2 text-blue-500" />
          {t("qcAccuracy.codeLetter", "Code Letter")}:
          <strong className="ml-2 font-mono">{aql.codeLetter}</strong>
        </div>
        <div className="flex items-center">
          <Users size={16} className="mr-2 text-blue-500" />
          {t("qcAccuracy.sampleSize", "Sample Size")}:
          <strong className="ml-2 font-mono">{aql.sampleSize}</strong>
        </div>
        <div className="flex items-center text-green-700 dark:text-green-400">
          <CheckCircle size={16} className="mr-2" />
          {t("qcAccuracy.accept", "Accept (Ac)")}:
          <strong className="ml-2 font-mono">{aql.ac}</strong>
        </div>
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertTriangle size={16} className="mr-2" />
          {t("qcAccuracy.reject", "Reject (Re)")}:
          <strong className="ml-2 font-mono">{aql.re}</strong>
        </div>
      </div>
    </div>
  );
};

export default AQLDisplay;
