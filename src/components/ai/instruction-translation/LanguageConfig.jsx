
import { useState, useEffect } from "react";
import Select from "react-select";
import { ArrowRightLeft, Languages, Sparkles, Loader2, Globe, X, CheckCircle2 } from "lucide-react";
import { document } from "@/services/instructionService";
import { useTranslate } from "@/hooks/useTranslate";

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

    // Translation Hook
    const { translate, translateBatch, userLang } = useTranslate();

    // UI Text State
    const [uiText, setUiText] = useState({
        source: "SOURCE",
        target: "TARGET",
        detecting: "Detecting...",
        detected: "Detected",
        addTarget: "Add Target Language...",
        loading: "Loading translation system...",
        readyTrans: "Ready for High-Precision Translation",
        transDescStart: "Synthesizing content from",
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
                const formatted = labs.map(l => ({ value: l.code, label: l.name }));
                setAvailableLanguages(formatted);

                // Determine the best source language
                let bestSource = null;

                // 1. Priority: Instruction's detected language (always override if present)
                if (instruction?.detectedLanguage) {
                    const targetCode = instruction.detectedLanguage;
                    // Try exact match then case-insensitive match
                    bestSource = formatted.find(l => l.value === targetCode) ||
                        formatted.find(l => l.value.toLowerCase() === targetCode.toLowerCase());
                }

                // 2. Priority: Current selection (if no detected language)
                if (!bestSource && sourceLang) {
                    bestSource = sourceLang;
                }

                // 3. Priority: Fallback to English or first available
                if (!bestSource) {
                    bestSource = formatted.find(l => l.value === "en") || formatted[0];
                }

                // Apply the resolved source language
                if (bestSource) {
                    setSourceLang(bestSource);

                    // Pre-select targets logic (only if targets are empty)
                    if (targetLangs.length === 0) {
                        const defaultTarget = formatted.find(l => (l.value === "zh-Hans" || l.value === "zh-hans") && l.value !== bestSource.value);
                        if (defaultTarget) setTargetLangs([defaultTarget]);

                        const khmerTarget = formatted.find(l => l.value === "km" && l.value !== bestSource.value);
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
        // Re-run if instruction details change to ensure we catch the detected language
    }, [instruction?.detectedLanguage]);

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
                    </div>
                </div>
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
                            {uiText.transDescStart} <span className="text-white font-bold underline decoration-blue-400/50">{sourceLang?.label}</span> to <span className="text-white font-bold underline decoration-indigo-300/50">{targetLangs.map(l => l.label).join(", ")}</span>. {uiText.transDescStandard}
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