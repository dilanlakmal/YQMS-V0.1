import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ListPlus, Wrench } from "lucide-react";

// Import the components for each tab
import SelectDTSpecPageTitle from "../components/inspection/select_specs/SelectDTSpecPageTitle";
import SelectDTBuyerSpec from "../components/inspection/select_specs/SelectDTBuyerSpec";
import EditDTSpecs from "../components/inspection/select_specs/EditDTSpecs";

import { useAuth } from "../components/authentication/AuthContext";

const ManageBuyerSpecs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("select");

  const tabs = useMemo(
    () => [
      {
        id: "select",
        label: "Select Specs",
        icon: <ListPlus size={18} />,
        component: <SelectDTBuyerSpec />
      },
      {
        id: "edit",
        label: "Edit Specs",
        icon: <Wrench size={18} />,
        component: <EditDTSpecs />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-1 sm:p-2 lg:p-3">
      <div className="max-w-screen-2xl mx-auto">
        <SelectDTSpecPageTitle user={user} />
        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap
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

        <div className="mt-2">{activeComponent}</div>
      </div>
    </div>
  );
};

export default ManageBuyerSpecs;
