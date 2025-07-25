import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { Calendar, Edit, BarChartHorizontal } from "lucide-react";
import TrainingPageTitle from "../components/inspection/training/TrainingPageTitle";
import TrainingScheduleView from "../components/inspection/training/TrainingScheduleView";
import TrainingSchedule from "../components/inspection/training/TrainingSchedule";
import TrainingProgress from "../components/inspection/training/TrainingProgress";

// In a real app, this would be in your .env file
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const YQMSTrainingSchedule = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("schedule");
  const { user } = useAuth();

  // State for the form data, lifted to this parent component
  // to persist data across tab switches.
  const [trainingFormData, setTrainingFormData] = useState({
    topic: "",
    trainers: "",
    support: "",
    trainee: "",
    method: "",
    evaluation: { exam: false, physical: false, viva: false },
    planDate: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: ""
  });

  const tabs = useMemo(
    () => [
      {
        id: "schedule",
        labelKey: "training.tabs.schedule",
        icon: <Calendar size={18} />,
        component: <TrainingScheduleView />
      },
      {
        id: "edit",
        labelKey: "training.tabs.edit",
        icon: <Edit size={18} />,
        component: (
          <TrainingSchedule
            formData={trainingFormData}
            setFormData={setTrainingFormData}
          />
        )
      },
      {
        id: "progress",
        labelKey: "training.tabs.progress",
        icon: <BarChartHorizontal size={18} />,
        component: <TrainingProgress />
      }
    ],
    [trainingFormData] // Dependency ensures form component re-renders with fresh props if needed
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <TrainingPageTitle user={user} />

        <div className="border-b border-gray-300 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap
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

export default YQMSTrainingSchedule;
