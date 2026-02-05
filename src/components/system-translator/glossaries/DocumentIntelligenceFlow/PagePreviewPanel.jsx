/**
 * PagePreviewPanel.jsx
 * Stage 3: Document preview with page selection and token estimation
 * Three-column layout similar to Azure Document Intelligence Studio
 */

import React, { useState, useMemo } from "react";
import { FileText, Check, AlertTriangle, XCircle, BrainCircuit, Loader2 } from "lucide-react";

import { API_BASE_URL } from "../../../../../config";

export default function PagePreviewPanel({
    jobId,
    pages,
    selectedPages,
    onSelectionChange,
    onStartMining,
    sourceLang,
    targetLang
}) {
    const [activePage, setActivePage] = useState(pages[0]?.pageNumber || 1);
    const [fullPageText, setFullPageText] = useState({});
    const [loadingPage, setLoadingPage] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Calculate token stats
    const stats = useMemo(() => {
        const selectedPagesData = pages.filter(p => selectedPages.includes(p.pageNumber));
        const totalTokens = selectedPagesData.reduce((sum, p) => sum + p.tokenEstimate, 0);
        const totalChars = selectedPagesData.reduce((sum, p) => sum + p.charCount, 0);

        const SAFE_CHUNK_SIZE = 1800;
        const estimatedChunks = Math.ceil(totalTokens / SAFE_CHUNK_SIZE);
        const estimatedMinutes = Math.ceil(estimatedChunks * 1.1);

        const needsExtraction = selectedPagesData.length > 0 && selectedPagesData.some(p => !p.charCount || p.charCount === 0);
        const isExtracted = selectedPagesData.length > 0 && !needsExtraction;

        return {
            selectedCount: selectedPagesData.length,
            totalPages: pages.length,
            totalTokens,
            totalChars,
            estimatedChunks,
            estimatedMinutes,
            isExtracted,
            needsExtraction,
            isLarge: totalTokens > 50000,
            isVeryLarge: totalTokens > 100000
        };
    }, [pages, selectedPages]);

    // Toggle page selection
    const togglePage = (pageNum) => {
        if (selectedPages.includes(pageNum)) {
            onSelectionChange(selectedPages.filter(p => p !== pageNum));
        } else {
            onSelectionChange([...selectedPages, pageNum]);
        }
    };

    // Select all / clear all
    const handleSelectAll = () => onSelectionChange(pages.map(p => p.pageNumber));
    const handleClearAll = () => onSelectionChange([]);

    // Get full page content
    const getFullPageText = async (pageNum) => {
        if (fullPageText[pageNum]) return fullPageText[pageNum];

        setLoadingPage(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/documents/${jobId}/pages/${pageNum}`);
            const data = await res.json();
            if (data.success && data.page) {
                setFullPageText(prev => ({ ...prev, [pageNum]: data.page }));
                return data.page.cleanText;
            }
        } catch (err) {
            console.error("Failed to load page:", err);
        } finally {
            setLoadingPage(false);
        }
        return pages.find(p => p.pageNumber === pageNum)?.text || "";
    };

    // Handle page click
    const handlePageClick = async (pageNum) => {
        setActivePage(pageNum);
        if (stats.isExtracted) {
            await getFullPageText(pageNum);
        }
    };

    const activePageData = useMemo(() => {
        const baseData = pages.find(p => p.pageNumber === activePage);
        const fullData = fullPageText[activePage];

        if (fullData) {
            return { ...baseData, ...fullData };
        }
        return baseData;
    }, [pages, activePage, fullPageText]);

    const activeText = activePageData?.cleanText || activePageData?.preview || "";

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] min-h-[600px] border translator-border bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm overflow-hidden font-sans">
            {/* Top Toolbar (Azure Style) */}
            <div className="flex items-center justify-between px-4 py-2 border-b translator-border bg-white dark:bg-[#252526]">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-lg text-translator-text-foreground">OCR/Read</h3>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                    <button
                        onClick={onStartMining}
                        disabled={stats.selectedCount === 0 || stats.isVeryLarge}
                        className={`flex items-center gap-2 px-6 py-1.5 rounded-sm text-sm font-semibold transition-all shadow-sm ${!stats.isExtracted
                            ? 'bg-[#0078d4] hover:bg-[#106ebe] text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <BrainCircuit size={16} />
                        {!stats.isExtracted ? "Run Analysis (Extract)" : "Extract to Glossary"}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Thumbnails */}
                <div className="w-[240px] flex flex-col border-r translator-border bg-[#f3f2f1] dark:bg-[#252526]">
                    <div className="p-2 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b translator-border">
                        <span>Pages ({pages.length})</span>
                        <div className="flex gap-1">
                            <button onClick={handleSelectAll} className="hover:text-primary px-1">All</button>
                            <button onClick={handleClearAll} className="hover:text-primary px-1">None</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {pages.map(page => (
                            <div
                                key={page.pageNumber}
                                className={`relative group cursor-pointer p-2 rounded border-2 transition-all ${activePage === page.pageNumber
                                    ? 'border-[#0078d4] bg-white dark:bg-black'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                onClick={() => handlePageClick(page.pageNumber)}
                            >
                                <div className="aspect-[3/4] bg-white dark:bg-gray-800 border translator-border shadow-sm flex items-center justify-center mb-1 relative overflow-hidden">
                                    <img
                                        src={`${API_BASE_URL}/api/documents/${jobId}/pages/${page.pageNumber}/image`}
                                        className="w-full h-full object-contain opacity-90"
                                        loading="lazy"
                                        alt={`Page ${page.pageNumber}`}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {page.charCount === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5 backdrop-blur-[1px] pointer-events-none">
                                            <span className="text-[8px] font-bold text-gray-400 bg-white/80 px-1 rounded uppercase tracking-tighter">Pending</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                                        <FileText className="text-gray-400 opacity-20" size={32} />
                                    </div>

                                    <div
                                        className={`absolute top-1 right-1 w-5 h-5 rounded-full border flex items-center justify-center z-10 cursor-pointer shadow-sm transition-colors ${selectedPages.includes(page.pageNumber)
                                            ? 'bg-[#0078d4] border-[#0078d4] text-white'
                                            : 'bg-white border-gray-400 hover:border-[#0078d4]'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePage(page.pageNumber);
                                            setActivePage(page.pageNumber);
                                        }}
                                    >
                                        {selectedPages.includes(page.pageNumber) && <Check size={12} />}
                                    </div>
                                </div>
                                <div className="text-center text-xs font-medium translator-text-foreground">Page {page.pageNumber}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Canvas: Grey Background */}
                <div className="flex-1 bg-[#e0e0e0] dark:bg-[#1e1e1e] overflow-auto flex items-center justify-center p-8 relative">
                    {loadingPage ? (
                        <div className="flex flex-col items-center gap-3 bg-white/50 dark:bg-black/50 p-6 rounded-lg backdrop-blur-sm">
                            <Loader2 className="animate-spin text-[#0078d4]" size={32} />
                            <span className="text-sm font-medium text-translator-text-foreground">Rendering preview...</span>
                        </div>
                    ) : (
                        <div
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.1s ease-out'
                            }}
                            className="shadow-2xl transition-all"
                        >
                            <div
                                className="bg-white relative select-none"
                                style={{
                                    width: activePageData?.width ? `${activePageData.width * 96}px` : '816px',
                                    height: activePageData?.height ? `${activePageData.height * 96}px` : '1056px',
                                }}
                            >
                                <img
                                    src={`${API_BASE_URL}/api/documents/${jobId}/pages/${activePage}/image`}
                                    alt={`Page ${activePage}`}
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                />

                                {activePageData?.lines?.map((line, idx) => {
                                    if (!line.polygon || line.polygon.length < 8) return null;
                                    const xs = [line.polygon[0], line.polygon[2], line.polygon[4], line.polygon[6]];
                                    const ys = [line.polygon[1], line.polygon[3], line.polygon[5], line.polygon[7]];
                                    const minX = Math.min(...xs);
                                    const minY = Math.min(...ys);
                                    const w = Math.max(...xs) - minX;
                                    const h = Math.max(...ys) - minY;

                                    return (
                                        <div
                                            key={idx}
                                            className="absolute border border-[#0078d4]/30 hover:border-[#0078d4] hover:bg-[#0078d4]/10 cursor-pointer transition-colors z-10"
                                            style={{
                                                left: `${minX * 96}px`,
                                                top: `${minY * 96}px`,
                                                width: `${w * 96}px`,
                                                height: `${h * 96}px`
                                            }}
                                            title={line.content}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Result/Context */}
                <div className="w-[300px] border-l translator-border bg-white dark:bg-[#252526] flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b translator-border font-semibold text-sm bg-gray-50 dark:bg-[#333] flex justify-between items-center">
                        <span>Analysis Result</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Analysis Summary */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500">Selected Pages</span>
                                        <span className="font-mono font-medium">{stats.selectedCount}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500">Total Tokens</span>
                                        <span className="font-mono font-medium">{stats.isExtracted ? stats.totalTokens.toLocaleString() : "---"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500">Est. Time</span>
                                        <span className="font-mono font-medium text-blue-600">~{stats.isExtracted ? stats.estimatedMinutes : "---"} min</span>
                                    </div>
                                </div>
                            </div>

                            {/* Guidance */}
                            <div className="pt-2">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                        {!stats.isExtracted
                                            ? "Click 'Run Analysis' to extract text and structure from the selected pages using Azure AI."
                                            : "Extraction complete. Click 'Extract to Glossary' to start the mining process."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* JSON Preview (Bottom of Right Panel) */}
                    <div className="flex-1 min-h-[300px] border-t translator-border bg-[#f8f8f8] dark:bg-[#1e1e1e] flex flex-col">
                        <div className="px-3 py-1 text-[10px] font-semibold border-b translator-border text-gray-500 uppercase flex justify-between items-center">
                            <span>Azure DI Analysis (Raw JSON)</span>
                            {stats.isExtracted && <span className="text-green-600 font-bold">● LIVE</span>}
                        </div>
                        <div className="flex-1 overflow-auto p-2 font-mono text-[10px] text-gray-600 dark:text-gray-400">
                            <pre className="whitespace-pre-wrap">
                                {JSON.stringify(stats.isExtracted ? {
                                    pageNumber: activePageData?.pageNumber,
                                    status: "analyzed",
                                    extractionMethod: "azure-document-intelligence",
                                    dimensions: {
                                        width: activePageData?.width,
                                        height: activePageData?.height,
                                        unit: activePageData?.unit
                                    },
                                    lines: activePageData?.lines || [],
                                    content: activePageData?.rawText?.substring(0, 500) + "..."
                                } : {
                                    status: "ready",
                                    jobId,
                                    message: "Waiting for analysis trigger...",
                                    instructions: "Select pages and click 'Run Analysis' to see layout JSON"
                                }, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
