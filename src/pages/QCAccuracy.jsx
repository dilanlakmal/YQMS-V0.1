import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { Check, BarChart3, TrendingUp, BookOpen } from "lucide-react";
import QAInspectionForm from "../components/inspection/qc_accuracy/QAInspectionForm";
import QAAccuracyResults from "../components/inspection/qc_accuracy/QAAccuracyResults";
import QCAccuracyFullReport from "../components/inspection/qc_accuracy/QCAccuracyFullReport";
import QAPageTitle from "../components/inspection/qc_accuracy/QAPageTitle";
import QAAccuracyDashboard from "../components/inspection/qc_accuracy/QAAccuracyDashboard";

// Placeholder for other tabs
const PlaceholderComponent = ({ titleKey, contentKey }) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {t(titleKey)}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {t(contentKey, "This section is under development.")}
      </p>
    </div>
  );
};

const QCAccuracy = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        labelKey: "qcAccuracy.tabs.inspection",
        icon: <Check size={18} />,
        component: <QAInspectionForm />
      },
      {
        id: "results",
        labelKey: "qcAccuracy.tabs.results",
        icon: <BarChart3 size={18} />,
        // --- FIX #3: REPLACE PLACEHOLDER WITH THE REAL COMPONENT ---
        component: <QAAccuracyResults />
      },
      {
        id: "full-report",
        labelKey: "qcAccuracy.tabs.fullReport",
        icon: <BookOpen size={18} />,
        component: <QCAccuracyFullReport />
      },
      {
        id: "dashboard",
        labelKey: "qcAccuracy.tabs.dashboard",
        icon: <BookOpen size={18} />,
        component: <QAAccuracyDashboard />
      },
      // {
      //   id: "results",
      //   labelKey: "qcAccuracy.tabs.results",
      //   icon: <BarChart3 size={18} />,
      //   component: <PlaceholderComponent titleKey="qcAccuracy.tabs.results" />
      // },
      {
        id: "trend",
        labelKey: "qcAccuracy.tabs.trend",
        icon: <TrendingUp size={18} />,
        component: <PlaceholderComponent titleKey="qcAccuracy.tabs.trend" />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <QAPageTitle user={user} />

        {/* Tab Navigation */}
        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                  }`}
              >
                {React.cloneElement(tab.icon, { className: "mr-2" })}
                {t(tab.labelKey, tab.id)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default QCAccuracy;
