import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import { FilePlus2, ListVideo } from "lucide-react";
import CreateExam from "../components/inspection/exam/CreateExam";
import TrainingPageTitle from "../components/inspection/training/TrainingPageTitle"; // Reusing the title component

// Placeholder for the "View Exam" tab
const ViewExam = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {t("exam.viewExam.title", "View Exams")}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {t(
          "exam.viewExam.underDevelopment",
          "This section is under development."
        )}
      </p>
    </div>
  );
};

const YQMSExam = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("create");
  const { user } = useAuth();

  // State for the entire exam being created
  const [examTopic, setExamTopic] = useState("");
  const [examQuestions, setExamQuestions] = useState([]);

  const tabs = useMemo(
    () => [
      {
        id: "create",
        labelKey: "exam.tabs.create",
        icon: <FilePlus2 size={18} />,
        component: (
          <CreateExam
            topic={examTopic}
            setTopic={setExamTopic}
            questions={examQuestions}
            setQuestions={setExamQuestions}
          />
        )
      },
      {
        id: "view",
        labelKey: "exam.tabs.view",
        icon: <ListVideo size={18} />,
        component: <ViewExam />
      }
    ],
    [examTopic, examQuestions] // Re-memoize if state changes to pass fresh props
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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

export default YQMSExam;
