/**
 * UploadStage.jsx
 * Stage 1: File upload with language and domain selection
 */

import React, { useState, useRef } from "react";
import { Upload, FileText, FileImage, X, ArrowRight } from "lucide-react";

import { API_BASE_URL } from "../../../../../config";

const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "km", label: "Khmer" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "th", label: "Thai" },
    { value: "vi", label: "Vietnamese" }
];

const DOMAINS = [
    { value: "Garment Industry", label: "Garment Industry" },
    { value: "Legal", label: "Legal" },
    { value: "Medical", label: "Medical" },
    { value: "Engineering", label: "Engineering" },
    { value: "Finance", label: "Finance" },
    { value: "IT", label: "IT" },
    { value: "General", label: "General" }
];

const ACCEPTED_TYPES = {
    "application/pdf": { icon: FileText, label: "PDF" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: FileText, label: "DOCX" },
    "image/png": { icon: FileImage, label: "PNG" },
    "image/jpeg": { icon: FileImage, label: "JPEG" },
    "text/plain": { icon: FileText, label: "TXT" }
};

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UploadStage({
    sourceLang,
    targetLang,
    domain,
    onSourceLangChange,
    onTargetLangChange,
    onDomainChange,
    onUploadComplete
}) {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;

        const isAccepted = Object.keys(ACCEPTED_TYPES).includes(selectedFile.type) ||
            selectedFile.name.endsWith(".pdf") ||
            selectedFile.name.endsWith(".docx");

        if (!isAccepted) {
            setError("Please select a PDF, DOCX, or image file");
            return;
        }

        if (selectedFile.size > 50 * 1024 * 1024) {
            setError("File size must be under 50MB");
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Auto-trigger upload/ingest
        setTimeout(() => {
            const uploadBtn = document.getElementById('auto-upload-trigger');
            if (uploadBtn) uploadBtn.click();
        }, 100);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("sourceLang", sourceLang);
            formData.append("targetLang", targetLang);
            formData.append("domain", domain);

            const response = await fetch(`${API_BASE_URL}/api/documents/ingest`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || data.error || "Upload failed");
            }

            onUploadComplete(data);
        } catch (err) {
            setError(err.message);
            setUploading(false); // Only reset uploading on error
        }
    };

    const getFileIcon = () => {
        if (!file) return Upload;
        const config = ACCEPTED_TYPES[file.type];
        return config?.icon || FileText;
    };

    const FileIcon = getFileIcon();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-xl font-semibold translator-text-foreground mb-2">Upload Document for Glossary Mining</h3>
                <p className="translator-muted-foreground text-sm">
                    Upload a document to extract domain-specific terminology for your glossary.
                </p>
            </div>

            {/* File Drop Zone */}
            <div
                className={`translator-rounded border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-8 ${dragActive
                    ? "translator-primary border-solid"
                    : "translator-card translator-border hover:translator-primary-text hover:border-primary"
                    } ${file ? "cursor-default border-solid border-primary/50" : ""}`}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !file && !uploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    style={{ display: "none" }}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <div>
                            <p className="translator-text-foreground font-medium text-lg">Initializing Document...</p>
                            <p className="translator-muted-foreground text-sm mt-1">Generating visual preview</p>
                        </div>
                    </div>
                ) : file ? (
                    <div className="flex flex-col items-center gap-3">
                        <FileIcon className="w-12 h-12 translator-primary-text" />
                        <div className="flex flex-col">
                            <span className="font-medium translator-text-foreground text-lg">{file.name}</span>
                            <span className="text-sm translator-muted-foreground">{formatBytes(file.size)}</span>
                        </div>
                        <button
                            className="mt-2 text-sm font-medium translator-destructive hover:bg-red-500/10 px-3 py-1 rounded transition-colors"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        >
                            Remove File
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Upload className={`w-12 h-12 translator-primary-text opacity-70 transition-transform ${dragActive ? "scale-110" : ""}`} />
                        <div>
                            <p className="translator-text-foreground font-medium text-lg">Drag and drop a file here</p>
                            <p className="translator-muted-foreground text-sm mt-1">or click to browse</p>
                        </div>
                        <span className="text-xs translator-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            PDF, DOCX, PNG, JPEG, TXT (max 50MB)
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Language Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold translator-text-foreground">Languages</label>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                        <select
                            value={sourceLang}
                            onChange={(e) => onSourceLangChange(e.target.value)}
                            className="flex-1 bg-transparent border-none text-sm font-medium px-3 py-2 focus:ring-0 translator-text-foreground cursor-pointer"
                        >
                            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>

                        <ArrowRight className="w-4 h-4 translator-muted-foreground" />

                        <select
                            value={targetLang}
                            onChange={(e) => onTargetLangChange(e.target.value)}
                            className="flex-1 bg-transparent border-none text-sm font-medium px-3 py-2 focus:ring-0 translator-text-foreground cursor-pointer"
                        >
                            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Domain Selection */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold translator-text-foreground">Document Domain</label>
                    <select
                        value={domain}
                        onChange={(e) => onDomainChange(e.target.value)}
                        className="w-full translator-card translator-border translator-rounded px-4 py-2.5 text-sm translator-text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                        {DOMAINS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Hidden Trigger Button for Auto-upload */}
            <button id="auto-upload-trigger" onClick={handleUpload} style={{ display: 'none' }} />

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400">
                    <span className="text-lg">⚠️</span>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
