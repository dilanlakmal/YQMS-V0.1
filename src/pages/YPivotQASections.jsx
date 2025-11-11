import { Camera, FileText, Package, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQASectionsHeader from "../components/inspection/PivotY/QASections/YPivotQASectionsHeader";
import YPivotQASectionsPacking from "../components/inspection/PivotY/QASections/YPivotQASectionsPacking";
import YPivotQASectionsPhotos from "../components/inspection/PivotY/QASections/YPivotQASectionsPhotos";
import YPivotQASectionsProduct from "../components/inspection/PivotY/QASections/YPivotQASectionsProduct";

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

const YPivotQASections = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("header");

  const tabs = useMemo(
    () => [
      {
        id: "header",
        label: "Header",
        icon: <FileText size={18} />,
        component: <YPivotQASectionsHeader />
      },
      {
        id: "photos",
        label: "Photos",
        icon: <Camera size={18} />,
        component: <YPivotQASectionsPhotos />
      },
      {
        id: "packing",
        label: "Packing",
        icon: <Package size={18} />,
        component: <YPivotQASectionsPacking />
      },
      {
        id: "production",
        label: "Production",
        icon: <TrendingUp size={18} />,
        component: <YPivotQASectionsProduct />
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Y Pivot - QA Sections
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Quality Assurance QA Inspection System{" "}
                {user && ` | ${user.job_title || "Operator"} | ${user.emp_id}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4 pt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex min-w-max" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold whitespace-nowrap transition-all duration-200 border-b-4 ${
                    activeTab === tab.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {React.cloneElement(tab.icon, {
                    className: "w-4 h-4 sm:w-5 sm:h-5"
                  })}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4 pb-4">
        <div className="mt-6">{activeComponent}</div>
      </div>

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

export default YPivotQASections;
