/**
 * MiningUpload.jsx
 * Upload component for mining glossary terms from documents
 * Supports both single document and parallel document modes
 */

import React, { useState, useRef } from "react";
import { ArrowRightLeft, FileText, Upload, Sparkles } from "lucide-react";
import LanguageSelector from "../LanguageSelector";
import { API_BASE_URL } from "../../../../config";

const VALID_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DOMAINS = [
    { value: "", label: "Auto Detect" },
    { value: "Garment Industry", label: "Garment Industry" },
    { value: "Legal", label: "Legal" },
    { value: "Medical", label: "Medical" },
    { value: "Engineering", label: "Engineering" },
    { value: "Building", label: "Building" },
    { value: "Finance", label: "Finance" },
    { value: "IT", label: "IT" },
    { value: "General", label: "General" }
];

// File drop zone component
const FileDropZone = ({
    file,
    onFileSelect,
    onClear,
    label,
    disabled,
    dragActive,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    inputRef
}) => {
    return (
        <div className="flex-1">
            <label className="text-sm font-semibold translator-text-foreground mb-2 block">{label}</label>
            <div
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`translator-rounded border-2 border-dashed p-6 text-center transition-all cursor-pointer ${dragActive
                    ? "translator-primary translator-text-foreground shadow-md border-solid"
                    : "translator-card translator-border hover:translator-primary-text hover:border-primary"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 translator-primary-text" />
                        <p className="text-sm translator-text-foreground font-medium truncate max-w-full">
                            {file.name}
                        </p>
                        <p className="text-xs translator-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            disabled={disabled}
                            className="text-xs font-medium translator-destructive translator-rounded px-3 py-1 hover:translator-destructive-bg-light"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className={`mx-auto mb-3 h-10 w-10 translator-primary-text opacity-70 ${dragActive ? "scale-110" : ""} transition-transform`} />
                        <p className="mb-1 translator-text-foreground text-sm font-medium">
                            Drop file here
                        </p>
                        <p className="text-xs translator-muted-foreground">
                            or click to browse
                        </p>
                        <p className="text-xs translator-muted-foreground mt-2">
                            PDF, DOCX, TXT, XLSX
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default function MiningUpload({ onMiningComplete }) {
    // Mode: 'single' or 'parallel'
    const [mode, setMode] = useState("single");

    // Languages
    const [sourceLanguage, setSourceLanguage] = useState("en");
    const [targetLanguage, setTargetLanguage] = useState("km");

    // Domain
    const [domain, setDomain] = useState("Garment Industry");

    // Files - separate state for each mode to prevent confusion
    const [singleFile, setSingleFile] = useState(null);
    const [parallelSourceFile, setParallelSourceFile] = useState(null);
    const [parallelTargetFile, setParallelTargetFile] = useState(null);

    // UI State
    const [isMining, setIsMining] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [dragActiveSource, setDragActiveSource] = useState(false);
    const [dragActiveTarget, setDragActiveTarget] = useState(false);

    const singleInputRef = useRef(null);
    const parallelSourceInputRef = useRef(null);
    const parallelTargetInputRef = useRef(null);

    // Validate file
    const validateFile = (file) => {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!VALID_EXTENSIONS.includes(ext)) {
            return `Invalid file type. Supported: ${VALID_EXTENSIONS.join(", ")}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Max: 50MB`;
        }
        return null;
    };

    // Handle file selection
    const handleFileSelect = (file, type) => {
        setError("");
        setResult(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (mode === "single") {
            setSingleFile(file);
        } else {
            if (type === "source") {
                setParallelSourceFile(file);
            } else {
                setParallelTargetFile(file);
            }
        }
    };

    // Handle drag events
    const createDragHandlers = (type) => ({
        onDragEnter: (e) => { e.preventDefault(); e.stopPropagation(); type === "source" ? setDragActiveSource(true) : setDragActiveTarget(true); },
        onDragLeave: (e) => { e.preventDefault(); e.stopPropagation(); type === "source" ? setDragActiveSource(false) : setDragActiveTarget(false); },
        onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); },
        onDrop: (e) => {
            e.preventDefault();
            e.stopPropagation();
            type === "source" ? setDragActiveSource(false) : setDragActiveTarget(false);
            if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0], type);
            }
        }
    });

    // Mining Progress State
    const [miningProgress, setMiningProgress] = useState({ percent: 0, stage: "" });

    // Start mining with streaming progress
    const handleMine = async () => {
        setError("");
        setResult(null);
        setMiningProgress({ percent: 0, stage: "Starting..." });

        // Get current file based on mode
        const currentFile = mode === "single" ? singleFile : parallelSourceFile;
        const currentTargetFile = parallelTargetFile;

        // Validate
        if (!currentFile) {
            setError("Please select a document to mine");
            return;
        }
        if (mode === "parallel" && !currentTargetFile) {
            setError("Please select a target document for parallel mining");
            return;
        }

        setIsMining(true);

        try {
            const formData = new FormData();
            formData.append("sourceLang", sourceLanguage);
            formData.append("targetLang", targetLanguage);
            if (domain) formData.append("domain", domain);

            let endpoint;
            if (mode === "single") {
                endpoint = `${API_BASE_URL}/api/glossary/mine/single`;
                formData.append("document", currentFile);
            } else {
                endpoint = `${API_BASE_URL}/api/glossary/mine/parallel`;
                formData.append("sourceDoc", currentFile);
                formData.append("targetDoc", currentTargetFile);
            }

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Mining failed with status ${response.status}`);
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode and split by newlines
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === "progress") {
                            setMiningProgress({
                                percent: data.percent,
                                stage: data.stage
                            });
                        } else if (data.type === "result") {
                            setResult(data);
                            if (onMiningComplete) {
                                onMiningComplete(data);
                            }
                        } else if (data.type === "error") {
                            setError(data.error || "Mining failed.");
                        }
                    } catch (e) {
                        console.warn("Failed to parse progress line:", line, e);
                    }
                }
            }
        } catch (err) {
            console.error("Mining error:", err);
            setError(`Failed to mine terms: ${err.message}`);
        } finally {
            setIsMining(false);
            setMiningProgress({ percent: 0, stage: "" });
        }
    };

    // Clear all files for current mode
    const handleClearAll = () => {
        if (mode === "single") {
            setSingleFile(null);
            if (singleInputRef.current) singleInputRef.current.value = "";
        } else {
            setParallelSourceFile(null);
            setParallelTargetFile(null);
            if (parallelSourceInputRef.current) parallelSourceInputRef.current.value = "";
            if (parallelTargetInputRef.current) parallelTargetInputRef.current.value = "";
        }
        setError("");
        setResult(null);
    };

    // Switch mode handler
    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setError("");
        setResult(null);
        // Don't clear files - they're separate state now
    };

    // Get current file for display
    const currentSourceFile = mode === "single" ? singleFile : parallelSourceFile;
    const currentTargetFile = parallelTargetFile;
    const hasFile = mode === "single" ? !!singleFile : (!!parallelSourceFile || !!parallelTargetFile);

    return (
        <div className="space-y-5">
            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 translator-card translator-rounded translator-border">
                <button
                    onClick={() => handleModeSwitch("single")}
                    className={`flex-1 py-2.5 px-4 translator-rounded font-medium text-sm transition-all ${mode === "single"
                        ? "translator-primary translator-text-foreground"
                        : "translator-text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                >
                    📄 Single Document
                </button>
                <button
                    onClick={() => handleModeSwitch("parallel")}
                    className={`flex-1 py-2.5 px-4 translator-rounded font-medium text-sm transition-all ${mode === "parallel"
                        ? "translator-primary translator-text-foreground"
                        : "translator-text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                >
                    📄📄 Parallel Documents
                </button>
            </div>

            {/* Language Selectors */}
            <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                    <LanguageSelector
                        value={sourceLanguage}
                        onChange={setSourceLanguage}
                        includeAuto={false}
                        recentLanguages={['en', 'zh-Hans', 'km']}
                        variant="tabs"
                    />
                </div>

                <div className="hidden md:flex items-center justify-center px-2 border-l border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
                    <button
                        onClick={() => {
                            setSourceLanguage(targetLanguage);
                            setTargetLanguage(sourceLanguage);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                        title="Swap languages"
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <LanguageSelector
                        value={targetLanguage}
                        onChange={setTargetLanguage}
                        includeAuto={false}
                        recentLanguages={['en', 'zh-Hans', 'km']}
                        variant="tabs"
                    />
                </div>
            </div>

            {/* Domain Selector */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-semibold translator-text-foreground whitespace-nowrap">Domain:</label>
                <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1 translator-card translator-border translator-rounded px-3 py-2 text-sm translator-text-foreground"
                >
                    {DOMAINS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                </select>
            </div>

            {/* File Upload Areas */}
            {mode === "single" ? (
                /* Single Document Mode - One file upload */
                <div className="flex flex-col">
                    <FileDropZone
                        file={singleFile}
                        onFileSelect={(f) => handleFileSelect(f, "source")}
                        onClear={() => { setSingleFile(null); if (singleInputRef.current) singleInputRef.current.value = ""; }}
                        label="📄 Document to Mine"
                        disabled={isMining}
                        dragActive={dragActiveSource}
                        inputRef={singleInputRef}
                        {...createDragHandlers("source")}
                    />
                </div>
            ) : (
                /* Parallel Documents Mode - Two file uploads side by side */
                <div className="flex gap-4 flex-col md:flex-row">
                    <FileDropZone
                        file={parallelSourceFile}
                        onFileSelect={(f) => handleFileSelect(f, "source")}
                        onClear={() => { setParallelSourceFile(null); if (parallelSourceInputRef.current) parallelSourceInputRef.current.value = ""; }}
                        label="📄 Source Document"
                        disabled={isMining}
                        dragActive={dragActiveSource}
                        inputRef={parallelSourceInputRef}
                        {...createDragHandlers("source")}
                    />
                    <FileDropZone
                        file={parallelTargetFile}
                        onFileSelect={(f) => handleFileSelect(f, "target")}
                        onClear={() => { setParallelTargetFile(null); if (parallelTargetInputRef.current) parallelTargetInputRef.current.value = ""; }}
                        label="📄 Target Document (Translated)"
                        disabled={isMining}
                        dragActive={dragActiveTarget}
                        inputRef={parallelTargetInputRef}
                        {...createDragHandlers("target")}
                    />
                </div>
            )}

            {/* Hidden file inputs */}
            <input
                ref={singleInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "source")}
                className="hidden"
                disabled={isMining}
            />
            <input
                ref={parallelSourceInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "source")}
                className="hidden"
                disabled={isMining}
            />
            <input
                ref={parallelTargetInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "target")}
                className="hidden"
                disabled={isMining}
            />

            {/* Error */}
            {error && (
                <div className="translator-rounded translator-border translator-destructive-bg-light p-3 text-sm translator-destructive">
                    <p className="font-medium">⚠️ Error</p>
                    <p className="text-xs mt-1">{error}</p>
                </div>
            )}

            {/* Progress Bar */}
            {isMining && (
                <div className="translator-rounded translator-border p-4 space-y-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-inner transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-end mb-1">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold translator-primary-text uppercase tracking-wider">AI Mining Progress</p>
                            <p className="text-sm font-medium translator-text-foreground flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full translator-primary animate-pulse"></span>
                                {miningProgress.stage || "Processing..."}
                            </p>
                        </div>
                        <p className="text-lg font-bold translator-primary-text">{miningProgress.percent}%</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100 dark:border-gray-800">
                        <div
                            className="h-full translator-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] relative overflow-hidden"
                            style={{ width: `${miningProgress.percent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] translator-muted-foreground italic">
                        <span>Optimizing glossary results...</span>
                        <span>Do not close this tab</span>
                    </div>
                </div>
            )}

            {/* Result Summary */}
            {result && (
                <div className="translator-rounded translator-border p-5 text-sm shadow-lg overflow-hidden relative group transition-all duration-500" style={{ backgroundColor: "oklch(0.9 0.05 150 / 0.15)" }}>
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={60} />
                    </div>
                    <div className="relative z-10">
                        <p className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                ✓
                            </span>
                            Mining Complete!
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="translator-card translator-rounded p-3 text-center border-b-2 border-primary/20 hover:border-primary transition-colors">
                                <p className="font-black text-2xl translator-primary-text">{result.termsExtracted || 0}</p>
                                <p className="text-[10px] translator-muted-foreground uppercase font-bold tracking-tighter">Extracted</p>
                            </div>
                            <div className="translator-card translator-rounded p-3 text-center border-b-2 border-green-500/20 hover:border-green-500 transition-colors">
                                <p className="font-black text-2xl text-green-600">{result.termsInserted || 0}</p>
                                <p className="text-[10px] translator-muted-foreground uppercase font-bold tracking-tighter">Inserted</p>
                            </div>
                            <div className="translator-card translator-rounded p-3 text-center border-b-2 border-yellow-500/20 hover:border-yellow-500 transition-colors">
                                <p className="font-black text-2xl text-yellow-600">{result.termsDuplicate || 0}</p>
                                <p className="text-[10px] translator-muted-foreground uppercase font-bold tracking-tighter">Duplicates</p>
                            </div>
                            <div className="translator-card translator-rounded p-3 text-center border-b-2 border-red-500/20 hover:border-red-500 transition-colors">
                                <p className="font-black text-2xl text-red-600">{result.termsConflict || 0}</p>
                                <p className="text-[10px] translator-muted-foreground uppercase font-bold tracking-tighter">Conflicts</p>
                            </div>
                        </div>
                        {result.domain && (
                            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary-text text-[10px] font-bold uppercase">Domain</span>
                                <p className="text-xs font-semibold translator-text-foreground">
                                    {result.domain}
                                    {result.domainConfidence && (
                                        <span className="ml-2 font-normal translator-muted-foreground">
                                            ({(result.domainConfidence * 100).toFixed(0)}% AI confidence)
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleClearAll}
                    disabled={isMining || !hasFile}
                    className="translator-rounded translator-border translator-text-foreground px-4 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    Clear
                </button>
                <button
                    onClick={handleMine}
                    disabled={!currentSourceFile || (mode === "parallel" && !currentTargetFile) || isMining}
                    className="flex-1 translator-rounded translator-primary px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
                >
                    {isMining ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Mining Terms...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Mine Glossary Terms
                        </>
                    )}
                </button>
            </div>

            {/* Help text */}
            <p className="text-xs translator-muted-foreground text-center">
                {mode === "single"
                    ? "Upload a source document. AI will extract terms and translate them."
                    : "Upload matching source and translated documents. AI will extract aligned term pairs."
                }
            </p>
        </div>
    );
}
