import React, { useState, useMemo } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { Check, BarChart3 } from "lucide-react";
import SupplierPageTitle from "../components/inspection/supplier_issue/SupplierPageTitle";
import SupplierInspectionForm from "../components/inspection/supplier_issue/SupplierInspectionForm";

const PlaceholderComponent = ({ title }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex justify-center items-center">
    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
      {title}
    </h2>
  </div>
);

const SupplierIssues = () => {
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  const tabs = useMemo(
    () => [
      {
        id: "inspection",
        label: "Inspection",
        icon: <Check size={18} />,
        component: <SupplierInspectionForm />
      },
      {
        id: "results",
        label: "Results",
        icon: <BarChart3 size={18} />,
        component: <PlaceholderComponent title="Results Under Development" />
      }
    ],
    []
  );

  const activeComponent = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.component || null,
    [activeTab, tabs]
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <SupplierPageTitle user={user} />

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
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">{activeComponent}</div>
      </div>
    </div>
  );
};

export default SupplierIssues;
