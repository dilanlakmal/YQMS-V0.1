import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  List,
  Factory,
  Users,
  RefreshCw,
  LayoutDashboard
} from "lucide-react";
import QCWorkersQCInspection from "../components/inspection/qcOutput/QCWorkersQCInspection";
import SunriseDataSync from "../components/inspection/qcOutput/SunriseDataSync";
import QC1Dashboard from "../components/inspection/qcOutput/QC1Dashboard";

// Placeholder for other tabs
const PlaceholderComponent = ({ title }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {title}
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      This section is under development.
    </p>
  </div>
);

const QCOutput = ({ user }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("qcInspection");

  const tabs = useMemo(
    () => [
      {
        id: "qcInspection",
        label: "QC1/QC2 Inspection",
        icon: <BarChart size={18} />,
        component: <QCWorkersQCInspection />
      },
      {
        id: "dataSync",
        label: "Sunrise Data Sync",
        icon: <RefreshCw size={18} />,
        component: <SunriseDataSync />
      },
      {
        id: "qc1Dashboard",
        label: "QC1 Dashboard",
        icon: <LayoutDashboard size={18} />,
        component: <QC1Dashboard />
      },
      {
        id: "qc1Summary",
        label: "QC1 Summary",
        icon: <List size={18} />,
        component: <PlaceholderComponent title="QC1 Summary" />
      },
      {
        id: "qc2Summary",
        label: "QC2 Summary",
        icon: <Users size={18} />,
        component: <PlaceholderComponent title="QC2 Summary" />
      },
      {
        id: "factorySummary",
        label: "Factory Summary",
        icon: <Factory size={18} />,
        component: <PlaceholderComponent title="Factory Summary" />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-center text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-center text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t("qcOutput.title", "YM QC1 - QC2 Inspection")}
          {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
        </p>

        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                }`}
              >
                {React.cloneElement(tab.icon, { className: "mr-2" })}
                {t(tab.label)}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default QCOutput;
