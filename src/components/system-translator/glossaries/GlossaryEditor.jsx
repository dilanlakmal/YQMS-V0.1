import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../../../config";

/**
 * Check if a string contains non-ASCII characters (like Khmer, Chinese, etc.)
 */
const containsNonASCII = (str) => {
  return /[^\x00-\x7F]/.test(str);
};

/**
 * Parse pasted content with smart format detection
 * Supports TSV, CSV, and space-separated formats
 * Improved to handle multi-word translations correctly
 */
const parsePastedContent = (text) => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  const entries = [];
  
  for (const line of lines) {
    let source, target;
    
    // Try tab-separated (TSV) - most reliable
    if (line.includes('\t')) {
      const parts = line.split('\t').map(s => s.trim());
      if (parts.length >= 2) {
        source = parts[0];
        target = parts.slice(1).join('\t'); // In case target contains tabs
      }
    }
    // Try comma-separated (CSV)
    else if (line.includes(',') && !line.match(/,\s*,/)) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        source = parts[0];
        target = parts.slice(1).join(','); // In case target contains commas
      }
    }
    // Try space-separated - detect language boundary
    // Find the transition from ASCII (English) to non-ASCII (Khmer/other languages)
    else if (line.includes(' ')) {
      const trimmedLine = line.trim();
      
      // Find the first non-ASCII character position
      let firstNonASCIIIndex = -1;
      for (let i = 0; i < trimmedLine.length; i++) {
        if (containsNonASCII(trimmedLine[i])) {
          firstNonASCIIIndex = i;
          break;
        }
      }
      
      if (firstNonASCIIIndex > 0) {
        // Found non-ASCII characters - split at the space before the first non-ASCII
        // Find the last space before the first non-ASCII character
        const beforeNonASCII = trimmedLine.substring(0, firstNonASCIIIndex);
        const lastSpaceIndex = beforeNonASCII.lastIndexOf(' ');
        
        if (lastSpaceIndex >= 0) {
          // Split at the last space before non-ASCII
          source = trimmedLine.substring(0, lastSpaceIndex).trim();
          target = trimmedLine.substring(lastSpaceIndex + 1).trim();
        } else {
          // No space before non-ASCII, but we have non-ASCII - might be single word source
          // Check if the part before non-ASCII is all ASCII
          if (!containsNonASCII(beforeNonASCII)) {
            source = beforeNonASCII.trim();
            target = trimmedLine.substring(firstNonASCIIIndex).trim();
          }
        }
      } else {
        // No non-ASCII characters found - try to split at first space
        // But only if first part is a single word (to avoid ambiguity)
        const firstSpace = trimmedLine.indexOf(' ');
        const potentialSource = trimmedLine.substring(0, firstSpace).trim();
        const potentialTarget = trimmedLine.substring(firstSpace + 1).trim();
        
        // Only use if source is a single word (no spaces) and doesn't contain non-ASCII
        if (potentialSource && 
            !potentialSource.includes(' ') && 
            !containsNonASCII(potentialSource) &&
            potentialTarget) {
          source = potentialSource;
          target = potentialTarget;
        }
      }
    }
    
    if (source && target) {
      entries.push({ source, target });
    }
  }
  
  return entries;
};

export default function GlossaryEditor({ blobName, onBack, onUpdateSuccess }) {
  const [entries, setEntries] = useState([]);
  const [originalEntries, setOriginalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [glossaryInfo, setGlossaryInfo] = useState(null);
  const [savingRows, setSavingRows] = useState(new Set());
  const [deletingRows, setDeletingRows] = useState(new Set());
  const [pasteText, setPasteText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const pasteAreaRef = useRef(null);

  useEffect(() => {
    loadEntries();
  }, [blobName]);

  const loadEntries = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch with displayOnly=true to get only representative entries
      const response = await fetch(`${API_BASE_URL}/api/glossaries/${encodeURIComponent(blobName)}/entries?displayOnly=true`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Add unique IDs to entries for tracking
        const entriesWithIds = data.entries.map((entry, index) => ({
          ...entry,
          id: `entry-${index}-${Date.now()}`,
          isDirty: false
        }));
        setEntries(entriesWithIds);
        setOriginalEntries(JSON.parse(JSON.stringify(entriesWithIds)));
        setGlossaryInfo({
          blobName: data.blobName,
          sourceLanguage: data.sourceLanguage,
          targetLanguage: data.targetLanguage,
          totalEntries: data.totalEntries || 0, // Total including all variations
          displayEntries: data.displayEntries || data.entries.length // Number of unique concepts
        });
      } else {
        setError(data.error || "Failed to load glossary entries");
      }
    } catch (err) {
      console.error("Error loading glossary entries:", err);
      setError("Failed to load glossary entries");
    } finally {
      setLoading(false);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value,
      isDirty: true
    };
    setEntries(newEntries);
  };

  const handleSaveRow = async (index) => {
    const entry = entries[index];
    
    if (!entry.source.trim() || !entry.target.trim()) {
      alert("Source and target are required");
      return;
    }

    setSavingRows(prev => new Set(prev).add(index));

    try {
      // Create updated entries array
      const updatedEntries = entries.map(e => ({
        source: e.source.trim(),
        target: e.target.trim()
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/glossaries/${encodeURIComponent(blobName)}/entries`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entries: updatedEntries
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload entries to get updated counts and any changes
        await loadEntries();
        
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        alert(data.error || "Failed to save entry");
      }
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSavingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleDeleteRow = async (index) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    setDeletingRows(prev => new Set(prev).add(index));

    try {
      // Remove entry from local state (optimistic update)
      const entryToDelete = entries[index];
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);

      // Update backend
      const updatedEntries = newEntries.map(e => ({
        source: e.source.trim(),
        target: e.target.trim()
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/glossaries/${encodeURIComponent(blobName)}/entries`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entries: updatedEntries
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload entries to get updated counts
        await loadEntries();
        
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        // Restore entry on error
        setEntries(entries);
        alert(data.error || "Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      // Restore entry on error
      setEntries(entries);
      alert("Failed to delete entry. Please try again.");
    } finally {
      setDeletingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleAddRow = () => {
    const newEntry = {
      source: "",
      target: "",
      id: `entry-new-${Date.now()}`,
      isDirty: false
    };
    setEntries([...entries, newEntry]);
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) {
      alert("Please paste some content first");
      return;
    }

    const parsedEntries = parsePastedContent(pasteText);
    
    if (parsedEntries.length === 0) {
      alert("Could not parse pasted content. Please use TSV (tab-separated), CSV (comma-separated), or space-separated format.");
      return;
    }

    // Mark entries as dirty so they will be saved
    const newEntries = parsedEntries.map((entry, index) => ({
      ...entry,
      id: `entry-pasted-${Date.now()}-${index}`,
      isDirty: true // Mark as dirty so user knows to save
    }));

    setEntries([...entries, ...newEntries]);
    setPasteText("");
    setShowPasteArea(false);
    
    // Show message that entries need to be saved
    alert(`${parsedEntries.length} entry/entries added. Please save each row to store them with automatic case variations.`);
  };

  const handleCopyRow = (index) => {
    const entry = entries[index];
    const text = `${entry.source}\t${entry.target}`;
    
    navigator.clipboard.writeText(text).then(() => {
      // Show brief feedback
      const button = document.getElementById(`copy-btn-${index}`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    }).catch(err => {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8 translator-muted-foreground">
        Loading glossary entries...
      </div>
    );
  }

  if (error && !glossaryInfo) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm translator-primary-text hover:opacity-80 flex items-center gap-2"
        >
          ← Back to Glossary List
        </button>
        <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-sm translator-primary-text hover:opacity-80 flex items-center gap-2 mb-2"
          >
            ← Back to Glossary List
          </button>
          {glossaryInfo && (
            <div>
              <h2 className="text-lg font-semibold translator-text-foreground">
                {glossaryInfo.blobName}
              </h2>
              <p className="text-sm translator-muted-foreground">
                {glossaryInfo.sourceLanguage.toUpperCase()} → {glossaryInfo.targetLanguage.toUpperCase()} • 
                {glossaryInfo.displayEntries !== undefined ? (
                  <> {glossaryInfo.displayEntries} unique entries ({glossaryInfo.totalEntries} total with variations)</>
                ) : (
                  <> {glossaryInfo.totalEntries} entries</>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasteArea(!showPasteArea)}
            className="translator-rounded translator-border translator-card px-4 py-2 text-sm font-medium hover:translator-primary-text"
          >
            {showPasteArea ? "Cancel Paste" : "Paste Entries"}
          </button>
          <button
            onClick={handleAddRow}
            className="translator-rounded translator-primary px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* Paste Area */}
      {showPasteArea && (
        <div className="translator-rounded translator-border translator-card p-4 space-y-3">
          <label className="text-sm font-semibold translator-text-foreground">
            Paste entries (TSV, CSV, or space-separated format)
          </label>
          <textarea
            ref={pasteAreaRef}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="apple&#9;ផ្លែប៉ោម&#10;banana&#9;ចេក"
            className="w-full translator-rounded translator-border translator-card px-3 py-2 text-sm translator-text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePaste}
              disabled={!pasteText.trim()}
              className="translator-rounded translator-primary px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Pasted Entries
            </button>
            <button
              onClick={() => {
                setPasteText("");
                setShowPasteArea(false);
              }}
              className="translator-rounded translator-border translator-card px-4 py-2 text-sm font-medium hover:translator-primary-text"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs translator-muted-foreground">
            Supported formats: Tab-separated (TSV), Comma-separated (CSV), or Space-separated. One entry per line.
          </p>
        </div>
      )}

      {error && (
        <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="translator-rounded translator-border translator-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="translator-border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-sm font-semibold translator-text-foreground">
                  Source
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold translator-text-foreground">
                  Target
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold translator-text-foreground w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 translator-muted-foreground text-sm">
                    No entries. Click "Add Row" to add entries.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`translator-border-b hover:bg-muted/20 ${
                      entry.isDirty ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={entry.source}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleEntryChange(index, "source", e.target.value)}
                        className="w-full translator-rounded translator-border translator-card px-3 py-1.5 text-sm translator-text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={savingRows.has(index) || deletingRows.has(index)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={entry.target}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleEntryChange(index, "target", e.target.value)}
                        className="w-full translator-rounded translator-border translator-card px-3 py-1.5 text-sm translator-text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={savingRows.has(index) || deletingRows.has(index)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`copy-btn-${index}`}
                          onClick={() => handleCopyRow(index)}
                          className="text-xs font-medium translator-primary-text hover:opacity-80 px-2 py-1"
                          disabled={savingRows.has(index) || deletingRows.has(index)}
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleSaveRow(index)}
                          disabled={!entry.source.trim() || !entry.target.trim() || savingRows.has(index) || deletingRows.has(index) || !entry.isDirty}
                          className="text-xs font-medium translator-primary-text hover:opacity-80 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingRows.has(index) ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => handleDeleteRow(index)}
                          disabled={savingRows.has(index) || deletingRows.has(index)}
                          className="text-xs font-medium translator-destructive hover:opacity-80 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingRows.has(index) ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="text-sm translator-muted-foreground text-center">
          Showing {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </div>
      )}
    </div>
  );
}

