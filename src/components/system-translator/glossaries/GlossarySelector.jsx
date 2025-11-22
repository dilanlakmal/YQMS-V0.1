import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config";


export default function GlossarySelector({
  sourceLanguage,
  targetLanguage,
  value,
  onChange,
  label = "Glossary:"
}) {
  const [glossaries, setGlossaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sourceLanguage && targetLanguage && sourceLanguage !== "auto") {
      loadGlossaries();
    } else {
      setGlossaries([]);
    }
  }, [sourceLanguage, targetLanguage]);

  const loadGlossaries = async () => {
    if (!sourceLanguage || sourceLanguage === "auto" || !targetLanguage) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/glossaries/${sourceLanguage}/${targetLanguage}`
      );
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

  const handleChange = (e) => {
    const selectedBlobName = e.target.value;
    onChange(selectedBlobName || null);
  };

  if (sourceLanguage === "auto" || !sourceLanguage || !targetLanguage) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium translator-muted-foreground">{label}</span>
        <select
          disabled
          className="translator-rounded translator-border translator-input px-3 py-1 text-xs font-medium opacity-50 cursor-not-allowed"
        >
          <option>Select languages first</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium translator-muted-foreground">{label}</span>
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={loading}
        className="translator-rounded translator-border translator-input px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">No glossary</option>
        {loading ? (
          <option disabled>Loading glossaries...</option>
        ) : glossaries.length === 0 ? (
          <option disabled>No glossaries available</option>
        ) : (
          glossaries.map((glossary) => (
            <option key={glossary.blobName} value={glossary.blobName}>
              {glossary.fileName} ({glossary.format.toUpperCase()})
            </option>
          ))
        )}
      </select>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

