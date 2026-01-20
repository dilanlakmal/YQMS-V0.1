import { useState } from "react";
// import GlossaryUpload from "./GlossaryUpload";
import GlossaryList from "./GlossaryList";
import MiningUpload from "./MiningUpload";
import MiningResultsPage from "./MiningResultsPage";

export default function GlossaryManager() {
  const [activeTab, setActiveTab] = useState("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // const handleUploadSuccess = () => {
  //   // Switch to list tab and refresh
  //   setActiveTab("list");
  //   setRefreshKey((prev) => prev + 1);
  // };

  const handleMiningComplete = (result) => {
    // Switch to mining results tab to review extracted terms
    setSelectedBatchId(result.miningBatchId || null);
    setActiveTab("results");
    setRefreshKey((prev) => prev + 1);
  };

  const handleReviewBatch = (batchId) => {
    setSelectedBatchId(batchId);
    setActiveTab("results");
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteSuccess = () => {
    // Refresh list
    setRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    { id: "list", label: "📚 My Glossaries" },
    // { id: "upload", label: "📤 Upload Glossary" },
    { id: "mine", label: "🤖 Mine Documents" },
    { id: "results", label: "✅ Review Terms" }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b translator-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "results") setSelectedBatchId(null); // Clear batch filter when switching away from results
            }}
            className={`px-4 py-2.5 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
              ? "translator-primary-text border-b-2 border-primary"
              : "translator-muted-foreground hover:translator-text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "list" && (
        <GlossaryList key={refreshKey} onDeleteSuccess={handleDeleteSuccess} onReviewBatch={handleReviewBatch} />
      )}

      {/* {activeTab === "upload" && (
        <GlossaryUpload onUploadSuccess={handleUploadSuccess} />
      )} */}

      {activeTab === "mine" && (
        <MiningUpload onMiningComplete={handleMiningComplete} />
      )}

      {activeTab === "results" && (
        <MiningResultsPage key={`${refreshKey}-${selectedBatchId}`} initialBatchId={selectedBatchId} />
      )}
    </div>
  );
}
