import { FileText, Layers, Users } from "lucide-react";
import React, { useMemo, useState } from "react";
import YPivotQASectionsProductCategory from "./YPivotQASectionsProductCategory";
import YPivotQASectionsProductDefectManagement from "./YPivotQASectionsProductDefectManagement";

// Placeholder components for other tabs
const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

const YPivotQASectionsProduct = () => {
  const [activeSubTab, setActiveSubTab] = useState("category");

  const subTabs = useMemo(
    () => [
      {
        id: "category",
        label: "Category Management",
        icon: <Layers size={16} />,
        component: <YPivotQASectionsProductCategory />
      },
      {
        id: "defect",
        label: "Defect Management",
        icon: <FileText size={16} />,
        component: <YPivotQASectionsProductDefectManagement />
      },
      {
        id: "buyer",
        label: "Buyer Status",
        icon: <Users size={16} />,
        component: <PlaceholderComponent title="Buyer Status" icon={Users} />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return subTabs.find((tab) => tab.id === activeSubTab)?.component || null;
  }, [activeSubTab, subTabs]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <nav className="flex min-w-max" aria-label="Sub Tabs">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`group inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-3 ${
                  activeSubTab === tab.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {React.cloneElement(tab.icon, {
                  className: "w-4 h-4"
                })}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>{activeComponent}</div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default YPivotQASectionsProduct;
