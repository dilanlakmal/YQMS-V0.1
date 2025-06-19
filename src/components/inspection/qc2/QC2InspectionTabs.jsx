//---This component renders the main navigation tabs on top---//

import React from "react";
import { useTranslation } from "react-i18next";
import { ClipboardCheck, Eye, Redo, Database, Tag } from "lucide-react";

const QC2InspectionTabs = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const tabIcons = {
    first: <ClipboardCheck />,
    edit: <Eye />,
    return: <Redo />,
    data: <Database />,
    "defect-cards": <Tag />
  };

  const tabs = ["first", "edit", "return", "data", "defect-cards"];

  return (
    <div className="mt-4 border-b border-gray-300">
      <nav
        className="-mb-px flex space-x-1 sm:space-x-4 justify-center"
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`group inline-flex items-center py-2 sm:py-3 px-1 sm:px-4 border-b-2 font-semibold text-xs sm:text-sm focus:outline-none transition-all duration-200 ease-in-out
              ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-indigo-700 hover:border-indigo-300"
              }`}
          >
            {React.cloneElement(tabIcons[tab], {
              className: `mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 ${
                activeTab === tab
                  ? "text-indigo-600"
                  : "text-gray-400 group-hover:text-indigo-500"
              }`
            })}
            {t(`qc2In.tabs.${tab}`)}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default QC2InspectionTabs;
