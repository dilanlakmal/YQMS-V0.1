
import { useState, useEffect } from "react";
import Select from "react-select";
import { ArrowRightLeft, Languages, Book, Upload, FileSpreadsheet, Sparkles, Loader2, Globe, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { document } from "@/services/instructionService";
import { useTranslate } from "@/hooks/useTranslate";

const GLOSSARY_SUPPORTED = ["en", "zh-hans", "zh", "km"];

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
        backgroundColor: "white",
    }),
    option: (base, state) => ({
        ...base,
        padding: "0.6rem 0.8rem",
        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        ":active": {
            backgroundColor: "#2563eb"
        },
        cursor: "pointer"
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const LanguageConfig = ({
    glossaryFile,
    setGlossaryFile,
    instruction,
    onNext,
    sourceLang,
    setSourceLang,
    targetLangs,
    setTargetLangs
}) => {
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedCode, setDetectedCode] = useState("");
    const [isLoadingLangs, setIsLoadingLangs] = useState(true);

    // Glossary State
    const [activeTab, setActiveTab] = useState("upload");
    const [manualEntries, setManualEntries] = useState([]);
    const [newTerm, setNewTerm] = useState({ source: "", target: "" });
    const [pasteContent, setPasteContent] = useState("");
    const [showPasteArea, setShowPasteArea] = useState(false);

    // Translation Hook
    const { translate, translateBatch, userLang } = useTranslate();

    // UI Text State
    const [uiText, setUiText] = useState({
        source: "SOURCE",
        target: "TARGET",
        detecting: "Detecting...",
        detected: "Detected",
        glossaryReady: "Glossary Ready",
        genericOnly: "Generic Only",
        glossaryAvailable: "Glossary Available",
        addTarget: "Add Target Language...",
        loading: "Loading translation system...",
        uploadTab: "Upload File",
        manualTab: "Manual Entry",
        dragDrop: "Drag and drop your glossary file here",
        clickUpload: "Click to upload",
        supportedFormats: "Supported: XLSX, CSV, JSON",
        manualTitle: "Manual Term Management",
        addTerm: "ADD",
        sourcePlaceholder: "e.g., Connector",
        targetPlaceholder: "e.g., Connecteur",
        pasteImport: "Paste & Import",
        glossaryTitle: "Glossary Integration",
        glossaryDesc: "Provide terminology to guide the YAI translation engine for pinpoint accuracy.",
        readyProcessing: "Ready for processing",
        activeTerms: "Active Glossary Terms",
        bulkImport: "BULK IMPORT",
        cancelBulk: "CANCEL BULK",
        noEntries: "No manual entries yet.",
        pastePlaceholder: "Paste list here...\nWord1, Word2\nWord3, Word4",
        importEntries: "IMPORT ENTRIES",
        readyTrans: "Ready for High-Precision Translation",
        transDescStart: "Synthesizing content from",
        transDescGlossary: "Applying specialized glossary",
        transDescStandard: "Using standard neural models for translation.",
        analyzing: "Analyzing...",
        initiateEngine: "INITIATE YAI ENGINE"
    });

    // Translate UI Text
    useEffect(() => {
        const translateUI = async () => {
            const keys = Object.keys(uiText);
            const values = Object.values(uiText);
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

    useEffect(() => {
        const fetchLangs = async () => {
            try {
                const labs = await document.getSupportedLanguages();
                // Map code to value, name to label
                const formatted = labs.map(l => ({ value: l.code, label: l.name }));
                setAvailableLanguages(formatted);

                // Set initial source if not set
                if (!sourceLang && formatted.length > 0) {
                    const defaultSource = formatted.find(l => l.value === "en") || formatted[0];
                    setSourceLang(defaultSource);

                    // Pre-select a target language if empty
                    if (targetLangs.length === 0 && defaultSource) {
                        const defaultTarget = formatted.find(l => (l.value === "zh-Hans" || l.value === "zh-hans") && l.value !== defaultSource.value);
                        if (defaultTarget) setTargetLangs([defaultTarget]);

                        const khmerTarget = formatted.find(l => l.value === "km" && l.value !== defaultSource.value);
                        if (khmerTarget) {
                            setTargetLangs(prev => {
                                if (prev.some(p => p.value === khmerTarget.value)) return prev;
                                return [...prev, khmerTarget];
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch languages:", error);
            } finally {
                setIsLoadingLangs(false);
            }
        };
        fetchLangs();
    }, []);

    useEffect(() => {
        const detectLanguage = async () => {
            if (instruction?.title?.text?.english && !detectedCode) {
                setIsDetecting(true);
                try {
                    const result = await document.detectLanguage(instruction.title.text.english);
                    if (result && result.code) {
                        let code = result.code.toLowerCase();

                        setDetectedCode(code);
                        const matched = availableLanguages.find(l => l.value === code);
                        if (matched) {
                            setSourceLang(matched);
                        }
                    }
                } catch (error) {
                    console.error("Language detection failed:", error);
                } finally {
                    setIsDetecting(false);
                }
            }
        };

        if (availableLanguages.length > 0) {
            detectLanguage();
        }
    }, [instruction, availableLanguages]);

    // Ensure Source is not in Target
    useEffect(() => {
        if (sourceLang && targetLangs.some(t => t.value === sourceLang.value)) {
            setTargetLangs(targetLangs.filter(t => t.value !== sourceLang.value));
        }
    }, [sourceLang, targetLangs]);

    const handleAddLanguage = (lang) => {
        if (!targetLangs.find(l => l.value === lang.value)) {
            setTargetLangs([...targetLangs, lang]);
        }
    };

    const handleRemoveLanguage = (val) => {
        if (targetLangs.length > 1) {
            setTargetLangs(targetLangs.filter(l => l.value !== val));
        }
    };

    const handleSwap = () => {
        if (targetLangs.length === 1) {
            const temp = sourceLang;
            setSourceLang(targetLangs[0]);
            setTargetLangs([temp]);
        }
    };

    if (isLoadingLangs) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">{uiText.loading}</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Config Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Source Column */}
                <div className="md:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Languages size={18} className="text-blue-600" /> {uiText.source}
                        </label>
                        {isDetecting && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider animate-pulse">
                                <Loader2 size={12} className="animate-spin" /> {uiText.detecting}
                            </div>
                        )}
                        {detectedCode && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 size={10} /> {uiText.detected}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <Select
                            value={sourceLang}
                            onChange={setSourceLang}
                            options={availableLanguages}
                            styles={customStyles}
                            className="text-lg font-semibold"
                            isSearchable={true}
                        />
                        <div className="mt-4 flex items-center gap-2">
                            {GLOSSARY_SUPPORTED.includes(sourceLang?.value) ? (
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest">{uiText.glossaryReady}</span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 uppercase tracking-widest">{uiText.genericOnly}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Swap / Decorator */}
                <div className="md:col-span-2 flex flex-col items-center justify-center">
                    <button
                        onClick={handleSwap}
                        disabled={targetLangs.length > 1}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${targetLangs.length === 1 ? "bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm hover:shadow-md cursor-pointer" : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"}`}
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                    <div className="h-full w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent my-4 hidden md:block" />
                </div>

                {/* Target Column */}
                <div className="md:col-span-5 space-y-4">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Globe size={18} className="text-indigo-600" /> {uiText.target}
                    </label>

                    <div className="space-y-3">
                        {/* Selected Targets */}
                        <div className="flex flex-wrap gap-2">
                            {targetLangs.map((lang) => (
                                <div key={lang.value} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 pl-3 pr-1 py-1 rounded-full group">
                                    <span className="text-xs font-bold text-indigo-700">{lang.label}</span>
                                    <button
                                        onClick={() => handleRemoveLanguage(lang.value)}
                                        className="p-1 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add More */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Select
                                placeholder={uiText.addTarget}
                                value={null}
                                onChange={handleAddLanguage}
                                options={availableLanguages.filter(l => !targetLangs.find(tl => tl.value === l.value) && l.value !== sourceLang?.value)}
                                styles={{
                                    ...customStyles,
                                    control: (base) => ({ ...base, border: "none", backgroundColor: "transparent", boxShadow: "none" })
                                }}
                                isSearchable={true}
                            />
                        </div>

                        <div className="flex gap-4">
                            {targetLangs.some(l => GLOSSARY_SUPPORTED.includes(l.value)) && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50/50 px-2 py-1 rounded">
                                    <Sparkles size={10} /> {targetLangs.filter(l => GLOSSARY_SUPPORTED.includes(l.value)).length} {uiText.glossaryAvailable}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Glossary Configuration */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-300 ${activeTab === 'manual' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className={activeTab === 'manual' ? "text-blue-600" : "text-emerald-600"}>
                                <Book size={20} />
                            </div>
                            {uiText.glossaryTitle}
                        </h3>
                        <p className="text-sm text-slate-500">{uiText.glossaryDesc}</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl self-start">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {uiText.uploadTab}
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {uiText.manualTab}
                        </button>
                    </div>
                </div>

                {activeTab === 'upload' ? (
                    <div className="flex items-center gap-4 w-full animate-in fade-in duration-500">
                        {glossaryFile && !glossaryFile.name.startsWith("manual_") ? (
                            <div className="flex items-center gap-4 bg-emerald-50 px-6 py-5 rounded-2xl border border-emerald-100 w-full group/file">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-base font-bold text-emerald-900">{glossaryFile.name}</span>
                                    <span className="text-xs text-emerald-600 uppercase font-bold">{(glossaryFile.size / 1024).toFixed(1)} KB • {uiText.readyProcessing}</span>
                                </div>
                                <button
                                    onClick={() => setGlossaryFile(null)}
                                    className="w-10 h-10 flex items-center justify-center text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-4 px-8 py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-100/80 hover:border-emerald-300 cursor-pointer transition-all w-full group">
                                <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                    <Upload size={28} className="text-slate-400 group-hover:text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-base font-bold text-slate-700 block group-hover:text-emerald-700">{uiText.dragDrop}</span>
                                    <span className="text-sm text-slate-400">{uiText.supportedFormats}</span>
                                </div>
                                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setGlossaryFile(e.target.files[0]);
                                        setActiveTab("upload");
                                    }
                                }} />
                            </label>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Manual Entry Form */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="md:col-span-12 lg:col-span-5 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {uiText.source} ({sourceLang?.label})
                                </label>
                                <input
                                    type="text"
                                    value={newTerm.source}
                                    onChange={(e) => setNewTerm({ ...newTerm, source: e.target.value })}
                                    placeholder={uiText.sourcePlaceholder}
                                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && (newTerm.source && newTerm.target) && (() => {
                                        setManualEntries([...manualEntries, { ...newTerm }]);
                                        setNewTerm({ source: "", target: "" });
                                    })()}
                                />
                            </div>
                            <div className="md:col-span-12 lg:col-span-5 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {uiText.target} ({targetLangs[0]?.label})
                                </label>
                                <input
                                    type="text"
                                    value={newTerm.target}
                                    onChange={(e) => setNewTerm({ ...newTerm, target: e.target.value })}
                                    placeholder={uiText.targetPlaceholder}
                                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium"
                                    onKeyDown={(e) => e.key === 'Enter' && (newTerm.source && newTerm.target) && (() => {
                                        setManualEntries([...manualEntries, { ...newTerm }]);
                                        setNewTerm({ source: "", target: "" });
                                    })()}
                                />
                            </div>
                            <div className="md:col-span-12 lg:col-span-2">
                                <button
                                    onClick={() => {
                                        if (newTerm.source.trim() && newTerm.target.trim()) {
                                            setManualEntries([...manualEntries, { ...newTerm }]);
                                            setNewTerm({ source: "", target: "" });
                                        }
                                    }}
                                    disabled={!newTerm.source || !newTerm.target}
                                    className="w-full px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> {uiText.addTerm}
                                </button>
                            </div>
                        </div>

                        {/* Valid Terms List */}
                        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                            <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-b border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{uiText.activeTerms} ({manualEntries.length})</span>
                                <button
                                    onClick={() => setShowPasteArea(!showPasteArea)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                                >
                                    {showPasteArea ? uiText.cancelBulk : uiText.bulkImport}
                                </button>
                            </div>

                            {showPasteArea && (
                                <div className="p-6 bg-blue-50/30 border-b border-slate-100 space-y-4 animate-in slide-in-from-top duration-300">
                                    <textarea
                                        value={pasteContent}
                                        onChange={(e) => setPasteContent(e.target.value)}
                                        placeholder={uiText.pastePlaceholder}
                                        className="w-full h-32 text-sm font-medium p-4 border border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 resize-none shadow-inner"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => {
                                                const rows = pasteContent.split(/\r?\n/).filter(r => r.trim());
                                                const newEntries = rows.map(row => {
                                                    let parts = row.split(",");
                                                    if (parts.length < 2) parts = row.split("\t");
                                                    if (parts.length < 2) parts = row.split("|");
                                                    return parts.length >= 2 ? { source: parts[0].trim(), target: parts[1].trim() } : null;
                                                }).filter(e => e !== null);
                                                setManualEntries(prev => [...prev, ...newEntries]);
                                                setPasteContent("");
                                                setShowPasteArea(false);
                                            }}
                                            className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-all shadow-md"
                                        >
                                            {uiText.importEntries}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-64 overflow-y-auto">
                                {manualEntries.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 space-y-2">
                                        <div className="mx-auto opacity-20">
                                            <Book size={32} />
                                        </div>
                                        <p className="text-sm font-medium">{uiText.noEntries}</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3">{uiText.source}</th>
                                                <th className="px-6 py-3">{uiText.target}</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {manualEntries.map((entry, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{entry.source}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">{entry.target}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => setManualEntries(manualEntries.filter((_, i) => i !== idx))}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Final Action Summary */}
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />

                <div className="flex items-start gap-4 z-10">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white tracking-tight">
                            {uiText.readyTrans}
                        </p>
                        <p className="text-blue-100/80 text-sm mt-1 max-w-xl font-medium">
                            {uiText.transDescStart} <span className="text-white font-bold underline decoration-blue-400/50">{sourceLang?.label}</span> to <span className="text-white font-bold underline decoration-indigo-300/50">{targetLangs.map(l => l.label).join(", ")}</span>.
                            {glossaryFile ? ` ${uiText.transDescGlossary} "${glossaryFile.name}" for contextual accuracy.` : ` ${uiText.transDescStandard}`}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onNext}
                    disabled={targetLangs.length === 0 || isDetecting}
                    className={`shrink-0 px-8 py-4 text-sm font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 uppercase tracking-wider group/btn 
                        ${targetLangs.length === 0 || isDetecting
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-white text-blue-600 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"}`}
                >
                    {isDetecting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            {uiText.analyzing}
                        </>
                    ) : (
                        <>
                            {uiText.initiateEngine}
                            <ArrowRightLeft size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LanguageConfig;