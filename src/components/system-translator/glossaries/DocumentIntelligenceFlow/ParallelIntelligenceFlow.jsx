/**
 * ParallelIntelligenceFlow.jsx
 * Orchestrator for Parallel Document Intelligence flow
 * Stages: Upload (Dual) → Preview (Dual) → Parallel Mining
 */

import React, { useState, useCallback, useMemo } from "react";
import UploadStage from "./UploadStage";
import ExtractionProgress from "./ExtractionProgress";
import PagePreviewPanel from "./PagePreviewPanel";
import MiningProgress from "./MiningProgress";
import { ArrowRightLeft, Files, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const STAGES = {
    UPLOAD: "upload",
    PREVIEW: "preview",
    EXTRACTING: "extracting",
    MINING: "mining",
    COMPLETE: "complete"
};

export default function ParallelIntelligenceFlow({ onMiningComplete }) {
    const [stage, setStage] = useState(STAGES.UPLOAD);
    const [sourceJob, setSourceJob] = useState(null);
    const [targetJob, setTargetJob] = useState(null);

    // Joint settings
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("km");
    const [domain, setDomain] = useState("Garment Industry");

    // Detailed page data
    const [sourcePages, setSourcePages] = useState([]);
    const [targetPages, setTargetPages] = useState([]);
    const [sourceSelection, setSourceSelection] = useState([]);
    const [targetSelection, setTargetSelection] = useState([]);

    const [activeDoc, setActiveDoc] = useState("source"); // 'source' or 'target'
    const [error, setError] = useState(null);
    const [miningJobId, setMiningJobId] = useState(null); // We use sourceJobId as the primary tracker for mining progress if needed

    // Handle source upload
    const handleSourceUpload = useCallback((data) => {
        setSourceJob(data);
        setSourcePages(data.pages || []);
        const firstPage = (data.pages || [])[0]?.pageNumber || 1;
        setSourceSelection([firstPage]);
        if (targetJob) setStage(STAGES.PREVIEW);
    }, [targetJob]);

    // Handle target upload
    const handleTargetUpload = useCallback((data) => {
        setTargetJob(data);
        setTargetPages(data.pages || []);
        const firstPage = (data.pages || [])[0]?.pageNumber || 1;
        setTargetSelection([firstPage]);
        if (sourceJob) setStage(STAGES.PREVIEW);
    }, [sourceJob]);

    // Simplified Mining Trigger for Parallel
    const initiateParallelMining = useCallback(async () => {
        setStage(STAGES.MINING);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/parallel-mine`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceJobId: sourceJob.jobId,
                    targetJobId: targetJob.jobId,
                    sourceLang,
                    targetLang,
                    domain
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Failed to start parallel mining");

            // For parallel, we use the returned batchId or use the result directly
            if (onMiningComplete) {
                onMiningComplete(data);
            }
            setStage(STAGES.COMPLETE);
        } catch (err) {
            setError(err.message);
            setStage(STAGES.PREVIEW);
        }
    }, [sourceJob, targetJob, sourceLang, targetLang, domain, onMiningComplete]);

    const handleStartExtraction = useCallback(async () => {
        try {
            // Check which jobs need extraction for selected pages
            const sourceNeeds = sourcePages.filter(p => sourceSelection.includes(p.pageNumber)).some(p => !p.charCount);
            const targetNeeds = targetPages.filter(p => targetSelection.includes(p.pageNumber)).some(p => !p.charCount);

            if (!sourceNeeds && !targetNeeds) {
                await initiateParallelMining();
                return;
            }

            // Trigger extraction for both if needed
            const promises = [];
            if (sourceNeeds) {
                promises.push(fetch(`${API_BASE_URL}/api/documents/${sourceJob.jobId}/extract`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ selectedPages: sourceSelection })
                }));
            }
            if (targetNeeds) {
                promises.push(fetch(`${API_BASE_URL}/api/documents/${targetJob.jobId}/extract`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ selectedPages: targetSelection })
                }));
            }

            await Promise.all(promises);
            setStage(STAGES.EXTRACTING);
        } catch (err) {
            setError(err.message);
        }
    }, [sourceJob, targetJob, sourcePages, targetPages, sourceSelection, targetSelection, initiateParallelMining]);

    const handleExtractionComplete = useCallback((data) => {
        // We'll just refresh both page lists to be safe
        const refreshPages = async () => {
            const [sRes, tRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/documents/${sourceJob.jobId}/pages`),
                fetch(`${API_BASE_URL}/api/documents/${targetJob.jobId}/pages`)
            ]);
            const sData = await sRes.json();
            const tData = await tRes.json();
            if (sData.success) setSourcePages(sData.pages);
            if (tData.success) setTargetPages(tData.pages);
            setStage(STAGES.PREVIEW);
        };
        refreshPages();
    }, [sourceJob, targetJob]);

    const handleReset = () => {
        setSourceJob(null);
        setTargetJob(null);
        setSourcePages([]);
        setTargetPages([]);
        setStage(STAGES.UPLOAD);
    };

    return (
        <div className="w-full">
            {error && (
                <div className="max-w-4xl mx-auto mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex justify-between items-center text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span className="font-medium">{error}</span>
                    </span>
                    <button onClick={() => setError(null)} className="hover:bg-red-100 dark:hover:bg-red-900/50 p-1 rounded">Dismiss</button>
                </div>
            )}

            <div className="min-h-[400px]">
                {stage === STAGES.UPLOAD && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className={`p-1 rounded-xl transition-all ${sourceJob ? 'bg-green-500/10' : ''}`}>
                                <UploadStage
                                    sourceLang={sourceLang}
                                    targetLang={targetLang}
                                    domain={domain}
                                    onSourceLangChange={setSourceLang}
                                    onTargetLangChange={setTargetLang}
                                    onDomainChange={setDomain}
                                    onUploadComplete={handleSourceUpload}
                                    title="1. Source Document"
                                />
                            </div>
                            <div className={`p-1 rounded-xl transition-all ${targetJob ? 'bg-green-500/10' : ''}`}>
                                <UploadStage
                                    sourceLang={sourceLang}
                                    targetLang={targetLang}
                                    domain={domain}
                                    onSourceLangChange={setSourceLang}
                                    onTargetLangChange={setTargetLang}
                                    onDomainChange={setDomain}
                                    onUploadComplete={handleTargetUpload}
                                    title="2. Target (Translated) Document"
                                />
                            </div>
                        </div>
                        {(!sourceJob || !targetJob) && (
                            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <p className="text-blue-600 dark:text-blue-400 font-medium">
                                    Please upload both files to proceed with Parallel Document Intelligence.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {stage === STAGES.EXTRACTING && (
                    <div className="max-w-2xl mx-auto py-12">
                        <ExtractionProgress
                            jobId={sourceJob.jobId} // We just monitor one side or both? 
                            // Let's just monitor source, the logic is similar
                            onComplete={handleExtractionComplete}
                            onError={(err) => setError(err)}
                        />
                    </div>
                )}

                {stage === STAGES.PREVIEW && (
                    <div className="space-y-6">
                        {/* Doc Switcher */}
                        <div className="flex justify-center">
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveDoc("source")}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeDoc === "source"
                                        ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                                        : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <Files size={16} />
                                    Source View
                                </button>
                                <button
                                    onClick={() => setActiveDoc("target")}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeDoc === "target"
                                        ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                                        : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <ArrowRightLeft size={16} />
                                    Target View
                                </button>
                            </div>
                        </div>

                        {activeDoc === "source" ? (
                            <PagePreviewPanel
                                jobId={sourceJob.jobId}
                                pages={sourcePages}
                                selectedPages={sourceSelection}
                                onSelectionChange={setSourceSelection}
                                onStartMining={handleStartExtraction}
                                sourceLang={sourceLang}
                                targetLang={targetLang}
                                isParallel={true}
                                otherDocAnalyzed={targetPages.filter(p => targetSelection.includes(p.pageNumber)).every(p => p.charCount > 0)}
                            />
                        ) : (
                            <PagePreviewPanel
                                jobId={targetJob.jobId}
                                pages={targetPages}
                                selectedPages={targetSelection}
                                onSelectionChange={setTargetSelection}
                                onStartMining={handleStartExtraction}
                                sourceLang={sourceLang}
                                targetLang={targetLang}
                                isParallel={true}
                                otherDocAnalyzed={sourcePages.filter(p => sourceSelection.includes(p.pageNumber)).every(p => p.charCount > 0)}
                            />
                        )}
                    </div>
                )}

                {stage === STAGES.MINING && (
                    <div className="max-w-2xl mx-auto py-12 text-center">
                        <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold mb-2">Aligning & Mining Parallel Terms</h3>
                        <p className="text-gray-500 mb-6">Cross-referencing selected pages from both documents to find accurate bilingual pairs.</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full animate-[loading_2s_infinite]"></div>
                        </div>
                    </div>
                )}

                {stage === STAGES.COMPLETE && (
                    <div className="max-w-md mx-auto text-center py-16">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            ✓
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Parallel Mining Complete!</h3>
                        <p className="text-gray-500 mb-8">
                            Bilingual terms have been successfully extracted from your parallel documents.
                        </p>
                        <button className="px-8 py-3 bg-primary text-white rounded-lg font-medium" onClick={handleReset}>
                            Start New Parallel Mining
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
