import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FailedReportsTable = () => {
    const [failedItems, setFailedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFailedReports();
    }, []);

    const fetchFailedReports = async () => {
        try {
            setLoading(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const res = await axios.get(`${apiBaseUrl}/api/p88failedReport/failed-reports`);
            setFailedItems(res.data?.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualDownload = async (item) => {
        // 1. Construct the direct Pivot88 URL
        const manualUrl = `https://yw.pivot88.com/inspectionreport/show/${item.inspectionNumber}`;

        // 2. Open the link in a new browser tab
        // Note: The user must be logged into Pivot88 in this browser for the link to work
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

    if (loading) return <div className="p-10 text-center">Loading reports...</div>;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manual Correction Center</h2>
                        <p className="text-sm text-gray-500">Click to open and manually download reports from Pivot88</p>
                    </div>
                    <button onClick={fetchFailedReports} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm">
                        🔄 Refresh List
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Inspection No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Group ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {failedItems.length > 0 ? (
                                failedItems.map((item) => (
                                    <tr key={item._id} className={item.status === 'Downloaded' ? 'bg-green-50' : ''}>
                                        <td className="px-4 py-4 font-medium text-blue-600">{item.inspectionNumber}</td>
                                        <td className="px-4 py-4 text-gray-600">{item.groupId}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                item.status === 'Downloaded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button 
                                                onClick={() => handleManualDownload(item)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold transition shadow-sm"
                                            >
                                                Open Report
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-10 text-center text-gray-400 italic">No failed reports found.</td>
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