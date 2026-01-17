import { useState } from 'react';
import { MessageSquare, Plus, History, Users, Star, BarChart3 } from 'lucide-react';
import FeedbackForm from '../components/Feedback/feedbackForm';
import SubmittedFeedbacks from '../components/Feedback/SubmittedFeedbacks';
import RatingSystem from '@/components/Feedback/RatingSystem';

const Feedback = () => {
  const [activeTab, setActiveTab] = useState('new');

  const tabs = [
    {
      id: 'new',
      label: 'New Feedback',
      icon: <Plus size={20} />,
      component: <FeedbackForm />,
      description: 'Submit new feedback or suggestions',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'old',
      label: 'All Feedback',
      icon: <History size={20} />,
      component: <SubmittedFeedbacks />,
      description: 'View and continue conversations',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'ratings',
      label: 'Rate Services',
      icon: <Star size={20} />,
      component: <RatingSystem />,
      description: 'Rate overall experience and individual modules'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Feedback Center
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activeTabData?.description}
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Community Feedback
                </span>
              </div>
              {activeTab === 'ratings' && (
                <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Rating System
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                  >
                    <div className={`transition-colors duration-200 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.icon}
                    </div>
                     <div className="text-3xl">{tab.emoji}</div>
                    {tab.label}
                    {isActive && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          {activeTabData?.component}
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Feedback;
