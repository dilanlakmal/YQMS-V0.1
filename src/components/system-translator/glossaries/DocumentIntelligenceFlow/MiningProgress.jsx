/**
 * MiningProgress.jsx
 * Stage 4: Show AI mining progress with chunk-by-chunk status
 */

import React, { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

import { API_BASE_URL } from "../../../../../config";

export default function MiningProgress({ jobId, onComplete, onError }) {
    const [progress, setProgress] = useState({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalChunks: 0,
        termsExtracted: 0,
        percentComplete: 0,
        isComplete: false
    });

    useEffect(() => {
        if (!jobId) return;

        const pollProgress = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/documents/${jobId}/process/status`);
                const data = await res.json();

                if (!data.success) {
                    // Mining not started yet - might be chunking
                    return false;
                }

                setProgress({
                    pending: data.status?.pending || 0,
                    processing: data.status?.processing || 0,
                    completed: data.status?.completed || 0,
                    failed: data.status?.failed || 0,
                    totalChunks: data.totalChunks || 0,
                    termsExtracted: data.termsExtracted || 0,
                    percentComplete: data.percentComplete || 0,
                    isComplete: data.isComplete || false
                });

                if (data.isComplete) {
                    onComplete(jobId);
                    return true; // Stop polling
                }

                return false; // Continue polling
            } catch (err) {
                console.error("Poll error:", err);
                return false; // Continue polling
            }
        };

        // Initial poll
        pollProgress();

        // Set up interval (every 2 seconds)
        const interval = setInterval(async () => {
            const shouldStop = await pollProgress();
            if (shouldStop) {
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, onComplete, onError]);

    const remainingChunks = progress.totalChunks - progress.completed;
    const estimatedMinutesRemaining = Math.ceil(remainingChunks * 1.1);

    return (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl border translator-border shadow-sm max-w-xl mx-auto">
            <div className="mb-6 flex justify-center">
                {progress.isComplete ? (
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <BrainCircuit className="w-16 h-16 text-primary animate-pulse relative z-10" />
                    </div>
                )}
            </div>

            <h3 className="text-xl font-semibold translator-text-foreground mb-6">
                {progress.isComplete ? "Mining Complete!" : "AI Mining in Progress..."}
            </h3>

            {/* Progress Bar */}
            <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-primary">{progress.percentComplete}% Complete</span>
                <span className="translator-muted-foreground">{progress.completed} / {progress.totalChunks} Chunks</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-8 overflow-hidden">
                <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentComplete}%` }}
                ></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border translator-border text-center">
                    <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Processed</span>
                    <span className="block text-2xl font-bold translator-text-foreground">{progress.completed}</span>
                </div>
                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
                    <span className="block text-xs uppercase tracking-wider text-primary font-bold mb-1">Terms Found</span>
                    <span className="block text-2xl font-bold text-primary">{progress.termsExtracted}</span>
                </div>
            </div>

            {(progress.processing > 0 || progress.failed > 0) && (
                <div className="flex justify-center gap-6 text-sm mb-6">
                    {progress.processing > 0 && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing {progress.processing} chunk(s)</span>
                        </div>
                    )}
                    {progress.failed > 0 && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{progress.failed} failed</span>
                        </div>
                    )}
                </div>
            )}

            {/* ETA */}
            {!progress.isComplete && remainingChunks > 0 && (
                <p className="text-sm font-mono text-gray-400 bg-gray-50 dark:bg-gray-900 py-2 px-4 rounded-lg inline-block">
                    Estimated time remaining: ~{estimatedMinutesRemaining} min
                </p>
            )}

            {/* Processing hint */}
            {!progress.isComplete && (
                <p className="text-sm translator-muted-foreground mt-6 animate-pulse">
                    Extracting domain-specific terminology from your document...
                </p>
            )}
        </div>
    );
}
