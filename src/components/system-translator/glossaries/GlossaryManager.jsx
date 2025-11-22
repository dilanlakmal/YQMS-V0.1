import React, { useState } from "react";
import GlossaryUpload from "./GlossaryUpload";
import GlossaryList from "./GlossaryList";

export default function GlossaryManager() {
  const [activeTab, setActiveTab] = useState("list");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Switch to list tab and refresh
    setActiveTab("list");
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteSuccess = () => {
    // Refresh list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b translator-border">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "list"
              ? "translator-primary-text border-b-2 border-primary"
              : "translator-muted-foreground hover:translator-text-foreground"
          }`}
        >
          My Glossaries
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "upload"
              ? "translator-primary-text border-b-2 border-primary"
              : "translator-muted-foreground hover:translator-text-foreground"
          }`}
        >
          Upload Glossary
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "list" && (
        <GlossaryList key={refreshKey} onDeleteSuccess={handleDeleteSuccess} />
      )}

      {activeTab === "upload" && (
        <GlossaryUpload onUploadSuccess={handleUploadSuccess} />
      )}
    </div>
  );
}

