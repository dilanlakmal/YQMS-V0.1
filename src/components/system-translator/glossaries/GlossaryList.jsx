import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config";
import GlossaryEditor from "./GlossaryEditor";

export default function GlossaryList({ onDeleteSuccess }) {
  const [glossaries, setGlossaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterLangPair, setFilterLangPair] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGlossary, setSelectedGlossary] = useState(null);

  useEffect(() => {
    loadGlossaries();
  }, []);

  const loadGlossaries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/glossaries/list`);
      const data = await response.json();

      if (response.ok && data.success) {
        setGlossaries(data.glossaries || []);
      } else {
        setError(data.error || "Failed to load glossaries");
        setGlossaries([]);
      }
    } catch (err) {
      console.error("Error loading glossaries:", err);
      setError("Failed to load glossaries");
      setGlossaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blobName) => {
    if (!confirm(`Are you sure you want to delete this glossary?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/glossaries/delete?blobName=${encodeURIComponent(blobName)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        loadGlossaries();
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        alert(data.error || "Failed to delete glossary");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete glossary");
    }
  };

  const handleDownload = async (blobName, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/glossaries/${encodeURIComponent(blobName)}/download`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Download failed" }));
        alert(errorData.error || "Failed to download glossary");
        return;
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || blobName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download glossary. Please try again.");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Get unique language pairs for filter
  const languagePairs = [
    "all",
    ...new Set(glossaries.map((g) => g.languagePair)),
  ];

  // Filter glossaries
  const filteredGlossaries = glossaries.filter((glossary) => {
    const matchesLangPair =
      filterLangPair === "all" || glossary.languagePair === filterLangPair;
    const matchesSearch =
      !searchTerm ||
      glossary.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      glossary.languagePair.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLangPair && matchesSearch;
  });

  const handleViewEdit = (blobName) => {
    setSelectedGlossary(blobName);
  };

  const handleBack = () => {
    setSelectedGlossary(null);
    loadGlossaries(); // Refresh list when returning
  };

  const handleUpdateSuccess = () => {
    loadGlossaries(); // Refresh list after update
  };

  if (selectedGlossary) {
    return (
      <GlossaryEditor
        blobName={selectedGlossary}
        onBack={handleBack}
        onUpdateSuccess={handleUpdateSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 translator-muted-foreground">
        Loading glossaries...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold translator-text-foreground">
            Filter by Language Pair
          </label>
          <select
            value={filterLangPair}
            onChange={(e) => setFilterLangPair(e.target.value)}
            className="w-full translator-rounded translator-border translator-input px-3 py-2 text-sm"
          >
            {languagePairs.map((pair) => (
              <option key={pair} value={pair}>
                {pair === "all" ? "All Language Pairs" : pair.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold translator-text-foreground">
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or language pair..."
            className="w-full translator-rounded translator-border translator-input px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={loadGlossaries}
          disabled={loading}
          className="text-sm translator-primary-text hover:opacity-80 flex items-center gap-2"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Glossary List */}
      {filteredGlossaries.length === 0 ? (
        <div className="text-center py-8 translator-muted-foreground">
          {glossaries.length === 0
            ? "No glossaries found. Upload your first glossary to get started."
            : "No glossaries match your filters."}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredGlossaries.map((glossary) => (
            <div
              key={glossary.blobName}
              className="flex items-center justify-between translator-rounded translator-card translator-border p-3 hover:translator-muted"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 translator-rounded font-bold text-xs bg-blue-100 text-blue-700">
                    {glossary.format.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm translator-text-foreground truncate font-medium">
                      {glossary.fileName}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs translator-muted-foreground">
                        {glossary.sourceLanguage.toUpperCase()} →{" "}
                        {glossary.targetLanguage.toUpperCase()}
                      </span>
                      <span className="text-xs translator-muted-foreground">
                        {formatFileSize(glossary.size)}
                      </span>
                      <span className="text-xs translator-muted-foreground">
                        {formatDate(glossary.lastModified)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEdit(glossary.blobName);
                  }}
                  className="text-xs font-medium translator-primary-text translator-rounded px-3 py-1.5 hover:opacity-80"
                >
                  View/Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(glossary.blobName, glossary.fileName);
                  }}
                  className="text-xs font-medium translator-primary-text translator-rounded px-3 py-1.5 hover:opacity-80"
                >
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(glossary.blobName);
                  }}
                  className="text-xs font-medium translator-destructive translator-rounded px-3 py-1.5 hover:translator-destructive-bg-light"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {glossaries.length > 0 && (
        <div className="text-sm translator-muted-foreground text-center">
          Showing {filteredGlossaries.length} of {glossaries.length} glossaries
        </div>
      )}
    </div>
  );
}

