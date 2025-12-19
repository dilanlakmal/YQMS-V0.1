import React, { useState } from 'react';

const PrintP88Report = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState(null);
    const [selectedPath, setSelectedPath] = useState('');
    const [spaceInfo, setSpaceInfo] = useState(null);
    const [pathValidation, setPathValidation] = useState(null);
    const [downloadMode, setDownloadMode] = useState('single'); 
    const [startRange, setStartRange] = useState(1);
    const [endRange, setEndRange] = useState(100);
    const [progress, setProgress] = useState(null);
    const [includeDownloaded, setIncludeDownloaded] = useState(false);
    const [recordStats, setRecordStats] = useState(null);

    const checkAvailableSpace = async (path = '') => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const endpoint = downloadMode === 'single' ? 'check-space' : 'check-bulk-space';
            
            const body = downloadMode === 'single' 
                ? { downloadPath: path }
                : { 
                    downloadPath: path, 
                    startRange: downloadMode === 'range' ? startRange : null,
                    endRange: downloadMode === 'range' ? endRange : null,
                    downloadAll: downloadMode === 'all',
                    includeDownloaded: includeDownloaded
                };

            const response = await fetch(`${apiBaseUrl}/api/scraping/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();
                setSpaceInfo(data);
                return data;
            }
        } catch (error) {
            console.error('Error checking space:', error);
        }
        return null;
    };

    const getRecordStats = async () => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/scraping/record-count?includeDownloaded=${includeDownloaded}`);
            
            if (response.ok) {
                const data = await response.json();
                setRecordStats(data);
            }
        } catch (error) {
            console.error('Error getting record stats:', error);
        }
    };

    

    const validatePath = async (path) => {
        if (!path) {
            setPathValidation(null);
            return;
        }

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/scraping/validate-path`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ downloadPath: path })
            });

            if (response.ok) {
                const data = await response.json();
                setPathValidation(data);
            }
        } catch (error) {
            console.error('Error validating path:', error);
        }
    };

    const handlePrintReport = async () => {
        setLoading(true);
        setStatus({ message: '', type: '' });
        setProgress(null);

        try {
            setShowDownloadDialog(true);
            await checkAvailableSpace();
        } catch (error) {
            console.error('Error:', error);
            setStatus({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDownload = async () => {
        if (pathValidation && !pathValidation.isValid) {
            setStatus({ message: 'Please select a valid download path', type: 'error' });
            return;
        }

        if (downloadMode === 'range' && (startRange > endRange || startRange < 1)) {
            setStatus({ message: 'Please enter a valid range', type: 'error' });
            return;
        }

        if (spaceInfo && !spaceInfo.hasEnoughSpace) {
            const recordText = spaceInfo.recordCount ? ` for ${spaceInfo.recordCount} reports` : '';
            const proceed = window.confirm(
                `Warning: You may not have enough disk space${recordText}. Available: ${spaceInfo.availableSpace}, Estimated needed: ${spaceInfo.estimatedDownloadSize}. Do you want to proceed anyway?`
            );
            if (!proceed) return;
        }

        setLoading(true);
        setShowDownloadDialog(false);
        setProgress({ current: 0, total: spaceInfo?.recordCount || 1 });

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const endpoint = downloadMode === 'single' ? 'print-report' : 'download-bulk-reports';
            
            const body = downloadMode === 'single' 
                ? { downloadPath: selectedPath }
                : { 
                    downloadPath: selectedPath,
                    startRange: downloadMode === 'range' ? startRange : null,
                    endRange: downloadMode === 'range' ? endRange : null,
                    downloadAll: downloadMode === 'all'
                };

            const response = await fetch(`${apiBaseUrl}/api/scraping/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                let serverError = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    serverError = errorData.message || errorData.error || serverError;
                } catch (e) {
                    // Ignore if response body is not valid JSON
                }
                throw new Error(serverError);
            }

            const data = await response.json();

            if (data.success) {
                setDownloadInfo(data.downloadInfo);
                if (downloadMode === 'single') {
                    if (data.downloadInfo.fileCount > 0) {
                        setStatus({ 
                            message: `Successfully downloaded ${data.downloadInfo.fileCount} file(s) (${data.downloadInfo.totalSize})`, 
                            type: 'success' 
                        });
                    } else {
                        setStatus({ 
                            message: 'Download completed, but no new files were detected.', 
                            type: 'warning' 
                        });
                    }
                } else {
                    setStatus({ 
                        message: `Bulk download completed! ${data.downloadInfo.successfulDownloads} successful, ${data.downloadInfo.failedDownloads} failed. Total: ${data.downloadInfo.totalFiles} files (${data.downloadInfo.totalSize})`, 
                        type: 'success' 
                    });
                }
            } else {
                setStatus({ message: data.message || 'Failed to download report(s)', type: 'error' });
            }

        } catch (error) {
            console.error('Error:', error);
            setStatus({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    const handlePathChange = async (e) => {
        const path = e.target.value;
        setSelectedPath(path);
        await validatePath(path);
        if (path) {
            await checkAvailableSpace(path);
        } else {
            await checkAvailableSpace();
        }
    };

    const handleModeChange = async (mode) => {
        setDownloadMode(mode);
        await checkAvailableSpace(selectedPath);
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">📊 P88 Report Downloader</h2>

            {/* Download Mode Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Download Mode:</label>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="single"
                            checked={downloadMode === 'single'}
                            onChange={(e) => handleModeChange(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">📄 Single Report (Default)</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="range"
                            checked={downloadMode === 'range'}
                            onChange={(e) => handleModeChange(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">📊 Range of Reports</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="all"
                            checked={downloadMode === 'all'}
                            onChange={(e) => handleModeChange(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">📁 All Reports</span>
                    </label>
                </div>
            </div>

            {/* Record Statistics */}
                {recordStats && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">📊 Database Statistics:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Total Records: {recordStats.totalRecords}</div>
                            <div>Downloaded: {recordStats.downloadedRecords}</div>
                            <div>Pending: {recordStats.pendingRecords}</div>
                        </div>
                    </div>
                )}

                {/* Include Downloaded Option */}
                {downloadMode !== 'single' && (
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={includeDownloaded}
                                onChange={(e) => {
                                    setIncludeDownloaded(e.target.checked);
                                    checkAvailableSpace(selectedPath);
                                }}
                                className="mr-2"
                            />
                            <span className="text-sm">Include already downloaded reports</span>
                        </label>
                    </div>
                )}

            {/* Range Selection */}
            {downloadMode === 'range' && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium mb-2">Select Range:</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={startRange}
                            onChange={(e) => {
                                setStartRange(parseInt(e.target.value) || 1);
                                checkAvailableSpace(selectedPath);
                            }}
                            min="1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="From"
                        />
                        <span className="text-sm">to</span>
                        <input
                            type="number"
                            value={endRange}
                            onChange={(e) => {
                                setEndRange(parseInt(e.target.value) || 1);
                                checkAvailableSpace(selectedPath);
                            }}
                            min="1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="To"
                        />
                        <span className="text-xs text-gray-600">
                            ({Math.max(0, endRange - startRange + 1)} reports)
                        </span>
                    </div>
                </div>
            )}

            <button
                onClick={handlePrintReport}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {loading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {progress ? `Processing ${progress.current}/${progress.total}...` : 'Processing...'}
                    </div>
                ) : (
                    <>
                        {downloadMode === 'single' && '📄 Download Single Report'}
                        {downloadMode === 'range' && `📊 Download Reports ${startRange}-${endRange}`}
                        {downloadMode === 'all' && '📁 Download All Reports'}
                    </>
                )}
            </button>

            {/* Download Dialog */}
            {showDownloadDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">📥 Download Configuration</h3>
                        
                        <div className="mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                <p className="text-sm font-medium mb-1">Download Summary:</p>
                                <ul className="text-sm space-y-1">
                                    <li><strong>Mode:</strong> {
                                        downloadMode === 'single' ? 'Single Report' :
                                        downloadMode === 'range' ? `Range (${startRange}-${endRange})` :
                                        'All Reports'
                                    }</li>
                                    {spaceInfo?.recordCount && (
                                        <li><strong>Reports to Download:</strong> {spaceInfo.recordCount}</li>
                                    )}
                                </ul>
                            </div>
                            
                            {spaceInfo && (
                                <div className={`p-4 rounded-lg mb-4 ${
                                    spaceInfo.hasEnoughSpace ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                                }`}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">
                                            {spaceInfo.hasEnoughSpace ? '✅' : '⚠️'}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium mb-2">Storage Information:</p>
                                            <ul className="text-sm space-y-1">
                                                <li><strong>Available Space:</strong> {spaceInfo.availableSpace}</li>
                                                <li><strong>Estimated Download:</strong> {spaceInfo.estimatedDownloadSize}</li>
                                                <li><strong>Location:</strong> {spaceInfo.path}</li>
                                            </ul>
                                            <p className={`text-xs mt-2 ${
                                                spaceInfo.hasEnoughSpace ? 'text-green-700' : 'text-yellow-700'
                                            }`}>
                                                {spaceInfo.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                📁 Download Path (optional):
                            </label>
                            <input
                                type="text"
                                value={selectedPath}
                                onChange={handlePathChange}
                                placeholder="Leave empty for default path (e.g., C:\Downloads\Reports)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            
                            {pathValidation && (
                                <div className={`mt-2 p-2 rounded text-xs ${
                                    pathValidation.isValid 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {pathValidation.isValid ? '✅' : '❌'} {pathValidation.message}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDownloadDialog(false);
                                    setSelectedPath('');
                                    setSpaceInfo(null);
                                    setPathValidation(null);
                                }}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDownload}
                                disabled={loading || (pathValidation && !pathValidation.isValid)}
                                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                                    loading || (pathValidation && !pathValidation.isValid)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Downloading...
                                    </div>
                                ) : (
                                    '📥 Start Download'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {status.message && (
                <div className={`mt-4 p-3 rounded-lg ${
                    status.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : status.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    <div className="flex items-start gap-2">
                        <span>
                            {status.type === 'success' ? '✅' : status.type === 'warning' ? '⚠️' : '❌'}
                        </span>
                        <span className="flex-1">{status.message}</span>
                    </div>
                </div>
            )}

                        {/* Download Info */}
            {downloadInfo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        📊 Download Summary:
                    </h4>
                    
                    {downloadMode === 'single' ? (
                        // Single download info
                        downloadInfo.fileCount > 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                    <div><span className="font-medium">Files:</span> {downloadInfo.fileCount}</div>
                                    <div><span className="font-medium">Total Size:</span> {downloadInfo.totalSize}</div>
                                </div>
                                <div className="text-sm mb-3">
                                    <span className="font-medium">📁 Location:</span>
                                    <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">
                                        {downloadInfo.downloadPath}
                                    </div>
                                </div>
                                
                                {downloadInfo.files.length > 0 && (
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-sm font-medium hover:text-blue-600">
                                            📄 View File Details ({downloadInfo.files.length} files)
                                        </summary>
                                        <div className="mt-2 space-y-1">
                                            {downloadInfo.files.map((file, index) => (
                                                <div key={index} className="text-xs bg-white p-2 rounded border flex justify-between">
                                                    <span className="font-mono">{file.name}</span>
                                                    <span className="text-gray-600">{file.size}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </>
                        )
                    ) : (
                        // Bulk download info
                        <>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                <div><span className="font-medium">Total Records:</span> {downloadInfo.totalRecords}</div>
                                <div><span className="font-medium">Successful:</span> {downloadInfo.successfulDownloads}</div>
                                <div><span className="font-medium">Failed:</span> {downloadInfo.failedDownloads}</div>
                                <div><span className="font-medium">Total Files:</span> {downloadInfo.totalFiles}</div>
                                <div className="col-span-2"><span className="font-medium">Total Size:</span> {downloadInfo.totalSize}</div>
                            </div>
                            
                            <div className="text-sm mb-3">
                                <span className="font-medium">📁 Location:</span>
                                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">
                                    {downloadInfo.downloadPath}
                                </div>
                            </div>

                            {downloadInfo.details && downloadInfo.details.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-sm font-medium hover:text-blue-600">
                                        📄 View Detailed Results ({downloadInfo.details.length} reports)
                                    </summary>
                                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                        {downloadInfo.details.map((detail, index) => (
                                            <div key={index} className={`text-xs p-3 rounded border ${
                                                detail.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                            }`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium">
                                                        {detail.success ? '✅' : '❌'} Report #{detail.inspectionNumber}
                                                    </span>
                                                    {detail.success && (
                                                        <span className="text-gray-600">
                                                            {detail.fileCount} files
                                                        </span>
                                                    )}
                                                </div>
                                                {detail.success ? (
                                                    detail.files.length > 0 && (
                                                        <div className="mt-1">
                                                            {detail.files.map((file, fileIndex) => (
                                                                <div key={fileIndex} className="text-xs text-gray-600 ml-2">
                                                                    • {file.name} ({file.size})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="text-red-600 text-xs mt-1">
                                                        Error: {detail.error}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrintP88Report;

