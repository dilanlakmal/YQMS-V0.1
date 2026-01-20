
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Check, AlertCircle, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { API_BASE_URL } from "../../../config";

export default function TranslationEditor({
    sourceFile,
    targetFile,
    sourceLang,
    targetLang,
    domain: initialDomain,
    onClose
}) {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [project, setProject] = useState(sourceFile?.originalName || sourceFile?.name || "OnlineEditor");
    const [learning, setLearning] = useState(false);
    const [learnResult, setLearnResult] = useState(null);
    const [domain, setDomain] = useState(initialDomain || "Garment Industry");

    // Fetch alignment when component mounts
    useEffect(() => {
        fetchAlignment();
    }, [sourceFile, targetFile]);

    const fetchAlignment = async () => {
        try {
            setLoading(true);

            // Pass file metadata to backend for server-side extraction
            const response = await fetch(`${API_BASE_URL}/api/glossaries/align`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceFile,
                    targetFile,
                    sourceLang,
                    targetLang
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Alignment failed");

            setSegments(data.alignment || []);

        } catch (err) {
            console.error("Alignment Load Error:", err);
            setError("Failed to load aligned content. " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSegmentChange = (id, newTarget) => {
        setSegments(prev => prev.map(s =>
            s.id === id ? { ...s, target: newTarget, isDirty: true } : s
        ));
    };

    const saveSegment = async (segment) => {
        if (!segment.isDirty) return;

        setSavingId(segment.id);
        try {
            const response = await fetch(`${API_BASE_URL}/api/glossaries/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceSegment: segment.source,
                    newTarget: segment.target,
                    sourceLang,
                    targetLang,
                    project
                })
            });

            if (response.ok) {
                setSegments(prev => prev.map(s =>
                    s.id === segment.id ? { ...s, isDirty: false, lastSaved: true } : s
                ));
                // Clear success indicator after 2s
                setTimeout(() => {
                    setSegments(prev => prev.map(s =>
                        s.id === segment.id ? { ...s, lastSaved: false } : s
                    ));
                }, 2000);
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save correction logic.");
        } finally {
            setSavingId(null);
        }
    };

    // Bulk learn from entire document
    const learnFromDocuments = async () => {
        setLearning(true);
        setLearnResult(null);
        try {
            // Combine all source and target text
            const sourceText = segments.map(s => s.source).join('\n\n');
            const targetText = segments.map(s => s.target).join('\n\n');

            const response = await fetch(`${API_BASE_URL}/api/glossaries/learn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceText,
                    targetText,
                    sourceLang,
                    targetLang,
                    project: project,
                    domain: domain
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Learning failed");

            setLearnResult(data);
            console.log("Learning result:", data);
        } catch (err) {
            console.error("Learn Error:", err);
            alert("Failed to extract glossary terms: " + err.message);
        } finally {
            setLearning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-500">Aligning documents with AI...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Alignment Failed</h3>
                <p className="text-gray-500 mt-2">{error}</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden fixed inset-0 z-50 m-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Translation Editor</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{sourceLang} → {targetLang}</p>
                            <span className="text-[10px] text-gray-400">|</span>
                            <select
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="text-xs bg-transparent border-none p-0 text-blue-600 dark:text-blue-400 font-medium focus:ring-0 cursor-pointer"
                            >
                                <option value="Garment Industry">Garment Industry</option>
                                <option value="General">General</option>
                                <option value="Legal">Legal</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Building">Building</option>
                                <option value="Medical">Medical</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Learn Result Badge */}
                    {learnResult && (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1">
                            <Sparkles size={12} />
                            {learnResult.termsAdded} terms learned!
                        </span>
                    )}

                    {/* Finalize & Learn Button */}
                    <button
                        onClick={learnFromDocuments}
                        disabled={learning}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-md"
                    >
                        {learning ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <BookOpen size={16} />
                                Finalize & Learn
                            </>
                        )}
                    </button>

                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        AI Powered Alignment
                    </span>
                </div>
            </div>

            {/* Editor Grid */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
                <div className="max-w-5xl mx-auto space-y-4">
                    {segments.map((segment) => (
                        <div key={segment.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                            {/* Source */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                                {segment.source}
                            </div>

                            {/* Target (Editable) */}
                            <div className="relative">
                                <textarea
                                    className={`w-full h-full min-h-[80px] p-3 rounded border focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-transparent
                                ${segment.isDirty ? 'border-amber-300 dark:border-amber-700' : 'border-gray-300 dark:border-gray-700'}
                            `}
                                    value={segment.target}
                                    onChange={(e) => handleSegmentChange(segment.id, e.target.value)}
                                    onBlur={() => saveSegment(segment)} // Auto-save on blur
                                />

                                {/* Status Indicator */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                    {savingId === segment.id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                    {segment.lastSaved && <Check className="w-4 h-4 text-green-500" />}
                                    {segment.isDirty && !savingId && (
                                        <button
                                            onClick={() => saveSegment(segment)}
                                            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                            title="Save to improve glossary"
                                        >
                                            <Save size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
