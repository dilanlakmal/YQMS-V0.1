import React, { useState } from "react";
import UploadMasterList from "../components/inspection/ce/UploadMasterList";
import PreviewMasterList from "../components/inspection/ce/PreviewMasterList";

function CEMasterList() {
  const [activeTab, setActiveTab] = useState("uploadGST");
  const [masterListData, setMasterListData] = useState([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleDataParsed = (data) => {
    setMasterListData(data);
  };

  const handleClearData = () => {
    setMasterListData([]);
    setIsPreviewing(false);
  };

  const handlePreview = () => {
    if (masterListData.length > 0) {
      setIsPreviewing(true);
    } else {
      alert("No data to preview. Please upload a file first.");
    }
  };

  const handleCancelPreview = () => {
    setIsPreviewing(false);
  };

  // Basic styles for tabs
  const tabStyle =
    "px-4 py-2 font-semibold border-b-2 transition-colors duration-300";
  const activeTabStyle = "border-blue-500 text-blue-600 dark:text-blue-400";
  const inactiveTabStyle =
    "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">
          CE Master List Management
        </h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("uploadGST")}
              className={`${tabStyle} ${
                activeTab === "uploadGST" ? activeTabStyle : inactiveTabStyle
              }`}
            >
              Upload GST
            </button>
            <button
              onClick={() => setActiveTab("viewEdit")}
              className={`${tabStyle} ${
                activeTab === "viewEdit" ? activeTabStyle : inactiveTabStyle
              }`}
            >
              View / Edit Master List
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "uploadGST" &&
            (isPreviewing ? (
              <PreviewMasterList
                initialData={masterListData}
                onCancel={handleCancelPreview}
              />
            ) : (
              <UploadMasterList
                onDataParsed={handleDataParsed}
                onPreview={handlePreview}
                onClear={handleClearData}
              />
            ))}
          {activeTab === "viewEdit" && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <h3 className="text-lg font-semibold">View / Edit Master List</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                This feature is under construction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CEMasterList;
