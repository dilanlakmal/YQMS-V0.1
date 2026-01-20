import React, { useState, useEffect } from "react";
import { FileText, Files, User, RefreshCw, Trash2, Download, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../../../../config";

export default function GlossaryList({ onReviewBatch }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/glossary/history`);
      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history || []);
      } else {
        setError(data.error || "Failed to load extraction history");
      }
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (batchId) => {
    if (!confirm(`Are you sure you want to delete this extraction history? Terms extracted in this batch will be preserved but unlinked.`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/glossary/history/${batchId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        loadHistory();
      } else {
        alert(data.error || "Failed to delete history entry");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete history entry");
    }
  };

  const handleDownloadTSV = async (item) => {
    try {
      const params = new URLSearchParams({
        sourceLang: item.sourceLang,
        targetLang: item.targetLang,
        domain: item.domain || 'General'
      });

      const response = await fetch(`${API_BASE_URL}/api/glossary/generate-tsv?${params}`);
      const data = await response.json();

      if (data.success && data.sasUrl) {
        window.open(data.sasUrl, '_blank');
      } else {
        alert(data.message || "No verified terms found to generate TSV.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to generate TSV");
    }
  };

  const handleDownloadSource = async (batchId, type = 'source') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/glossary/history/${batchId}/source?type=${type}`);
      const data = await response.json();

      if (data.success && data.sasUrl) {
        window.open(data.sasUrl, '_blank');
      } else {
        alert(data.error || "Failed to get download link");
      }
    } catch (err) {
      console.error("Download source error:", err);
      alert("Failed to connect to server");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'parallel': return <Files size={18} className="text-purple-500" />;
      case 'manual': return <User size={18} className="text-gray-500" />;
      default: return <FileText size={18} className="text-blue-500" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'parallel': return 'PARALLEL DOCS';
      case 'manual': return 'MANUAL ENTRY';
      default: return 'SINGLE DOC';
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p>Loading extraction history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Extraction History</h2>
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Resource</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lang / Domain</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Extracted Stats</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  No extraction history found. Start mining documents to see results here!
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.batchId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getTypeIcon(item.miningType)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">{item.sourceResource}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{getTypeText(item.miningType)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-1">
                        {item.sourceLang} → {item.targetLang}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.domain || 'General'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col w-40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.termCount} <span className="font-normal text-xs">terms</span></span>
                        <span className={`text-[10px] font-bold ${item.percentVerified === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {item.percentVerified}% Verified
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${item.percentVerified === 100 ? 'bg-green-500' : 'bg-green-400 opacity-80'}`}
                          style={{ width: `${item.percentVerified}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 mb-1">
                        <button
                          onClick={() => onReviewBatch(item.batchId)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Review Terms
                        </button>
                        <button
                          onClick={() => handleDownloadTSV(item)}
                          className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          Download TSV
                        </button>
                        <button
                          onClick={() => handleDelete(item.batchId)}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                        {(item.sourceUrl || item.targetUrl) && (
                          <div className="flex gap-2 mt-1">
                            {item.sourceUrl && (
                              <button
                                onClick={() => handleDownloadSource(item.batchId, 'source')}
                                className="text-[10px] font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                <Download size={10} /> Source Doc
                              </button>
                            )}
                            {item.targetUrl && (
                              <button
                                onClick={() => handleDownloadSource(item.batchId, 'target')}
                                className="text-[10px] font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                <Download size={10} /> Target Doc
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        Last update: {new Date(item.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {history.length > 0 && (
        <p className="text-right text-xs text-gray-400 px-2 italic">
          Showing {history.length} extraction sources
        </p>
      )}
    </div>
  );
}
