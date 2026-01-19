import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FailedReportsFilter from './FailedReportsFilter';

const FailedReportsTable = () => {
    const [failedItems, setFailedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    
    // Loading states for individual items
    const [copyingItems, setCopyingItems] = useState(new Set());
    
    // Filter state
    const [filters, setFilters] = useState({
        userId: '',
        inspectionNumber: '',
        groupId: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchFailedReports();
    }, [filters]);

    const fetchFailedReports = async () => {
        try {
            setLoading(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = queryParams.toString() 
                ? `${apiBaseUrl}/api/p88failedReport/filtered-reports?${queryParams}`
                : `${apiBaseUrl}/api/p88failedReport/failed-reports`;

            const res = await axios.get(url);
            setFailedItems(res.data?.data || []);
            setTotalCount(res.data?.totalCount || res.data?.data?.length || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    useEffect(() => {
        fetchFailedReports();
    }, []);

    const handleManualDownload = async (item) => {
        // 1. Construct the direct Pivot88 URL
        const manualUrl = `https://yw.pivot88.com/inspectionreport/show/${item.inspectionNumber}`;

        // 2. Open the link in a new browser tab
        window.open(manualUrl, '_blank');

        // 3. Mark the report as "Downloaded" in your database
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const statusUrl = `${apiBaseUrl}/api/p88failedReport/failed-reports/mark-downloaded`;
            
            await axios.post(statusUrl, { reportId: item._id });
            
            // 4. Update the local UI state immediately
            setFailedItems(prev => 
                prev.map(i => i._id === item._id ? { ...i, status: 'Downloaded' } : i)
            );
        } catch (err) {
            console.error("Failed to update status in database:", err);
        }
    };

    // New function to copy report link
    const handleCopyLink = async (item) => {
        setCopyingItems(prev => new Set([...prev, item._id]));
        
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const linkUrl = `${apiBaseUrl}/api/p88failedReport/generate-report-link-by-inspection`;
            
            const response = await axios.post(linkUrl, { 
                inspectionNumber: item.inspectionNumber 
            });

            if (response.data.success) {
                const { reportUrl } = response.data;
                
                // Copy to clipboard
                try {
                    await navigator.clipboard.writeText(reportUrl);
                    
                    // Show success message
                    alert(`✅ Report link copied to clipboard!\n\nInspection: ${item.inspectionNumber}\nLink: ${reportUrl}\n\nYou can now paste this link in a new browser tab where you're logged into Pivot88.`);
                    
                } catch (clipboardError) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = reportUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    alert(`✅ Report link copied to clipboard!\n\nInspection: ${item.inspectionNumber}\nLink: ${reportUrl}`);
                }
                
            } else {
                throw new Error(response.data.error || 'Failed to generate link');
            }
            
        } catch (err) {
            console.error("Error copying link:", err);
            
            // Fallback: Generate link manually and copy
            const fallbackUrl = `https://yw.pivot88.com/inspectionreport/show/${item.inspectionNumber}`;
            
            try {
                await navigator.clipboard.writeText(fallbackUrl);
                alert(`⚠️ Generated fallback link and copied to clipboard!\n\nInspection: ${item.inspectionNumber}\nLink: ${fallbackUrl}`);
            } catch (clipboardError) {
                alert(`❌ Failed to copy link. Manual URL:\n\n${fallbackUrl}\n\nPlease copy this manually.`);
            }
            
        } finally {
            setCopyingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item._id);
                return newSet;
            });
        }
    };

    if (loading) return <div className="p-10 text-center">Loading reports...</div>;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manual Correction Center</h2>
                        <p className="text-sm text-gray-500">
                            Click to open and manually download reports from Pivot88 
                            {totalCount > 0 && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    {totalCount} reports
                                </span>
                            )}
                        </p>
                    </div>
                    <button 
                        onClick={fetchFailedReports} 
                        className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm flex items-center space-x-2"
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh List</span>
                    </button>
                </div>

                {/* Filter Component */}
                <FailedReportsFilter 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-red-700 text-sm">
                            Error loading reports: {error}
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Inspection No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Group ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Failed Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {failedItems.length > 0 ? (
                                failedItems.map((item) => {
                                    const isCopying = copyingItems.has(item._id);
                                    
                                    return (
                                        <tr key={item._id} className={item.status === 'Downloaded' ? 'bg-green-50' : ''}>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="font-medium text-blue-600">
                                                    {Array.isArray(item.emp_ids) ? item.emp_ids.join(', ') : item.emp_ids}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="font-medium text-blue-600">{item.inspectionNumber}</div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-600">{item.groupId}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-sm">
                                                {item.failedAt ? new Date(item.failedAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    item.status === 'Downloaded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <div className="flex space-x-2">
                                                    {/* Open Report Button */}
                                                    <button 
                                                        onClick={() => handleManualDownload(item)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs font-bold transition shadow-sm flex items-center space-x-1"
                                                        title="Open report in new tab"
                                                    >
                                                        <span>🔗</span>
                                                        <span>Open Report</span>
                                                    </button>

                                                    {/* Copy Link Button */}
                                                    <button 
                                                        onClick={() => handleCopyLink(item)}
                                                        disabled={isCopying}
                                                        className={`px-3 py-2 rounded-md text-xs font-bold transition shadow-sm flex items-center space-x-1 ${
                                                            isCopying 
                                                                ? 'bg-gray-400 cursor-not-allowed text-white' 
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                        }`}
                                                        title="Copy report link to clipboard"
                                                    >
                                                        {isCopying ? (
                                                            <>
                                                                <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                                <span>Copying...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>📋</span>
                                                                <span>Copy Link</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-10 text-center text-gray-400 italic">
                                        {Object.values(filters).some(value => value) 
                                            ? 'No failed reports match your current filters.' 
                                            : 'No failed reports found.'
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FailedReportsTable;
