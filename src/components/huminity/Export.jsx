import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { API_BASE_URL } from '../../../config';
import PaperPreview from './PaperPreview';

export default function ExportPanel() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [factoryStyleFilter, setFactoryStyleFilter] = useState('');
    const [buyerStyleFilter, setBuyerStyleFilter] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ordersRaw, setOrdersRaw] = useState([]);
    const [docsRaw, setDocsRaw] = useState([]);
    const [displayedReports, setDisplayedReports] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);

        const fetchData = async () => {
            try {
                const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
                const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
                const res = await fetch(`${prefix}/api/humidity-reports?limit=0`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data)) {
                        setOrdersRaw(json.data);
                        setDisplayedReports(json.data);
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchData();

        const handleReportUpdate = () => {
            fetchData();
        };

        window.addEventListener('humidityReportsUpdated', handleReportUpdate);

        return () => {
            window.removeEventListener('humidityReportsUpdated', handleReportUpdate);
        };
    }, []);

    useEffect(() => {
        if (!factoryStyleFilter) {
            setBuyerStyleFilter('');
            setCustomerFilter('');
            return;
        }
        const match = ordersRaw.find(d =>
            (d.factoryStyleNo || d.factoryStyle || d.moNo || d.style || '').toString() === factoryStyleFilter
        );
        if (match) {
            setBuyerStyleFilter(match.buyerStyle || match.style || '');
            setCustomerFilter(match.customer || match.buyer || match.brand || '');
        }
    }, [factoryStyleFilter, ordersRaw]);

    // Apply filters to displayed reports
    useEffect(() => {
        let filtered = ordersRaw;

        if (factoryStyleFilter) {
            filtered = filtered.filter(doc =>
                (doc.factoryStyleNo || '').toString().toLowerCase().includes(factoryStyleFilter.toLowerCase())
            );
        }

        setDisplayedReports(filtered);
        setCurrentPage(1); // Reset to page 1 when filters change
    }, [factoryStyleFilter, ordersRaw]);

    const toggleRowExpansion = (reportId) => {
        setExpandedRows(prev => ({
            ...prev,
            [reportId]: !prev[reportId]
        }));
    };

    const handleExport = async () => {
        try {
            if (!startDate || !endDate) {
                alert('Please select a start and end date');
                return;
            }

            setIsLoading(true);

            // Construct start/end ISO strings
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);

            const startIso = s.toISOString();
            const endIso = e.toISOString();

            const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

            // Fetch data
            let url = `${prefix}/api/humidity-reports?limit=0&start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;

            // Add filters if selected
            if (factoryStyleFilter) url += `&factoryStyleNo=${encodeURIComponent(factoryStyleFilter)}`;

            const res = await fetch(url);
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Fetch failed: ${res.status} ${txt}`);
            }
            const json = await res.json();
            const docs = json && json.data ? json.data : [];

            if (!Array.isArray(docs) || docs.length === 0) {
                alert('No reports found for the selected period.');
                setIsLoading(false);
                return;
            }

            // Generate HTML locally
            const reportsHtml = docs.map(doc => renderToStaticMarkup(<PaperPreview data={doc} />)).join('');
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                <title>Humidity Reports Export</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page { margin: 0; }
                        body { padding: 10px; -webkit-print-color-adjust: exact; }
                        .page-break-after-always { page-break-after: always; }
                    }
                </style>
                </head>
                <body class="bg-gray-100 print:bg-white">
                    ${reportsHtml}
                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 500);
                        }
                    </script>
                </body>
                </html>
            `;

            const w = window.open('', '_blank');
            if (!w) {
                alert('Popup blocked. Please allow popups.');
                setIsLoading(false);
                return;
            }
            w.document.open();
            w.document.write(fullHtml);
            w.document.close();

        } catch (err) {
            console.error('Export error', err);
            alert('Export failed. See console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        try {
            if (timeStr.includes('T') || timeStr.includes(' ')) {
                const date = new Date(timeStr);
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }

            const timeParts = timeStr.split(':');
            if (timeParts.length >= 2) {
                let hours = parseInt(timeParts[0], 10);
                const minutes = timeParts[1];
                const period = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                if (hours === 0) hours = 12;

                return `${hours}:${minutes} ${period}`;
            }

            return timeStr;
        } catch (e) {
            return timeStr;
        }
    };

    const getStatusBadge = (history) => {
        if (!history || history.length === 0) return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">No checks</span>;

        const latestCheck = history[history.length - 1];
        const allPassed = latestCheck.top?.status === 'pass' &&
            latestCheck.middle?.status === 'pass' &&
            latestCheck.bottom?.status === 'pass';

        if (allPassed) {
            return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-medium">✓ Complete</span>;
        } else {
            return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 font-medium">⚡ In Progress</span>;
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(displayedReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageReports = displayedReports.slice(startIndex, endIndex);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-md border">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Factory Style No</label>
                        <div className="relative">
                            <select
                                value={factoryStyleFilter}
                                onChange={e => setFactoryStyleFilter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {[...new Set([
                                    ...(Array.isArray(ordersRaw) ? ordersRaw.map(o => (o.factoryStyleNo || o.moNo || o.style || '').toString()).filter(Boolean) : [])
                                ])].map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Buyer Style</label>
                        <input
                            type="text"
                            value={buyerStyleFilter}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Customer</label>
                        <div className="flex gap-2">
                            <input
                                value={customerFilter}
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            />
                            <button onClick={handleExport} disabled={isLoading || !startDate || !endDate || !factoryStyleFilter} className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Exporting...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Reports Display */}
            <div className="bg-white rounded-md border overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Saved Humidity Reports
                        <span className="ml-auto text-sm font-normal text-gray-600">
                            {displayedReports.length} {displayedReports.length === 1 ? 'report' : 'reports'}
                            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    {displayedReports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">No reports found</p>
                            <p className="text-sm mt-1">Save a humidity inspection report to see it here</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Factory Style</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Buyer Style</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Latest Check</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Checks</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentPageReports.map((report, idx) => {
                                    const reportId = report._id || idx;
                                    const isExpanded = expandedRows[reportId];
                                    const history = report.history || [];
                                    const latestDate = report.updatedAt || report.createdAt || '';

                                    return (
                                        <React.Fragment key={reportId}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-center text-gray-900">{report.factoryStyleNo || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700">{report.buyerStyle || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700">{report.customer || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(latestDate)}</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                                        {history.length}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {getStatusBadge(history)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {history.length > 0 && (
                                                        <button
                                                            onClick={() => toggleRowExpansion(reportId)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                    </svg>
                                                                    Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                    View History
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>

                                            {isExpanded && history.length > 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-4 py-4 bg-gray-50">
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Inspection History</h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm border rounded">
                                                                    <thead className="bg-white">
                                                                        <tr>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b">Check #</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b">Date</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b">Before Dry</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b">After Dry</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b" colSpan="2">Top</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b" colSpan="2">Middle</th>
                                                                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 border-b" colSpan="2">Bottom</th>
                                                                        </tr>
                                                                        <tr className="bg-gray-50">
                                                                            <th className="px-3 py-1 border-b"></th>
                                                                            <th className="px-3 py-1 border-b"></th>
                                                                            <th className="px-3 py-1 border-b"></th>
                                                                            <th className="px-3 py-1 border-b"></th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Body/Ribs</th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Status</th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Body/Ribs</th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Status</th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Body/Ribs</th>
                                                                            <th className="px-3 py-1 text-xs text-gray-500 border-b">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {history.map((check, checkIdx) => (
                                                                            <tr key={checkIdx} className="hover:bg-gray-50">
                                                                                <td className="px-3 py-2 text-center font-medium text-gray-700">{checkIdx + 1}</td>
                                                                                <td className="px-3 py-2 text-center text-gray-600">{formatDate(check.date)}</td>
                                                                                <td className="px-3 py-2 text-center text-gray-600">{formatTime(check.beforeDryRoom)}</td>
                                                                                <td className="px-3 py-2 text-center text-gray-600">{formatTime(check.afterDryRoom)}</td>
                                                                                <td className="px-3 py-2 text-center text-gray-700">
                                                                                    {check.top?.body || '-'} / {check.top?.ribs || '-'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {check.top?.status === 'pass' ? (
                                                                                        <span className="text-green-600 font-medium">✓</span>
                                                                                    ) : check.top?.status === 'fail' ? (
                                                                                        <span className="text-red-600 font-medium">✗</span>
                                                                                    ) : '-'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center text-gray-700">
                                                                                    {check.middle?.body || '-'} / {check.middle?.ribs || '-'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {check.middle?.status === 'pass' ? (
                                                                                        <span className="text-green-600 font-medium">✓</span>
                                                                                    ) : check.middle?.status === 'fail' ? (
                                                                                        <span className="text-red-600 font-medium">✗</span>
                                                                                    ) : '-'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center text-gray-700">
                                                                                    {check.bottom?.body || '-'} / {check.bottom?.ribs || '-'}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {check.bottom?.status === 'pass' ? (
                                                                                        <span className="text-green-600 font-medium">✓</span>
                                                                                    ) : check.bottom?.status === 'fail' ? (
                                                                                        <span className="text-red-600 font-medium">✗</span>
                                                                                    ) : '-'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {history[history.length - 1]?.generalRemark && (
                                                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                                                    <p className="text-xs font-semibold text-gray-700 mb-1">Latest Remark:</p>
                                                                    <p className="text-sm text-gray-600">{history[history.length - 1].generalRemark}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t bg-white flex items-end justify-end">
                        <div className="inline-flex items-center">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200 h-9 flex items-center justify-center gap-2"
                            >
                                Previous
                            </button>

                            {(() => {
                                const pages = [];
                                const showEllipsis = totalPages > 7;

                                if (!showEllipsis) {
                                    for (let i = 1; i <= totalPages; i++) {
                                        pages.push(i);
                                    }
                                } else {
                                    pages.push(1);

                                    if (currentPage <= 3) {
                                        pages.push(2, 3, 4);
                                        pages.push('...');
                                        pages.push(totalPages);
                                    } else if (currentPage >= totalPages - 2) {
                                        pages.push('...');
                                        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                    } else {
                                        pages.push('...');
                                        pages.push(currentPage - 1, currentPage, currentPage + 1);
                                        pages.push('...');
                                        pages.push(totalPages);
                                    }
                                }

                                return pages.map((page, idx) => {
                                    if (page === '...') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500 text-sm h-9 flex items-center bg-white border border-gray-300 -ml-px">
                                                ...
                                            </span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[40px] h-9 px-3 py-2 text-sm font-medium border border-gray-300 -ml-px transition-all duration-200 ${currentPage === page
                                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 z-10 relative'
                                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                });
                            })()}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200 h-9 flex items-center justify-center gap-2"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
