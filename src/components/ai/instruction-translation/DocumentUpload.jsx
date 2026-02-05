import { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import { Maximize2, Minimize2, Sparkles, Cpu, BrainCircuit, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GprtTranslationTemplate from "./templates/gprt/GprtTranslationTemplate";
import instructionService from "@/services/instructionService";
import { useTranslate } from "@/hooks/useTranslate";


/**
 * InsertPdf Component
 * Handles PDF file insertion and template preview for instruction instruction translation.
 *
 * Props:
 * - team: string - Selected team name (e.g., "GPRT0007C")
 * - files: Array - List of uploaded files
 * - setFiles: Function - Setter for files state
 * - show: boolean - Whether to show the template
 * - preview: string - Current preview mode ("Preview" or "Complete")
 * - setPreview: Function - Setter for preview state
 * - currentStep: number - Current step index
 * - setCurrentStep: Function - Setter for current step
 */
const DocumentUpload = ({
    team,
    files,
    setFiles,
    preview,
    setPreview,
    currentStep,
    sourceLang,
    setSourceLang,
    setCurrentStep,
    instruction,
    setinstruction,
    onNext
}) => {
    const [activeDocId, setActiveDocId] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [extractionStep, setExtractionStep] = useState(0);
    const [uploadError, setUploadError] = useState(null);
    const [extractionError, setExtractionError] = useState(null);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    const [deletingDocId, setDeletingDocId] = useState(null); // 'all' or specific ID
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        onConfirm: null,
        variant: "danger" // 'danger' | 'warning'
    });

    // Translation Hook
    const { translate, translateBatch, userLang } = useTranslate();

    // UI Text State
    const [uiText, setUiText] = useState({
        docInsertion: "Document Insertion",
        uploadBtn: "Upload New PDF",
        uploading: "Uploading...",
        uploadHelp: "Supported format: PDF. Max size: 25MB.",
        uploadWait: "Please wait while we process your file...",
        files: "Files",
        noFiles: "No documents uploaded yet",
        recentUploads: "Recent Uploads",
        deleteTitle: "Delete Document",
        deleteMsg: "Are you sure you want to delete this document? This action cannot be undone.",
        clearTitle: "Clear All History",
        clearMsg: "This will permanently delete all uploaded documents from your history. Are you absolutely sure?",
        extractTitle: "Analyzing Document",
        extractMsg: "Our YAI Engine is processing your document structure...",
        extractErrorTitle: "Extraction Failed",
        extractErrorMsg: "Failed to extract data from the document. Please ensure it is a valid instruction PDF.",
        uploadErrorTitle: "Upload Failed",
        uploadErrorMsg: "Failed to upload file. Please try again.",
        previewTemplate: "Preview Template",
        aiExtraction: "AI Extraction",
        tryAgain: "Try Again",
        dismiss: "Dismiss",
        next: "Next",
        completed: "Completed",
        active: "Active",
        aiInitializing: "Initializing AI engine...",
        aiRendering: "Rendering document pages...",
        aiAnalyzing: "Analyzing document layout...",
        aiExtracting: "Extracting structured data...",
        aiFinalizing: "Finalizing results..."
    });

    // Translate UI Text
    useEffect(() => {
        const translateUI = async () => {
            const keys = Object.keys(uiText);
            const values = Object.values(uiText);

            // We can treat values as a list and translate them
            const translatedValues = await translateBatch(values);

            const newUiText = {};
            keys.forEach((key, index) => {
                newUiText[key] = translatedValues[index];
            });

            setUiText(prev => ({ ...prev, ...newUiText }));
        };

        if (userLang && userLang !== 'en') {
            translateUI();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLang]);

    // Refs for safe timer management
    const timersRef = {
        scan: null,
        process: null,
        complete: null
    };

    // Sync activeDocId with parent's instruction state
    useEffect(() => {
        if (instruction?.documentId && activeDocId !== instruction.documentId) {
            setActiveDocId(instruction.documentId);
        }
    }, [instruction, activeDocId]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (timersRef.scan) clearTimeout(timersRef.scan);
            if (timersRef.process) clearTimeout(timersRef.process);
            if (timersRef.complete) clearTimeout(timersRef.complete);
        };
    }, []);

    // Fetch file history on mount
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await instructionService.document.getDocsByUser();
                // Correctly access documents from response (api wrapper returns data)
                const docs = Array.isArray(response?.documents) ? response.documents : [];
                setFiles(docs);
            } catch (error) {
                console.error("Failed to fetch file history:", error);
            } finally {
                setIsLoadingFiles(false);
            }
        };

        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle preview toggle and step progression
    const handlePreviewToggle = async () => {
        if (preview === "Complete") {
            if (onNext) {
                await onNext();
            } else {
                setCurrentStep(prev => prev + 1);
            }
            // Preserve "Complete" state instead of resetting to "Preview"
            // setPreview("Preview"); 
        } else {
            setPreview("Complete");
        }
    };

    // Remove a file from the list
    const handleFileDelete = (docId, event) => {
        event.stopPropagation();
        if (!docId) return;

        setConfirmModal({
            show: true,
            title: uiText.deleteTitle,
            message: uiText.deleteMsg,
            variant: "danger",
            onConfirm: async () => {
                setDeletingDocId(docId);
                try {
                    await instructionService.document.deleteDoc(docId);
                    const updatedFiles = files.filter(f => f._id !== docId && f.id !== docId);
                    setFiles(updatedFiles);

                    if (activeDocId === docId) {
                        setActiveDocId("");
                        setinstruction({});
                        setPreview("");
                    }
                } catch (error) {
                    console.error("Failed to delete file:", error);
                    setUploadError("Failed to delete file. Please try again.");
                } finally {
                    setDeletingDocId(null);
                    setConfirmModal(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    // Delete all files
    const handleDeleteAll = () => {
        setConfirmModal({
            show: true,
            title: uiText.clearTitle,
            message: uiText.clearMsg,
            variant: "danger",
            onConfirm: async () => {
                setDeletingDocId('all');
                try {
                    await instructionService.document.deleteAllDocs();
                    setFiles([]);
                    setActiveDocId("");
                    setinstruction({});
                    setPreview("");
                } catch (error) {
                    console.error("Failed to delete all files:", error);
                    setUploadError("Failed to clear history. Please try again.");
                } finally {
                    setDeletingDocId(null);
                    setConfirmModal(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    // Handle file selection (Activation)
    const handleFileSelect = async (doc) => {
        const docId = doc._id || doc.id;

        // If already showing this document in preview, don't restart extraction
        if (activeDocId === docId && preview === "Preview" && !isExtracting) return;

        // Check if instruction data is already loaded for this doc to avoid redundant fetch
        if (instruction && (instruction.document_id === docId || instruction.documentId === docId)) {
            setActiveDocId(docId);
            if (!preview) setPreview("Preview");
            return;
        }

        // Clear existing timers
        if (timersRef.scan) clearTimeout(timersRef.scan);
        if (timersRef.process) clearTimeout(timersRef.process);
        if (timersRef.complete) clearTimeout(timersRef.complete);

        setActiveDocId(docId);

        // Optimization: If document is already fully processed, skip extraction animation and load directly
        if (doc.status === "fieldExtracted") {
            setIsExtracting(true); // Short animation for smoothness
            setExtractionStep(4); // Jump to data retrieval
            try {
                await instructionService.document.setActive(docId);
                const response = await instructionService.document.getInstruction(docId);
                const instructionData = response.data || response;
                setinstruction(instructionData);

                // Update team in progress if found in instruction
                if (instructionData?.customer?.customer_info?.name) {
                    try {
                        const detectedTeam = instructionData.customer.customer_info.name;
                        const steps = await instructionService.progress.getProgress("en");
                        const teamStep = steps.find(s => s.order === 1);

                        if (teamStep) {
                            await instructionService.progress.updateProgress(teamStep.id, { team: detectedTeam });
                        }
                    } catch (err) {
                        console.error("Failed to update team progress (fast-load):", err);
                    }
                }

                setPreview("Preview");
                setIsExtracting(false);
                return;
            } catch (err) {
                console.error("Fast-load failed, falling back to full extraction", err);
            }
        }

        setIsExtracting(true);
        setExtractionStep(1);
        setExtractionError(null);

        try {
            // Step 1: Initialize & Set Active
            setExtractionStep(1);
            await instructionService.document.setActive(docId);
            await new Promise(resolve => setTimeout(resolve, 400));

            // Step 2: Rendering document pages (PDF to Image)
            // Backend skips if already done
            setExtractionStep(2);
            await instructionService.document.convertPdfToImage(docId);

            // Step 3: Analyze Document Layout & VLM Extraction
            setExtractionStep(3);
            await instructionService.document.extractFields(docId, 1);

            // Step 4: Extract Structured Data using AI
            setExtractionStep(4);
            const response = await instructionService.document.getInstruction(docId);
            const instructionData = response.data || response;
            setinstruction(instructionData);

            // Update team in progress if found in instruction
            if (instructionData?.customer?.customer_info?.name) {
                try {
                    const detectedTeam = instructionData.customer.customer_info.name;
                    // Fetch steps to find the ID for step 1 (Team Selection)
                    // We default to 'en' as we just need IDs
                    const steps = await instructionService.progress.getProgress("en");
                    const teamStep = steps.find(s => s.order === 1);

                    if (teamStep) {
                        await instructionService.progress.updateProgress(teamStep.id, { team: detectedTeam });
                    }
                } catch (err) {
                    console.error("Failed to update team progress:", err);
                }
            }

            if (instructionData?.detectedLanguage) {
                try {
                    const langs = await instructionService.document.getSupportedLanguages();
                    const detected = langs.find(l =>
                        l.code.toLowerCase() === instructionData.detectedLanguage.toLowerCase() ||
                        l.name.toLowerCase() === instructionData.detectedLanguage.toLowerCase()
                    );
                    if (detected) {
                        // Match format expected by LanguageConfig (value/label)
                        setSourceLang({ value: detected.code, label: detected.name });
                    }
                } catch (langErr) {
                    console.error("Failed to set detected source language:", langErr);
                }
            }

            // Step 5: Finalizing & Intelligent Mapping
            setExtractionStep(5);

            // Sync wait - only transition once data is ready
            setPreview("Preview");
            setIsExtracting(false);
            setExtractionStep(0);

        } catch (err) {
            console.error("Failed to extract data:", err);
            setExtractionError(uiText.extractErrorMsg || "Failed to extract data from the document. Please ensure it is a valid instruction PDF.");
            setExtractionStep(0);
        }
    };

    // Cancel current extraction
    const handleCancelExtraction = () => {
        if (timersRef.scan) clearTimeout(timersRef.scan);
        if (timersRef.process) clearTimeout(timersRef.process);
        if (timersRef.complete) clearTimeout(timersRef.complete);
        setIsExtracting(false);
        setExtractionStep(0);
        setPreview("");
    };

    // Add new files to the list
    const handleFileAdd = async (event) => {
        const newFiles = Array.from(event.target.files).filter(file =>
            file.type === "application/pdf"
        );
        console.log("newFiles", newFiles);
        if (newFiles.length > 0) {
            setUploadError(null);
            setIsUploading(true);

            for (const file of newFiles) {
                try {
                    console.log("file", file);
                    const response = await instructionService.document.upload(file);
                    // Assuming response contains the created document object or at least ID
                    // We might need to refresh the list or construct a synthetic object if API returns minimal data
                    if (response) {
                        // Ideally we re-fetch the list to get the full object or use the response
                        // For responsiveness, let's append what we have or re-fetch.
                        // Re-fetching is safer to get the consistent DB object structure.
                        const listResponse = await instructionService.document.getDocsByUser();
                        const docs = Array.isArray(listResponse?.documents) ? listResponse.documents : [];
                        setFiles(docs);

                        // Automatically select the new file
                        const newDoc = docs.find(d => d._id === response.document._id);
                        // If we can't find it easily by ID (mapping might vary), just take the last one or skip auto-select
                        if (newDoc) {
                            await handleFileSelect(newDoc);
                        }
                    }
                } catch (err) {
                    if (err.response && err.response.status === 409 && err.response.data) {
                        // Handle conflict (file already exists) as success
                        const response = err.response.data;

                        const listResponse = await instructionService.document.getDocsByUser();
                        const docs = Array.isArray(listResponse?.documents) ? listResponse.documents : [];
                        setFiles(docs);

                        const newDoc = docs.find(d => d._id === response?.document._id);
                        if (newDoc) {
                            await handleFileSelect(newDoc);
                        }
                    } else {
                        console.error(`Error uploading file ${file.name}:`, err);
                        setUploadError(uiText.uploadErrorMsg);
                    }
                }
            }
            setIsUploading(false);
        }
        event.target.value = "";
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-6 transition-all duration-300 ease-in-out">
            {/* File Upload Panel */}
            <section className={`bg-white flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-0 opacity-0 hidden' : 'w-full md:w-1/2'}`}>
                <header className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h1 className="text-slate-700 font-semibold flex items-center gap-2">
                        <FaFilePdf className="text-blue-500" />
                        {uiText.docInsertion}
                    </h1>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {files.length} {uiText.files}
                    </span>
                </header>
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    {/* File Upload Area */}
                    <div className="w-full flex-shrink-0 flex flex-col items-center justify-center py-10 px-6 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 transition-all group">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                            {isUploading ? (
                                <Loader2 className="text-3xl text-blue-500 animate-spin" />
                            ) : (
                                <FaFilePdf className="text-3xl text-blue-400" />
                            )}
                        </div>
                        <label
                            htmlFor="pdfInput"
                            className={`cursor-pointer text-sm font-medium text-white bg-blue-600 px-6 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-sm shadow-blue-200 ${isUploading ? 'opacity-50 cursor-not-allowed bg-blue-400' : 'hover:bg-blue-700'}`}
                            aria-label="Upload PDF files"
                        >
                            {isUploading ? uiText.uploading : uiText.uploadBtn}
                        </label>
                        <input
                            id="pdfInput"
                            type="file"
                            accept=".pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileAdd}
                            disabled={isUploading}
                            aria-describedby="file-upload-help"
                        />
                        <p id="file-upload-help" className="text-xs text-slate-400 mt-3 text-center">
                            {isUploading ? uiText.uploadWait : uiText.uploadHelp}
                        </p>
                    </div>

                    {/* Error Messages (Upload only) - Enhanced Premium Design */}
                    <AnimatePresence>
                        {uploadError && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    x: [0, -4, 4, -4, 4, 0], // Subtle shaking effect on enter
                                }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.4, x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] } }}
                                className="mt-6 relative overflow-hidden group"
                            >
                                {/* Background with Glow */}
                                <div className="absolute inset-0 bg-red-600/5 backdrop-blur-sm rounded-2xl border border-red-200/50 shadow-lg shadow-red-200/20"></div>
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600"></div>

                                <div className="relative p-5 flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-200 group-hover:scale-110 transition-transform">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h4 className="text-sm font-black text-red-900 uppercase tracking-wider mb-1">
                                            {uiText.uploadErrorTitle}
                                        </h4>
                                        <p className="text-xs text-red-700/80 leading-relaxed font-medium">
                                            {uploadError}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setUploadError(null)}
                                        className="p-1.5 rounded-lg transition-all text-red-400 hover:text-red-700 hover:bg-red-100/50 active:scale-90"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Uploaded Files List */}
                    <div className="flex-1 mt-6 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {uiText.recentUploads}
                            </h2>
                            {files.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deletingDocId !== null}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tight flex items-center gap-1 disabled:opacity-50"
                                >
                                    {deletingDocId === 'all' ? <Loader2 size={10} className="animate-spin" /> : <RiDeleteBin5Line size={10} />}
                                    {uiText.clearTitle}
                                </button>
                            )}
                        </div>

                        {isLoadingFiles ? (
                            <div className="flex items-center justify-center py-8 text-slate-400">
                                <Loader2 className="animate-spin mr-2" size={18} />
                                <span className="text-sm">Loading history...</span>
                            </div>
                        ) : files.length > 0 ? (
                            <ul className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence initial={false}>
                                    {files.map((file, index) => {
                                        const docId = file._id;
                                        const isActive = activeDocId === docId;
                                        const isDeleting = deletingDocId === docId || deletingDocId === 'all';

                                        return (
                                            <motion.li
                                                key={docId || index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{
                                                    opacity: isDeleting ? 0.5 : 1,
                                                    x: 0,
                                                    scale: isDeleting ? 0.98 : 1
                                                }}
                                                exit={{ opacity: 0, x: 20, height: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={async () => !isDeleting && await handleFileSelect(file)}
                                                className={`relative flex justify-between items-center p-3 rounded-lg border transition-all group ${isActive
                                                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100 shadow-sm"
                                                    : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"
                                                    } ${isDeleting ? "cursor-wait pointer-events-none" : "cursor-pointer"}`}
                                            >
                                                {isDeleting && (
                                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-slate-100">
                                                            <Loader2 size={12} className="animate-spin text-red-500" />
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Deleting</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded flex items-center justify-center border shrink-0 transition-colors ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-red-500 border-slate-100"
                                                        }`}>
                                                        <FaFilePdf size={14} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`text-sm truncate font-medium ${isActive ? "text-blue-900" : "text-slate-700"}`}>
                                                            {file.file_name || "Untitled Document"}
                                                        </span>
                                                        {isActive && (
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter flex items-center gap-1">
                                                                <CheckCircle size={10} /> {uiText.active}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleFileDelete(docId, e)}
                                                        disabled={deletingDocId !== null}
                                                        className={`p-1.5 rounded-md shadow-sm border transition-all ${isActive
                                                            ? "text-blue-400 hover:text-red-500 bg-white border-blue-100 hover:border-red-100"
                                                            : "text-slate-400 hover:text-red-500 bg-white border-slate-100 hover:border-red-100 opacity-0 group-hover:opacity-100"
                                                            } ${deletingDocId === docId ? 'bg-red-50 opacity-100' : ''}`}
                                                        aria-label="Delete file"
                                                    >
                                                        <RiDeleteBin5Line className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </AnimatePresence>
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm italic">
                                {uiText.noFiles}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Template Preview Panel */}
            <aside className={`flex flex-col bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-full' : 'w-full md:w-1/2'}`}>
                <header className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-slate-200 font-semibold text-sm">{uiText.previewTemplate}</h1>
                        <button
                            onClick={() => !isExtracting && setIsExpanded(!isExpanded)}
                            disabled={isExtracting || !activeDocId}
                            className={`transition-colors p-1 rounded ${isExtracting || !activeDocId
                                ? "text-slate-600 cursor-not-allowed"
                                : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                            title={isExpanded ? "Collapse View" : "Expand View"}
                        >
                            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                    {preview && activeDocId && (
                        <button
                            onClick={handlePreviewToggle}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${preview === "Preview"
                                ? "bg-slate-700 text-slate-300 border-slate-600 hover:text-white"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                }`}
                        >
                            {preview === "Preview" ? uiText.completed : uiText.next}
                        </button>
                    )}
                </header>
                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                    {/* Only show content if we have an active document */}
                    {activeDocId ? (
                        <>
                            {extractionError ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="relative mb-8">
                                        {/* Animated Error Rings */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute -inset-10 rounded-full bg-red-600/20 blur-3xl"
                                        ></motion.div>

                                        <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center text-red-500 border border-red-500/30 overflow-hidden group">
                                            {/* AI Static Effect */}
                                            <div className="absolute inset-0 opacity-10 bg-[url('https://media.giphy.com/media/oEI9uWUicKgR6/giphy.gif')] bg-cover"></div>
                                            <AlertCircle size={48} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    </div>

                                    <motion.h3
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-3xl font-black text-white mb-4 tracking-tight"
                                    >
                                        {uiText.extractErrorTitle || "Extraction Failed"}
                                    </motion.h3>

                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-slate-400 max-w-sm mb-12 leading-relaxed text-sm font-medium"
                                    >
                                        {extractionError}
                                    </motion.p>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
                                    >
                                        <button
                                            onClick={async () => {
                                                const activeFile = files.find(f => (f._id || f.id) === activeDocId);
                                                if (activeFile) await handleFileSelect(activeFile);
                                            }}
                                            className="flex-1 px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:from-blue-500 hover:to-blue-600 transition-all hover:-translate-y-1 active:scale-95 shadow-xl shadow-blue-500/20"
                                        >
                                            {uiText.tryAgain}
                                        </button>
                                        <button
                                            onClick={() => setExtractionError(null)}
                                            className="flex-1 px-10 py-4 bg-white/5 text-slate-300 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all hover:-translate-y-1 active:scale-95 backdrop-blur-md"
                                        >
                                            {uiText.dismiss}
                                        </button>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mt-12 flex items-center gap-2 text-slate-600"
                                    >
                                        <Cpu size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">System Status: Partial Downtime</span>
                                    </motion.div>
                                </motion.div>
                            ) : isExtracting ? (
                                <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-8 overflow-hidden">
                                    {/* AI Extraction Animation Elements */}
                                    <div className="ai-neural-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

                                    {/* Floating Particles */}
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="ai-particle"
                                            style={{
                                                "--x": `${Math.random() * 400 - 200}px`,
                                                "--y": `${Math.random() * 400 - 200}px`,
                                                left: `${50 + (Math.random() * 20 - 10)}%`,
                                                top: `${50 + (Math.random() * 20 - 10)}%`,
                                                animationDelay: `${Math.random() * 4}s`
                                            }}
                                        ></div>
                                    ))}

                                    <div className="relative w-72 h-96 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-pulse-soft">
                                        <div className="ai-scan-line"></div>
                                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                                            <FaFilePdf className="text-red-400" />
                                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${(extractionStep / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 space-y-3">
                                            <div className="w-full h-3 bg-slate-700 rounded"></div>
                                            <div className="w-4/5 h-3 bg-slate-700 rounded"></div>
                                            <div className="w-full h-3 bg-slate-700 rounded"></div>
                                            <div className="w-2/3 h-3 bg-slate-700 rounded"></div>
                                            <div className="pt-4 grid grid-cols-2 gap-2">
                                                <div className="h-20 bg-slate-700/50 rounded-md border border-slate-600/50"></div>
                                                <div className="h-20 bg-slate-700/50 rounded-md border border-slate-600/50"></div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/50 backdrop-blur-sm border-t border-white/5 flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <BrainCircuit size={18} className="text-blue-400 animate-spin-slow" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{uiText.aiExtraction}</p>
                                                    <span className="text-[10px] text-blue-400 font-bold">{Math.round((extractionStep / 5) * 100)}%</span>
                                                </div>
                                                <p className="text-xs text-slate-300 font-medium truncate">
                                                    {extractionStep === 1 && uiText.aiInitializing}
                                                    {extractionStep === 2 && uiText.aiRendering}
                                                    {extractionStep === 3 && uiText.aiAnalyzing}
                                                    {extractionStep === 4 && uiText.aiExtracting}
                                                    {extractionStep === 5 && uiText.aiFinalizing}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing with YAI...</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-slate-500 text-xs">This usually takes a few seconds</p>
                                            <button
                                                onClick={handleCancelExtraction}
                                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-2 border border-slate-700 px-3 py-1 rounded-full hover:bg-slate-800 transition-all"
                                            >
                                                Cancel Extraction
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : team === "GPRT0007C" ? (
                                <div className="w-full h-full overflow-y-auto custom-scrollbar">
                                    <div className="min-h-full">
                                        <GprtTranslationTemplate
                                            instruction={instruction}
                                            setinstruction={setinstruction}
                                            editable={preview === "Preview"}
                                            step={preview}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center sticky top-0">
                                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-slate-400">
                                        <FaFilePdf size={24} />
                                    </div>
                                    <p className="max-w-xs">Select a supported team (GPRT0007C) to view the live preview template.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                            <FaFilePdf size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">No document selected</p>
                            <p className="text-xs text-slate-600 mt-2 max-w-xs text-center">
                                Upload a new PDF or select one from the history list to begin extraction.
                            </p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Custom Confirmation Modal - Premium Design */}
            <AnimatePresence>
                {confirmModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200 w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${confirmModal.variant === 'danger'
                                        ? 'bg-red-50 text-red-500 shadow-inner'
                                        : 'bg-amber-50 text-amber-500 shadow-inner'
                                        }`}>
                                        <AlertCircle size={40} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 tracking-tight">
                                            {confirmModal.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                            {confirmModal.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-10">
                                    <button
                                        onClick={() => {
                                            if (confirmModal.onConfirm) confirmModal.onConfirm();
                                        }}
                                        disabled={deletingDocId !== null}
                                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 shadow-lg flex items-center justify-center gap-2 ${confirmModal.variant === 'danger'
                                            ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'
                                            : 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600'
                                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                                    >
                                        {deletingDocId !== null ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            confirmModal.variant === 'danger' && <RiDeleteBin5Line size={16} />
                                        )}
                                        {deletingDocId !== null ? "Processing..." : "Confirm Action"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                        disabled={deletingDocId !== null}
                                        className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        Wait, Go Back
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentUpload;