import React, { useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import {
  Check,
  BarChart3,
  LayoutDashboard,
  FileBarChart,
  UserCheck,
  Loader2
} from "lucide-react";
import ANFMeasurementPageTitle from "../components/inspection/ANF_measurement/ANFMeasurementPageTitle";
import ANFMeasurementInspectionForm from "../components/inspection/ANF_measurement/ANFMeasurementInspectionForm";
import ANFMeasurementResults from "../components/inspection/ANF_measurement/ANFMeasurementResults";
import ANFMeasurementQCDailyReport from "../components/inspection/ANF_measurement/ANFMeasurementQCDailyReport";
import ANFMeasurementBuyerReportSize from "../components/inspection/ANF_measurement/ANFMeasurementBuyerReportSize";
import ANFBuyerStyleView from "../components/inspection/ANF_measurement/ANFBuyerStyleView";

// --- DYNAMICALLY IMPORT the component due to heavy content ---
const ANFStyleView = lazy(() =>
  import("../components/inspection/ANF_measurement/ANFStyleView")
);

const PlaceholderComponent = ({ title }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

// --- simple loading component for Suspense ---
const TabLoader = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

const ANFMeasurement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  // --- LIFTED STATE FROM THE FORM COMPONENT ---
  const [inspectionState, setInspectionState] = useState({
    stage: { value: "M1", label: "M1 - 5 Points" },
    inspectionDate: new Date(),
    selectedMo: null,
    selectedSize: null,
    selectedColors: [],
    garments: [{}],
    currentGarmentIndex: 0
  });

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        labelKey: "anfMeasurement.tabs.inspection",
        icon: <Check size={18} />,
        component: (
          <ANFMeasurementInspectionForm
            inspectionState={inspectionState}
            setInspectionState={setInspectionState}
          />
        )
      },
      {
        id: "results-size",
        labelKey: "anfMeasurement.tabs.results",
        icon: <BarChart3 size={18} />,
        component: <ANFMeasurementResults />
      },
      {
        id: "qc-daily-report",
        labelKey: "anfMeasurement.tabs.qcDailyReport",
        icon: <FileBarChart size={18} />,
        component: <ANFMeasurementQCDailyReport />
      },
      {
        id: "style-view",
        labelKey: "anfMeasurement.tabs.styleView",
        icon: <FileBarChart size={18} />,
        // --- WRAP the lazy component in Suspense ---
        component: (
          <Suspense fallback={<TabLoader />}>
            <ANFStyleView />
          </Suspense>
        )
      },

      {
        id: "buyer-report-size",
        labelKey: "anfMeasurement.tabs.buyerReportSize",
        icon: <UserCheck size={18} />,
        component: <ANFMeasurementBuyerReportSize />
      },
      {
        id: "buyer-style-view",
        labelKey: "anfMeasurement.tabs.buyerstyleView",
        icon: <FileBarChart size={18} />,
        // --- WRAP the lazy component in Suspense ---
        component: (
          <Suspense fallback={<TabLoader />}>
            <ANFBuyerStyleView />
          </Suspense>
        )
      },
      {
        id: "dashboard",
        labelKey: "anfMeasurement.tabs.dashboard",
        icon: <LayoutDashboard size={18} />,
        component: <PlaceholderComponent title="Dashboard" />
      }
    ],
    [inspectionState]
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <ANFMeasurementPageTitle user={user} />

        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap
                                  ${
                                    activeTab === tab.id
                                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500"
                                  }`}
              >
                {React.cloneElement(tab.icon, { className: "mr-2" })}
                {t(
                  tab.labelKey,
                  tab.id.charAt(0).toUpperCase() + tab.id.slice(1)
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default ANFMeasurement;
