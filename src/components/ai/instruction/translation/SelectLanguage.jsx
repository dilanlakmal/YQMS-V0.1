
import { useState, useEffect } from "react";
import Select from "react-select";
import { ArrowRightLeft, Languages, Book, Upload, FileSpreadsheet, Sparkles, Loader2 } from "lucide-react";
import { getOriginLangByPage } from "./api/extraction";

const languages = [
    { value: "english", label: "English" },
    { value: "chinese", label: "Chinese (Simplified)" },
    { value: "khmer", label: "Khmer" },
];

const customStyles = {
    control: (base, state) => ({
        ...base,
        padding: "0.2rem",
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
        "&:hover": {
            borderColor: "#cbd5e1"
        },
        borderRadius: "0.5rem",
    }),
    option: (base, state) => ({
        ...base,
        padding: "0.2rem",
        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        ":active": {
            backgroundColor: "#2563eb"
        }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const SelectLanguage = ({
    glossaryFile,
    setGlossaryFile,
    production,
    onNext,
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang
}) => {
    // Local state moved to parent
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedInfo, setDetectedInfo] = useState(null);

    // Glossary State
    const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'manual'
    const [manualEntries, setManualEntries] = useState([]);
    const [newTerm, setNewTerm] = useState({ source: "", target: "" });
    const [pasteContent, setPasteContent] = useState("");
    const [showPasteArea, setShowPasteArea] = useState(false);

    useEffect(() => {
        const detectLanguage = async () => {
            // Only auto-detect if we have a documentId and haven't manually changed selection yet (optional check)
            if (production?.documentId) {
                setIsDetecting(true);
                try {
                    // Fetch language for page 1 as a proxy for the document
                    const result = await getOriginLangByPage(production.documentId, 1);
                    console.log("Detected Language Result:", result);

                    if (result && result.OrigenLang) {
                        let detectedCode = result.OrigenLang.toLowerCase();
                        if (detectedCode === 'en') detectedCode = 'english';
                        if (detectedCode === 'km') detectedCode = 'khmer';

                        const matchedLang = languages.find(l => l.value === detectedCode);

                        if (matchedLang) {
                            setSourceLang(matchedLang);
                            setDetectedInfo(`Detected: ${matchedLang.label}`);
                        } else {
                            // If code exists but not in our list (e.g. 'fr'), stick to default or show code
                            setDetectedInfo(`Detected code: ${detectedCode} (Not in list)`);
                        }
                    } else {
                        setDetectedInfo("Could not detect language.");
                    }
                } catch (error) {
                    console.error("Language detection failed:", error);
                    setDetectedInfo("Detection failed.");
                } finally {
                    setIsDetecting(false);
                }
            }
        };

        detectLanguage();
    }, [production]);

    // Regenerate glossary file whenever manual entries change
    useEffect(() => {
        if (activeTab === "manual" && manualEntries.length > 0) {
            const csvContent = "Source,Target\n" + manualEntries.map(e => `${e.source},${e.target}`).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const file = new File([blob], "manual_glossary.csv", { type: "text/csv" });
            setGlossaryFile(file);
        } else if (activeTab === "manual" && manualEntries.length === 0) {
            // setGlossaryFile(null); // Optional: clear if empty? Or keep previous? Let's clear to be safe.
        }
    }, [manualEntries, activeTab, setGlossaryFile]);

    const handleSwap = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
    };

    const handleGlossaryUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setGlossaryFile(e.target.files[0]);
            setActiveTab("upload"); // Switch to upload view assurance
        }
    };

    const handleAddManualEntry = () => {
        if (newTerm.source.trim() && newTerm.target.trim()) {
            setManualEntries([...manualEntries, { ...newTerm }]);
            setNewTerm({ source: "", target: "" });
        }
    };

    const handleBulkPaste = () => {
        if (!pasteContent) return;

        // Simple parser: assumes newline separation for rows, and common delimiters (comma, tab, pipe) for cols
        const rows = pasteContent.split(/\r?\n/).filter(r => r.trim());
        const newEntries = rows.map(row => {
            // Try comma, then tab, then pipe
            let parts = row.split(",");
            if (parts.length < 2) parts = row.split("\t");
            if (parts.length < 2) parts = row.split("|");

            if (parts.length >= 2) {
                return { source: parts[0].trim(), target: parts[1].trim() };
            }
            return null;
        }).filter(e => e !== null);

        setManualEntries(prev => [...prev, ...newEntries]);
        setPasteContent("");
        setShowPasteArea(false);
    };

    const removeEntry = (index) => {
        setManualEntries(manualEntries.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Language Selection Config */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-8 rounded-xl border border-slate-200 relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <GlobeIcon size={120} />
                </div>

                <div className="flex-1 w-full space-y-2 z-10">
                    <label className="text-sm font-semibold text-slate-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Languages size={16} /> Source Language
                        </div>
                        {isDetecting && (
                            <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse">
                                <Loader2 size={12} className="animate-spin" /> Detecting...
                            </span>
                        )}
                        {!isDetecting && detectedInfo && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <Sparkles size={10} /> {detectedInfo}
                            </span>
                        )}
                    </label>
                    <Select
                        value={sourceLang}
                        onChange={setSourceLang}
                        options={languages}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        className="text-sm"
                    />
                </div>

                <div className="flex flex-col items-center pt-6 md:pt-0 z-10">
                    <button
                        onClick={handleSwap}
                        className="p-3 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all"
                        title="Swap languages"
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                    <span className="text-xs text-slate-400 mt-2 font-medium">Translate</span>
                </div>

                <div className="flex-1 w-full space-y-2 z-10">
                    <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">T</div>
                        Target Language
                    </label>
                    <Select
                        value={targetLang}
                        onChange={setTargetLang}
                        options={languages}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        className="text-sm"
                    />
                </div>
            </div>

            {/* Glossary Configuration */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${activeTab === 'manual' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Book size={18} className={activeTab === 'manual' ? "text-blue-600" : "text-emerald-600"} />
                            Glossary Integration
                        </h3>
                        <p className="text-sm text-slate-500">Provide terminology to guide the translation AI.</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            File Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Manual Entry
                        </button>
                    </div>
                </div>

                {activeTab === 'upload' ? (
                    <div className="flex items-center gap-4 w-full md:w-auto animate-in fade-in duration-300">
                        {glossaryFile && !glossaryFile.name.startsWith("manual_") ? (
                            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-100 w-full">
                                <FileSpreadsheet className="text-emerald-600" size={24} />
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-medium text-emerald-900">{glossaryFile.name}</span>
                                    <span className="text-xs text-emerald-600">{(glossaryFile.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button onClick={() => setGlossaryFile(null)} className="text-emerald-400 hover:text-emerald-700 p-1 hover:bg-emerald-100 rounded">✕</button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-3 px-8 py-10 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors w-full group">
                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload size={20} className="text-slate-400 group-hover:text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-medium text-slate-700 block group-hover:text-emerald-700">Click to Upload Glossary</span>
                                    <span className="text-xs text-slate-400">Supports .csv, .xlsx</span>
                                </div>
                                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleGlossaryUpload} />
                            </label>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Manual Entry Form */}
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-12 md:col-span-5 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Source ({sourceLang.label})</label>
                                <input
                                    type="text"
                                    value={newTerm.source}
                                    onChange={(e) => setNewTerm({ ...newTerm, source: e.target.value })}
                                    placeholder="e.g., Connector"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddManualEntry()}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-5 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Target ({targetLang.label})</label>
                                <input
                                    type="text"
                                    value={newTerm.target}
                                    onChange={(e) => setNewTerm({ ...newTerm, target: e.target.value })}
                                    placeholder="e.g., Connecteur"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddManualEntry()}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-2">
                                <button
                                    onClick={handleAddManualEntry}
                                    disabled={!newTerm.source || !newTerm.target}
                                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Bulk Paste Toggle */}
                        <div className="text-right">
                            <button
                                onClick={() => setShowPasteArea(!showPasteArea)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                                {showPasteArea ? "Hide Bulk Paste" : "+ Bulk Paste Terms"}
                            </button>
                        </div>

                        {showPasteArea && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                <textarea
                                    value={pasteContent}
                                    onChange={(e) => setPasteContent(e.target.value)}
                                    placeholder={`Paste list here...\nWord1, Word2\nWord3, Word4`}
                                    className="w-full h-24 text-xs font-mono p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-300 resize-none"
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleBulkPaste}
                                        className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-900"
                                    >
                                        Process & Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Valid Terms List */}
                        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50">
                            {manualEntries.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No entries yet. Add terms above.
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Source</th>
                                            <th className="px-4 py-2">Target</th>
                                            <th className="px-2 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {manualEntries.map((entry, idx) => (
                                            <tr key={idx} className="bg-white hover:bg-slate-50 group">
                                                <td className="px-4 py-2 font-medium text-slate-700">{entry.source}</td>
                                                <td className="px-4 py-2 text-slate-600">{entry.target}</td>
                                                <td className="px-2 py-2 text-right">
                                                    <button
                                                        onClick={() => removeEntry(idx)}
                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-blue-900 font-medium">
                            Ready to Translate
                        </p>
                        <p className="text-sm text-blue-700/80 mt-1">
                            Translation will be performed from <strong>{sourceLang.label}</strong> to <strong>{targetLang.label}</strong>. {glossaryFile ? <span>Glossary <strong>{glossaryFile.name}</strong> ({activeTab === 'manual' ? `${manualEntries.length} terms` : 'File Upload'}) will be applied.</span> : <span>No glossary selected.</span>}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onNext}
                    className="shrink-0 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all flex items-center gap-2"
                >
                    Start Translation <ArrowRightLeft size={16} />
                </button>
            </div>
        </div>
    )
}

function GlobeIcon({ size = 24, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}

export default SelectLanguage;