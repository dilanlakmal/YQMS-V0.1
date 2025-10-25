import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import ANFUploader from "../components/inspection/CartonLoading/ANFUploader";
import CartonLoadingPageTitle from "../components/inspection/CartonLoading/CartonLoadingPageTitle";
import PlaceholderUploader from "../components/inspection/CartonLoading/PlaceholderUploader";

const PackingList = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ANF / Aritzia");
  const tabs = ["ANF / Aritzia", "Costco", "Reitmans"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "ANF / Aritzia":
        return <ANFUploader />;
      case "Costco":
        return <PlaceholderUploader buyer="Costco" />;
      case "Reitmans":
        return <PlaceholderUploader buyer="Reitmans" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <CartonLoadingPageTitle user={user} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                aria-current={activeTab === tab ? "page" : undefined}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default PackingList;
