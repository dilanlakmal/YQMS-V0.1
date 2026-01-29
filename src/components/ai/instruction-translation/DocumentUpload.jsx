import { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import { Maximize2, Minimize2, Sparkles, Cpu, BrainCircuit, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GprtTranslationTemplate from "./templates/gprt/GprtTranslationTemplate";
import instructionService from "@/services/instructionService";
import { getProduction as getInstruction } from "./api/extraction";


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
    setCurrentStep,
    instruction,
    setinstruction
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
                logger.error("Failed to fetch file history:", error);
            } finally {
                setIsLoadingFiles(false);
            }
        };

        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle preview toggle and step progression
    const handlePreviewToggle = () => {
        if (preview === "Complete") {
            setCurrentStep(prev => prev + 1);
            setPreview("Preview");
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
            title: "Delete Document",
            message: "Are you sure you want to delete this document? This action cannot be undone.",
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
            title: "Clear All History",
            message: "This will permanently delete all uploaded documents from your history. Are you absolutely sure?",
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
                    logger.error("Failed to delete all files:", error);
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
        if (activeDocId === docId && preview === "Preview") return;

        // Clear existing timers before starting new ones
        if (timersRef.scan) clearTimeout(timersRef.scan);
        if (timersRef.process) clearTimeout(timersRef.process);
        if (timersRef.complete) clearTimeout(timersRef.complete);

        setActiveDocId(docId);
        setIsExtracting(true);
        setExtractionStep(1);
        setExtractionError(null);

        try {
            // Persist active document selection to backend
            await instructionService.document.setActive(docId);

            // Simulate steps for UI feel
            timersRef.scan = setTimeout(() => setExtractionStep(2), 500);

            // Artificial delay to show "Extraction" process even if fast
            timersRef.process = setTimeout(async () => {
                setExtractionStep(3);
                try {
                    const instructionData = await getInstruction(docId);
                    setinstruction(instructionData);
                    setExtractionStep(4);

                    timersRef.complete = setTimeout(() => {
                        setPreview("Preview");
                        setIsExtracting(false);
                        setExtractionStep(0);
                    }, 500);
                } catch (err) {
                    logger.error("Failed to fetch instruction data:", err);
                    setExtractionError("Failed to extract data from the document. Please ensure it is a valid instruction PDF.");
                    setIsExtracting(false);
                }
            }, 1500);

        } catch (error) {
            logger.error("Error activating file:", error);
            setIsExtracting(false);
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
        logger.log("newFiles", newFiles);
        if (newFiles.length > 0) {
            setUploadError(null);
            setIsUploading(true);

            for (const file of newFiles) {
                try {
                    logger.log("file", file);
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
                            handleFileSelect(newDoc);
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
                            handleFileSelect(newDoc);
                        }
                    } else {
                        logger.error(`Error uploading file ${file.name}:`, err);
                        setUploadError("Failed to upload file. Please try again.");
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
                        Document Insertion
                    </h1>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {files.length} Files
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
                            {isUploading ? "Uploading..." : "Upload New PDF"}
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
                            {isUploading ? "Please wait while we process your file..." : "Supported format: PDF. Max size: 25MB."}
                        </p>
                    </div>

                    {/* Error Messages */}
                    <AnimatePresence>
                        {(uploadError || extractionError) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, mb: 0 }}
                                animate={{ opacity: 1, height: "auto", mb: 16 }}
                                exit={{ opacity: 0, height: 0, mb: 0 }}
                                className={`mt-4 p-4 border rounded-xl flex items-start gap-3 overflow-hidden ${uploadError ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg shrink-0 ${uploadError ? "bg-red-100" : "bg-amber-100"
                                    }`}>
                                    <AlertCircle className={uploadError ? "text-red-600" : "text-amber-600"} size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${uploadError ? "text-red-900" : "text-amber-900"}`}>
                                        {uploadError ? "Upload Failed" : "Extraction Error"}
                                    </p>
                                    <p className={`text-xs mt-0.5 leading-relaxed ${uploadError ? "text-red-600" : "text-amber-700"}`}>
                                        {uploadError || extractionError}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUploadError(null);
                                        setExtractionError(null);
                                    }}
                                    className={`p-1 rounded transition-colors shrink-0 ${uploadError ? "text-red-400 hover:text-red-600 hover:bg-red-100/50" : "text-amber-400 hover:text-amber-600 hover:bg-amber-100/50"
                                        }`}
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Uploaded Files List */}
                    <div className="flex-1 mt-6 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                File History
                            </h2>
                            {files.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deletingDocId !== null}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tight flex items-center gap-1 disabled:opacity-50"
                                >
                                    {deletingDocId === 'all' ? <Loader2 size={10} className="animate-spin" /> : <RiDeleteBin5Line size={10} />}
                                    Clear History
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
                                {files.map((file, index) => {
                                    const docId = file._id;
                                    const isActive = activeDocId === docId;

                                    return (
                                        <li
                                            key={docId || index}
                                            onClick={() => handleFileSelect(file)}
                                            className={`flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer group ${isActive
                                                ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100 shadow-sm"
                                                : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"
                                                }`}
                                        >
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
                                                            <CheckCircle size={10} /> Active
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
                                                        } ${deletingDocId === docId ? 'bg-red-50 !opacity-100' : ''}`}
                                                    aria-label="Delete file"
                                                >
                                                    {deletingDocId === docId ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                    ) : (
                                                        <RiDeleteBin5Line className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm italic">
                                No files uploaded yet.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Template Preview Panel */}
            <aside className={`flex flex-col bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-full' : 'w-full md:w-1/2'}`}>
                <header className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-slate-200 font-semibold text-sm">Preview Template</h1>
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
                            {preview === "Preview" ? "Completed" : "Next"}
                        </button>
                    )}
                </header>
                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                    {/* Only show content if we have an active document */}
                    {activeDocId ? (
                        <>
                            {isExtracting ? (
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
                                                    style={{ width: `${(extractionStep / 4) * 100}%` }}
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
                                                <BrainCircuit size={18} className="text-blue-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">AI Extraction</p>
                                                <p className="text-xs text-slate-300 font-medium leading-none">
                                                    {extractionStep === 1 && "Initializing AI engine..."}
                                                    {extractionStep === 2 && "Analyzing document layout..."}
                                                    {extractionStep === 3 && "Extracting structured data..."}
                                                    {extractionStep === 4 && "Applying intelligent mapping..."}
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

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-2">
                                    <div className={`p-3 rounded-xl shrink-0 ${confirmModal.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{confirmModal.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{confirmModal.message}</p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-8">
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 ${confirmModal.variant === 'danger'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200'
                                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200'
                                            }`}
                                    >
                                        {confirmModal.variant === 'danger' && <RiDeleteBin5Line size={16} />}
                                        Yes, Delete
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