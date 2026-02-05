/**
 * DocumentIntelligenceFlow.jsx
 * Main orchestrator for the Document Intelligence extraction flow
 * Stages: Upload → Extracting → Preview/Select → Mining → Complete
 */

import React, { useState, useCallback } from "react";
import UploadStage from "./UploadStage";
import ExtractionProgress from "./ExtractionProgress";
import PagePreviewPanel from "./PagePreviewPanel";
import MiningProgress from "./MiningProgress";
import "./DocumentIntelligenceFlow.css";

import { API_BASE_URL } from "../../../../../config";

const STAGES = {
    UPLOAD: "upload",
    PREVIEW: "preview",
    EXTRACTING: "extracting",
    MINING: "mining",
    COMPLETE: "complete"
};

export default function DocumentIntelligenceFlow({ onMiningComplete }) {
    const [stage, setStage] = useState(STAGES.UPLOAD);
    const [jobId, setJobId] = useState(null);
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("km");
    const [domain, setDomain] = useState("Garment Industry");
    const [pages, setPages] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]);
    const [error, setError] = useState(null);

    // Handle upload complete - move to preview immediately
    const handleUploadComplete = useCallback((data) => {
        setJobId(data.jobId);
        setPages(data.pages || []);
        // Default to selecting only the first page
        const firstPage = (data.pages || [])[0]?.pageNumber || 1;
        setSelectedPages([firstPage]);
        setStage(STAGES.PREVIEW);
    }, []);

    // Unified function to start the actual mining (chunking + LLM processing)
    const initiateMining = useCallback(async () => {
        setStage(STAGES.MINING);
        setError(null);

        try {
            // 1. Create chunks
            const chunkRes = await fetch(`${API_BASE_URL}/api/documents/${jobId}/chunk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maxTokens: 1800 })
            });

            const chunkData = await chunkRes.json();
            if (!chunkRes.ok) throw new Error(chunkData.message || chunkData.error || "Failed to create chunks");

            // 2. Start processing
            const processRes = await fetch(`${API_BASE_URL}/api/documents/${jobId}/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceLang, targetLang, domain })
            });

            const processData = await processRes.json();
            if (!processRes.ok) throw new Error(processData.message || processData.error || "Failed to start processing");

        } catch (err) {
            setError(err.message);
            setStage(STAGES.PREVIEW); // Revert to preview if mining fails to start
        }
    }, [jobId, sourceLang, targetLang, domain]);

    // Handle extraction complete - return to preview so user can see raw data
    const handleExtractionComplete = useCallback(async (data) => {
        if (data.pages) {
            setPages(data.pages);
        }
        setStage(STAGES.PREVIEW);
    }, []);

    // Handle start mining (User clicked the button)
    const handleStartMining = useCallback(async () => {
        if (!jobId || selectedPages.length === 0) return;

        // Check if any selected pages still need extraction
        const selectedPageData = pages.filter(p => selectedPages.includes(p.pageNumber));
        const needsExtraction = selectedPageData.some(p => !p.charCount || p.charCount === 0);

        if (!needsExtraction) {
            // If everything is already extracted, go straight to mining
            await initiateMining();
            return;
        }

        // Otherwise, trigger Azure DI extraction first
        try {
            const extractRes = await fetch(`${API_BASE_URL}/api/documents/${jobId}/extract`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selectedPages })
            });

            const extractData = await extractRes.json();
            if (!extractRes.ok) throw new Error(extractData.message || extractData.error || "Failed to start extraction");

            setStage(STAGES.EXTRACTING);
        } catch (err) {
            setError(err.message);
        }
    }, [jobId, selectedPages, pages, initiateMining]);

    // Handle mining complete
    const handleMiningComplete = useCallback((batchId) => {
        setStage(STAGES.COMPLETE);
        if (onMiningComplete) {
            onMiningComplete(batchId);
        }
    }, [onMiningComplete]);

    // Handle page selection change
    const handleSelectionChange = useCallback(async (newSelection) => {
        setSelectedPages(newSelection);

        if (jobId) {
            try {
                await fetch(`${API_BASE_URL}/api/documents/${jobId}/pages/selection`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ selectedPages: newSelection })
                });
            } catch (err) {
                console.error("Failed to update selection:", err);
            }
        }
    }, [jobId]);

    // Reset flow
    const handleReset = useCallback(() => {
        setStage(STAGES.UPLOAD);
        setJobId(null);
        setPages([]);
        setSelectedPages([]);
        setError(null);
    }, []);

    return (
        <div className="w-full">
            {/* Stage Content */}
            {error && (
                <div className="max-w-4xl mx-auto mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex justify-between items-center text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span className="font-medium">{error}</span>
                    </span>
                    <button onClick={() => setError(null)} className="hover:bg-red-100 dark:hover:bg-red-900/50 p-1 rounded">Dismiss</button>
                </div>
            )}

            {/* Stage Content */}
            <div className="min-h-[400px]">
                {stage === STAGES.UPLOAD && (
                    <UploadStage
                        sourceLang={sourceLang}
                        targetLang={targetLang}
                        domain={domain}
                        onSourceLangChange={setSourceLang}
                        onTargetLangChange={setTargetLang}
                        onDomainChange={setDomain}
                        onUploadComplete={handleUploadComplete}
                    />
                )}

                {/* ... other stages ... */}

                {stage === STAGES.EXTRACTING && (
                    <div className="max-w-2xl mx-auto py-12">
                        <ExtractionProgress
                            jobId={jobId}
                            onComplete={handleExtractionComplete}
                            onError={(err) => setError(err)}
                        />
                    </div>
                )}

                {stage === STAGES.PREVIEW && (
                    <PagePreviewPanel
                        jobId={jobId}
                        pages={pages}
                        selectedPages={selectedPages}
                        onSelectionChange={handleSelectionChange}
                        onStartMining={handleStartMining}
                        sourceLang={sourceLang}
                        targetLang={targetLang}
                    />
                )}

                {stage === STAGES.MINING && (
                    <div className="max-w-2xl mx-auto py-12">
                        <MiningProgress
                            jobId={jobId}
                            onComplete={handleMiningComplete}
                            onError={(err) => setError(err)}
                        />
                    </div>
                )}

                {stage === STAGES.COMPLETE && (
                    <div className="max-w-md mx-auto text-center py-16">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-green-500/20">
                            ✓
                        </div>
                        <h3 className="text-2xl font-bold translator-text-foreground mb-3">Mining Complete!</h3>
                        <p className="translator-muted-foreground mb-8">
                            Your terms have been successfully extracted and are ready for expert review.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 font-medium translator-text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={handleReset}>
                                Mine Another
                            </button>
                            <button
                                className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
                                onClick={() => onMiningComplete && onMiningComplete(jobId)}
                            >
                                View Results
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
