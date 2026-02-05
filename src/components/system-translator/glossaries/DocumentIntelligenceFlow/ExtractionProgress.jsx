/**
 * ExtractionProgress.jsx
 * Stage 2: Show Azure Document Intelligence extraction progress
 */

import React, { useEffect, useState } from "react";
import { Scan, FileText, CheckCircle, XCircle } from "lucide-react";

import { API_BASE_URL } from "../../../../../config";

export default function ExtractionProgress({ jobId, onComplete, onError }) {
    const [status, setStatus] = useState("extracting");
    const [pageCount, setPageCount] = useState(0);
    const [method, setMethod] = useState("");

    useEffect(() => {
        if (!jobId) return;

        const pollStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/documents/${jobId}/status`);
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error || "Failed to get status");
                }

                const job = data.job;
                setStatus(job.status);
                setPageCount(job.pageCount || 0);
                setMethod(job.extractionMethod || "");

                if (job.status === "extracted") {
                    // Fetch pages and complete
                    const pagesRes = await fetch(`${API_BASE_URL}/api/documents/${jobId}/pages`);
                    const pagesData = await pagesRes.json();

                    onComplete({
                        pages: pagesData.pages || [],
                        pageCount: pagesData.pageCount,
                        totalTokenEstimate: pagesData.totalTokenEstimate
                    });
                    return true; // Stop polling
                }

                if (job.status === "failed") {
                    onError(job.errorMessage || "Extraction failed");
                    return true; // Stop polling
                }

                return false; // Continue polling
            } catch (err) {
                onError(err.message);
                return true; // Stop polling
            }
        };

        // Initial poll
        pollStatus();

        // Set up interval
        const interval = setInterval(async () => {
            const shouldStop = await pollStatus();
            if (shouldStop) {
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, onComplete, onError]);

    return (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl border translator-border shadow-sm max-w-lg mx-auto">
            <div className="mb-6 flex justify-center">
                {status === "extracting" && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <Scan className="w-16 h-16 text-primary animate-pulse relative z-10" />
                    </div>
                )}
                {status === "extracted" && (
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                )}
                {status === "failed" && (
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
                        <XCircle className="w-8 h-8" />
                    </div>
                )}
            </div>

            <h3 className="text-xl font-semibold translator-text-foreground mb-6">
                {status === "extracting" && "Analyzing Document Structure..."}
                {status === "extracted" && "Extraction Complete!"}
                {status === "failed" && "Extraction Failed"}
            </h3>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 border translator-border text-left">
                <div className="flex justify-between items-center py-2 border-b translator-border last:border-0 border-dashed">
                    <span className="text-sm translator-muted-foreground">Status</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${status === 'extracted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>

                {pageCount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b translator-border last:border-0 border-dashed">
                        <span className="text-sm translator-muted-foreground">Pages Detected</span>
                        <span className="text-sm font-medium translator-text-foreground">{pageCount}</span>
                    </div>
                )}

                {method && (
                    <div className="flex justify-between items-center py-2 border-b translator-border last:border-0 border-dashed">
                        <span className="text-sm translator-muted-foreground">Method</span>
                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded translator-text-foreground">
                            {method === "azure-di" ? "Azure AI Service" :
                                method === "pdf-parse" ? "Digital PDF Parser" :
                                    method === "mammoth" ? "DOCX Extractor" : method}
                        </span>
                    </div>
                )}
            </div>

            {status === "extracting" && (
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full animate-[indeterminate_1.5s_infinite_ease-in-out] w-1/2 origin-left"></div>
                </div>
            )}

            <p className="text-sm translator-muted-foreground">
                {status === "extracting" &&
                    "Extracting layout, tables, and paragraphs..."
                }
            </p>
        </div>
    );
}
