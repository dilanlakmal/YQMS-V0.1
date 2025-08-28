import { BarChart3, Check, LayoutDashboard } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import SubConQCInspection from "../components/inspection/sub-con-qc1/SubConQCInspection";
import SubConQCReport from "../components/inspection/sub-con-qc1/SubConQCReport";

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

const SubConQC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  // Lift state up to this parent component to preserve it across tabs
  const [inspectionState, setInspectionState] = useState({
    inspectionDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null,
    checkedQty: "",
    defects: [] // This will store the defects with quantities
  });

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        labelKey: "subcon.tabs.inspection",
        icon: <Check size={18} />,
        component: (
          <SubConQCInspection
            inspectionState={inspectionState}
            setInspectionState={setInspectionState}
          />
        )
      },
      {
        id: "report",
        labelKey: "subcon.tabs.report",
        icon: <BarChart3 size={18} />,
        component: <SubConQCReport title="Report" />
      },
      {
        id: "dashboard",
        labelKey: "subcon.tabs.dashboard",
        icon: <LayoutDashboard size={18} />,
        component: <PlaceholderComponent title="Dashboard" />
      }
    ],
    [inspectionState] // Dependency ensures component gets latest state
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 sm:p-3 lg:p-4">
      <div className="max-w-8xl mx-auto">
        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
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

export default SubConQC;
