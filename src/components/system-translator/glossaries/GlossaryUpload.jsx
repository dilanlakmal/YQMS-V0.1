import React, { useState, useRef } from "react";
import LanguageSelector from "../LanguageSelector";
import { API_BASE_URL } from "../../../../config";

export default function GlossaryUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("fr");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const VALID_EXTENSIONS = [".tsv", ".csv", ".xlsx", ".xls"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    setError("");
    setSuccess("");

    // Validate file extension
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) {
      setError(`Invalid file type. Supported: ${VALID_EXTENSIONS.join(", ")}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (10MB)`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a glossary file");
      return;
    }

    if (!sourceLanguage || !targetLanguage) {
      setError("Please select source and target languages");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("glossaryFile", selectedFile);
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);

      const response = await fetch(`${API_BASE_URL}/api/glossaries/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Glossary uploaded successfully! (${data.glossary.entryCount} entries)`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setError(data.error || data.details || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload glossary. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold translator-text-foreground">Source Language</label>
          <LanguageSelector
            value={sourceLanguage}
            onChange={setSourceLanguage}
            includeAuto={false}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold translator-text-foreground">Target Language</label>
          <LanguageSelector
            value={targetLanguage}
            onChange={setTargetLanguage}
            includeAuto={false}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold translator-text-foreground">Glossary File</label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`translator-rounded border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? "translator-primary translator-text-foreground shadow-md border-solid"
              : "translator-card translator-border hover:translator-primary-text hover:border-primary"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <svg
            className={`mx-auto mb-4 h-12 w-12 translator-primary-text opacity-80 ${dragActive ? "scale-110" : ""} transition-transform`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 translator-text-foreground font-medium">
            {selectedFile ? selectedFile.name : "Drag and drop glossary file here"}
          </p>
          <p className="mb-4 text-sm translator-muted-foreground">
            or click to browse files
          </p>
          <p className="text-xs translator-muted-foreground">
            Supported: TSV, CSV, XLSX • Max 10MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".tsv,.csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        {selectedFile && (
          <div className="flex items-center justify-between translator-rounded translator-card translator-border p-3">
            <div className="flex items-center gap-3">
              <span className="text-sm translator-text-foreground font-medium">
                {selectedFile.name}
              </span>
              <span className="text-xs translator-muted-foreground">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="text-xs font-medium translator-destructive translator-rounded px-3 py-1.5 hover:translator-destructive-bg-light disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
          <p className="font-medium">Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="translator-rounded translator-border p-3 text-sm" style={{ backgroundColor: "oklch(0.9 0.05 150 / 0.15)" }}>
          <p className="font-medium">{success}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full translator-rounded translator-primary px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      >
        {isUploading ? "Uploading..." : "Upload Glossary"}
      </button>
    </div>
  );
}

