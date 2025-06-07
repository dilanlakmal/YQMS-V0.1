import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import FinalHTReports from "./FinalHTReports";
import FinalFUReports from "./FinalFUReports";
import FinalElasticReports from "./FinalElasticReports";
import FinalEMBReports from "./FinalEMBReports";
import { Settings2 } from "lucide-react";

const FinalConsolidateReport = () => {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState("HT");

  const reports = [
    { key: "HT", label: t("scc.finalReports.ht", "Heat Transfer") },
    { key: "FU", label: t("scc.finalReports.fu", "Fusing"), disabled: false }, // Enable the tab
    {
      key: "EMB",
      label: t("scc.finalReports.emb", "Embroidery"),
      disabled: false
    },
    {
      key: "Elastic",
      label: t("scc.finalReports.elastic", "Elastic"),
      disabled: false
    }
  ];

  const renderActiveReport = () => {
    switch (activeReport) {
      case "HT":
        return <FinalHTReports />;
      case "FU":
        return <FinalFUReports />;
      case "Elastic":
        return <FinalElasticReports />;
      case "EMB":
        return <FinalEMBReports />;
      default:
        return (
          <div className="text-center py-20 text-gray-500">
            <Settings2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl">{t("scc.tabUnderConstruction")}</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-4">
        {t("scc.finalReports.title", "Final Consolidated Reports")}
      </h1>

      <div className="flex justify-center border-b border-gray-200 mb-6">
        {reports.map((report) => (
          <button
            key={report.key}
            onClick={() => !report.disabled && setActiveReport(report.key)}
            disabled={report.disabled}
            className={`px-4 py-2 text-sm font-medium focus:outline-none ${
              activeReport === report.key
                ? "border-b-2 border-indigo-500 text-indigo-600"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            } ${report.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {report.label}
          </button>
        ))}
      </div>

      <div>{renderActiveReport()}</div>
    </div>
  );
};

export default FinalConsolidateReport;
