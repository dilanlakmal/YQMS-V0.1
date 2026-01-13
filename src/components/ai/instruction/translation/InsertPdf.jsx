import { useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { RiDeleteBin5Line } from "react-icons/ri";
import { Maximize2, Minimize2, Sparkles, Cpu, BrainCircuit, Loader2 } from "lucide-react";
import GPRTTemplate from "./templates/GPRT/GPRTTemplate";
import { createDoc, getProduction } from "./api/extraction.js";

/**
 * InsertPdf Component
 * Handles PDF file insertion and template preview for production instruction translation.
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
const InsertPdf = ({
    team,
    files,
    setFiles,
    preview,
    setPreview,
    currentStep,
    setCurrentStep,
    production,
    setProduction
}) => {
    const [activeDocId, setActiveDocId] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionStep, setExtractionStep] = useState(0);

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
    const handleFileDelete = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        if (updatedFiles.length === 0) {
            setPreview("");
        }
    };

    // Add new files to the list
    const handleFileAdd = async (event) => {
        const newFiles = Array.from(event.target.files).filter(file =>
            file.type === "application/pdf"
        );

        if (newFiles.length > 0) {
            setIsExtracting(true);
            setExtractionStep(1); // Starting extraction

            try {
                // Simulate steps for UI feel
                setTimeout(() => setExtractionStep(2), 1000); // Analyzing structure

                const response = await createDoc(newFiles[0], team, "instruction");
                const docId = response?.documentId;

                if (!docId) {
                    setIsExtracting(false);
                    return;
                }

                setExtractionStep(3); // Extracting text and features
                setActiveDocId(docId);

                const productionData = await getProduction(docId);

                setExtractionStep(4); // Finalizing data structures
                setTimeout(() => {
                    setProduction(productionData);
                    setFiles(prev => [...prev, ...newFiles]);
                    setPreview("Preview");
                    setIsExtracting(false);
                    setExtractionStep(0);
                }, 800);

            } catch (error) {
                console.error("Extraction failed:", error);
                setIsExtracting(false);
            }
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
                            <FaFilePdf className="text-3xl text-blue-400" />
                        </div>
                        <label
                            htmlFor="pdfInput"
                            className="cursor-pointer text-sm font-medium text-white bg-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all hover:-translate-y-0.5"
                            aria-label="Upload PDF files"
                        >
                            Select PDF Files
                        </label>
                        <input
                            id="pdfInput"
                            type="file"
                            accept=".pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileAdd}
                            aria-describedby="file-upload-help"
                        />
                        <p id="file-upload-help" className="text-xs text-slate-400 mt-3 text-center">
                            Supported format: PDF. Max size: 25MB.
                        </p>
                    </div>

                    {/* Uploaded Files List */}
                    {files.length > 0 && (
                        <div className="flex-1 mt-6 flex flex-col min-h-0">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Files</h2>
                            <ul className="space-y-2 overflow-y-auto pr-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-slate-100 text-red-500 shrink-0">
                                                <FaFilePdf />
                                            </div>
                                            <span className="text-slate-700 text-sm truncate font-medium">{file.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleFileDelete(index)}
                                            className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-md shadow-sm border border-slate-100 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            aria-label={`Delete ${file.name}`}
                                        >
                                            <RiDeleteBin5Line className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            {/* Template Preview Panel */}
            <aside className={`flex flex-col bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-full' : 'w-full md:w-1/2'}`}>
                <header className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-slate-200 font-semibold text-sm">Preview Template</h1>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
                            title={isExpanded ? "Collapse View" : "Expand View"}
                        >
                            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                    {preview && (
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
                                    <span>Processing with DeepMind AI...</span>
                                </div>
                                <p className="text-slate-500 text-xs">This usually takes a few seconds</p>
                            </div>
                        </div>
                    ) : team === "GPRT0007C" ? (
                        <div className="w-full h-full overflow-y-auto custom-scrollbar">
                            <div className="min-h-full">
                                <GPRTTemplate
                                    production={production}
                                    setProduction={setProduction}
                                    editable={preview === "Preview"}
                                    step={preview}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center sticky top-0">
                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-slate-400">
                                <FaFilePdf size={24} />
                            </div>
                            <p className="max-w-xs">Select a supported team (GPRT0007C) to view the live preview template.</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default InsertPdf;