import { useState } from "react";
import GPRTTemplate from "./templates/GPRT/GPRTTemplate";
import { AlertCircle, FileCheck, Download, Save, BookPlus, Info, Maximize2, Minimize2 } from "lucide-react";

const Result = ({ team, mode = "final", production, setProduction, onNext, sourceLang, targetLang }) => {
    // Determine language to show. 
    // Default to target language (e.g. Chinese) if available, otherwise fallback.
    const initialLang = targetLang?.value || "zh";
    const [currentViewLang, setCurrentViewLang] = useState(mode === "review" ? initialLang : initialLang);

    const [glossaryCount, setGlossaryCount] = useState(0);
    const [capturedTerms, setCapturedTerms] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMarkGlossary = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            setCapturedTerms([...capturedTerms, text]);
            setGlossaryCount(prev => prev + 1);
            // Clear selection
            selection.removeAllRanges();
        }
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const containerClasses = isExpanded
        ? "fixed inset-0 z-50 bg-slate-50 flex flex-col"
        : "h-full w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative flex flex-col";

    return (
        <div className={containerClasses}>
            {/* Context Awareness Header for Review Mode */}
            {mode === "review" && (
                <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <Info size={16} />
                        <span><strong>Review Mode:</strong> Click on text fields to edit translation. Select text and click "Mark as Glossary Entry" to capture corrections.</span>
                    </div>
                    {/* Language Toggles for Verification */}
                    <div className="flex bg-white rounded-lg border border-yellow-200 p-0.5">
                        <button
                            onClick={() => setCurrentViewLang(sourceLang?.value || "en")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentViewLang === (sourceLang?.value || "en") ? "bg-yellow-100 text-yellow-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Original ({sourceLang?.label || "English"})
                        </button>
                        <button
                            onClick={() => setCurrentViewLang(targetLang?.value || "zh")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentViewLang === (targetLang?.value || "zh") ? "bg-yellow-100 text-yellow-900" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Translated ({targetLang?.label || "Target"})
                        </button>
                    </div>
                </div>
            )}

            {/* Captured Glossary Terms Floating List (Demo) */}
            {capturedTerms.length > 0 && mode === "review" && (
                <div className="absolute top-20 right-8 z-30 w-64 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4">
                    <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase">Captured Terms ({capturedTerms.length})</h4>
                        <BookPlus size={14} className="text-emerald-600" />
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                        {capturedTerms.map((term, i) => (
                            <li key={i} className="px-4 py-2 text-sm text-slate-700 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between group">
                                <span className="truncate">{term}</span>
                                <button onClick={() => setCapturedTerms(capturedTerms.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 hidden group-hover:block">×</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Expand Toggle Button - Overlay */}
            <button
                onClick={toggleExpand}
                className="absolute top-4 right-4 z-40 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-500 rounded-lg hover:bg-white hover:text-blue-600 shadow-sm transition-all"
                title={isExpanded ? "Collapse View" : "Expand View"}
            >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {team === "GPRT0007C" ? (
                <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
                    {/* GPRTTemplate manages its own scrolling now via the sidebar/content layout */}
                    <div className="flex-1 overflow-hidden">
                        <GPRTTemplate
                            editable={mode === "review"}
                            step={mode === "review" ? "edit" : "complete"}
                            currentLanguage={currentViewLang}
                            production={production}
                            setProduction={setProduction}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <p>Select a supported team to view the final result.</p>
                </div>
            )}

            {team === "GPRT0007C" && (
                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 gap-4">
                    {mode === "review" ? (
                        <>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleMarkGlossary}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                                >
                                    <BookPlus size={16} /> Mark as Glossary Entry
                                    {glossaryCount > 0 && <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">{glossaryCount}</span>}
                                </button>
                                <span className="text-xs text-slate-400">Select text to apply</span>
                            </div>
                            <button
                                onClick={onNext}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="text-sm text-slate-500">
                                Document ready for export.
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                    <Download size={16} /> Export as PDF
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200">
                                    <FileCheck size={16} /> Finish
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default Result;