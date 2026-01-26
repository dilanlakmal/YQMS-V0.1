import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { API_BASE_URL } from '../../../config';
import PaperPreview from './PaperPreview';
import PaperPreviewReitmans from './PaperPreviewReitmans';
import HistoryModal from './HistoryModal';
import HistoryModelReitmans from './HistoryModelReitmans';
import UpdateModel from './UpdateModel';
import UpdateModelReimans from './UpdateModelReimans';
import { useAuth } from '../authentication/AuthContext';
import { CheckCircle2, AlertCircle, Send, X, ShieldCheck, MessageSquare } from 'lucide-react';

export default function ExportPanel() {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [factoryStyleFilter, setFactoryStyleFilter] = useState('');
    const [buyerStyleFilter, setBuyerStyleFilter] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [factorySuggestions, setFactorySuggestions] = useState([]);
    const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ordersRaw, setOrdersRaw] = useState([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveTargetId, setApproveTargetId] = useState(null);
    const [approvalRemarkInput, setApprovalRemarkInput] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    // approval success message removed — do not show inline banner
    const [approveErrorMessage, setApproveErrorMessage] = useState('');
    const [approveCompleted, setApproveCompleted] = useState(false);
    const [docsRaw, setDocsRaw] = useState([]);
    const [displayedReports, setDisplayedReports] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);


    // Modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedReportForHistory, setSelectedReportForHistory] = useState(null);

    // Update Modal state
    const [isUpdateModelOpen, setIsUpdateModelOpen] = useState(false);
    const [selectedReportForUpdate, setSelectedReportForUpdate] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);

        setStartDate(oneMonthAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);

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

    // Compute suggestions for factory style input
    useEffect(() => {
        if (!factoryStyleFilter || !ordersRaw || ordersRaw.length === 0) {
            setFactorySuggestions([]);
            return;
        }
        const q = String(factoryStyleFilter).trim().toLowerCase();
        const seen = new Set();
        const suggestions = [];
        for (const d of ordersRaw) {
            const candidate = (d.factoryStyleNo || d.factoryStyle || d.moNo || d.style || '').toString();
            if (!candidate) continue;
            const lower = candidate.toLowerCase();
            if (lower.includes(q) && !seen.has(lower)) {
                seen.add(lower);
                suggestions.push({
                    value: candidate,
                    buyerStyle: d.buyerStyle || d.style || '',
                    customer: d.customer || d.buyer || d.brand || ''
                });
                if (suggestions.length >= 20) break;
            }
        }
        setFactorySuggestions(suggestions);
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

    const openHistoryModal = (report) => {
        setSelectedReportForHistory(report);
        setIsHistoryModalOpen(true);
    };

    const handleExport = async () => {
        try {
            setIsLoading(true);

            const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

            // Fetch data - build URL with optional filters
            let url = `${prefix}/api/humidity-reports?limit=0`;

            // Add date filters only if both are selected
            if (startDate && endDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);

                const startIso = s.toISOString();
                const endIso = e.toISOString();

                url += `&start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
                console.log('Exporting with date range:', startIso, 'to', endIso);
            } else {
                console.log('Exporting all reports (no date filter)');
            }

            // Add factory style filter if selected
            if (factoryStyleFilter) {
                url += `&factoryStyleNo=${encodeURIComponent(factoryStyleFilter)}`;
                console.log('Filtering by Factory Style:', factoryStyleFilter);
            }

            console.log('Fetching reports from:', url);

            const res = await fetch(url);
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Fetch failed: ${res.status} ${txt}`);
            }
            const json = await res.json();
            const docs = json && json.data ? json.data : [];

            console.log('Reports fetched:', docs.length);

            if (!Array.isArray(docs) || docs.length === 0) {
                alert('No reports found for the selected period.');
                setIsLoading(false);
                return;
            }

            // Generate HTML locally
            const reportsHtml = docs.map(doc => {
                const isReitmans = (doc.customer || '').toLowerCase() === 'reitmans';
                return `
                    <div class="page-break-after-always">
                        ${renderToStaticMarkup(isReitmans ? <PaperPreviewReitmans data={doc} /> : <PaperPreview data={doc} />)}
                    </div>
                `;
            }).join('');
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

    const handleEdit = (reportId) => {
        const report = displayedReports.find(r => r._id === reportId);
        if (report) {
            setSelectedReportForUpdate(report);
            setIsUpdateModelOpen(true);
        }
    };

    const handleUpdateSuccess = () => {
        // Refresh data
        const fetchData = async () => {
            // Re-fetch logic similar to useEffect
            // Or simpler: trigger the existing fetch
            try {
                const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
                const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
                const res = await fetch(`${prefix}/api/humidity-reports?limit=0`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data)) {
                        setOrdersRaw(json.data);
                        // displayedReports updates via effect if filters exist, else direct?
                        // Actually, effect depends on ordersRaw, so it should auto-update
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchData();
    };

    const AUTHORIZED_APPROVERS = ['YM7625', 'TYM010'];

    const handleApprove = async (reportId) => {
        // Reset states before opening modal
        setApproveTargetId(reportId);
        setApprovalRemarkInput('');
        setShowApproveConfirm(false);
        setApproveCompleted(false);
        setApproveErrorMessage('');
        setShowApproveModal(true);
    };

    const confirmApprove = async (skipConfirm = false) => {
        if (!approveTargetId) return;
        // if remark empty and we haven't shown the inline confirm yet, show it
        if (!skipConfirm && (!approvalRemarkInput || approvalRemarkInput.trim() === '')) {
            setShowApproveConfirm(true);
            return;
        }
        try {
            if (!user || !user.emp_id || !user.eng_name) {
                alert('User information not available. Please log in again.');
                return;
            }
            const isAuthorized = AUTHORIZED_APPROVERS.some(id =>
                id.toLowerCase() === String(user.emp_id).trim().toLowerCase()
            );
            if (!isAuthorized) {
                alert(`You are not authorized to approve reports. Your ID is: ${user.emp_id}`);
                return;
            }

            // proceed without native confirm; inline confirm handled in modal when remark is empty
            setIsApproving(true);
            const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
            const res = await fetch(`${prefix}/api/humidity-reports/${approveTargetId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empId: user.emp_id,
                    engName: user.eng_name,
                    remark: approvalRemarkInput || ''
                })
            });
            const json = await res.json();
            if (res.ok && json.success) {
                // refetch reports from server to get persisted remark and latest state
                try {
                    const res2 = await fetch(`${prefix}/api/humidity-reports?limit=0`);
                    if (res2.ok) {
                        const j2 = await res2.json();
                        if (j2.data && Array.isArray(j2.data)) {
                            setOrdersRaw(j2.data);
                            setDisplayedReports(j2.data);
                        }
                    }
                } catch (rfErr) {
                    console.error('Error refetching reports after approve', rfErr);
                }
                // remark saved; not showing inline success banner here
                // keep modal open so user can see the saved remark; mark completed
                setApproveCompleted(true);
                // Automatically close modal after success feedback
                setTimeout(() => {
                    setShowApproveModal(false);
                    setApproveTargetId(null);
                    setApproveCompleted(false);
                }, 2000);
            } else {
                // show error inline and refresh list if server indicates already approved
                const err = json.message || 'Approval failed';
                setApproveErrorMessage(err);
                try {
                    if (String(err).toLowerCase().includes('already approved')) {
                        // refresh the list to reflect current server state
                        const base2 = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : '';
                        const prefix2 = base2.endsWith('/') ? base2.slice(0, -1) : base2;
                        const r = await fetch(`${prefix2}/api/humidity-reports?limit=0`);
                        if (r.ok) {
                            const j = await r.json();
                            if (j.data && Array.isArray(j.data)) {
                                setOrdersRaw(j.data);
                                setDisplayedReports(j.data);
                            }
                        }
                    }
                } catch (refreshErr) {
                    console.error('Error refreshing reports after failed approve', refreshErr);
                }
            }
        } catch (err) {
            console.error('Approval error', err);
            alert('Failed to approve report. See console for details.');
        } finally {
            setIsApproving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            // Check if date is valid
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return 'N/A';
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        try {
            if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.includes(' '))) {
                const date = new Date(timeStr);
                if (isNaN(date.getTime())) return timeStr;
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }

            const timeParts = timeStr.split(':');
            if (timeParts.length >= 2) {
                let hours = parseInt(timeParts[0], 10);
                const minutes = timeParts[1].substring(0, 2); // Get "mm" part
                if (isNaN(hours) || isNaN(parseInt(minutes, 10))) return timeStr;

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
        const isPass = (status) => String(status || '').toLowerCase() === 'pass';

        const allPassed = isPass(latestCheck.top?.status) &&
            isPass(latestCheck.middle?.status) &&
            isPass(latestCheck.bottom?.status);

        if (allPassed) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pass
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fail
                </span>
            );
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(displayedReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageReports = displayedReports.slice(startIndex, endIndex);

    return (
        <div className="space-y-6">
            {/* DEBUG INFO - REMOVE AFTER FIXING */}
            {/* <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                        <span className="text-gray-500 block">Logged In:</span>
                        <code className="font-bold text-blue-700">{user?.emp_id}</code>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Is Authorized:</span>
                        <code className={`font-bold ${AUTHORIZED_APPROVERS.some(id => id.toLowerCase() === String(user?.emp_id).trim().toLowerCase()) ? 'text-green-600' : 'text-red-600'}`}>
                            {AUTHORIZED_APPROVERS.some(id => id.toLowerCase() === String(user?.emp_id).trim().toLowerCase()) ? 'YES' : 'NO'}
                        </code>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Authorized IDs:</span>
                        <code className="text-gray-600 truncate">{AUTHORIZED_APPROVERS.join(',')}</code>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-gray-400">Backend Fix Applied</span>
                    </div>
                </div>
            </div> */}

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
                            <input
                                type="text"
                                value={factoryStyleFilter}
                                onChange={e => {
                                    setFactoryStyleFilter(e.target.value);
                                    setShowFactoryDropdown(true);
                                }}
                                placeholder="Search Style No..."
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showFactoryDropdown && factorySuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                                    {factorySuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onMouseDown={(ev) => {
                                                // prevent blur before click
                                                ev.preventDefault();
                                                setFactoryStyleFilter(s.value);
                                                setBuyerStyleFilter(s.buyerStyle || '');
                                                setCustomerFilter(s.customer || '');
                                                setShowFactoryDropdown(false);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                        >
                                            <div className="font-semibold">{s.value}</div>
                                            <div className="text-xs text-gray-500">{s.buyerStyle} · {s.customer}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {factoryStyleFilter && (
                                <button
                                    onClick={() => setFactoryStyleFilter('')}
                                    className="absolute inset-y-0 right-0 px-2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
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
                            <button onClick={handleExport} disabled={isLoading || !factoryStyleFilter} className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
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
            {/* Approve remark modal */}
            {showApproveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
                                <CheckCircle2 size={120} />
                            </div>

                            <button
                                onClick={() => { setShowApproveModal(false); setApproveTargetId(null); setShowApproveConfirm(false); }}
                                className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-2.5 transition-all focus:outline-none backdrop-blur-md z-20 flex items-center justify-center group"
                                type="button"
                                title="Close"
                            >
                                <X size={20} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl ring-4 ring-white/10">
                                        <ShieldCheck size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white m-0 tracking-tight">Final Approval</h3>
                                        <p className="text-green-100/80 text-xs font-bold uppercase tracking-[0.2em] mt-1">Quality Assurance Record</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {approveCompleted ? (
                                <div className="py-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative w-24 h-24 mx-auto mb-6">
                                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                                        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-200">
                                            <CheckCircle2 size={48} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800 mb-2">Approved Successfully!</h4>
                                    <p className="text-slate-500 font-medium px-4 leading-relaxed">The report has been verified and marked as approved on the system.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {approveErrorMessage && (
                                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-2xl animate-in slide-in-from-top-2">
                                            <AlertCircle size={20} className="shrink-0" />
                                            <div className="text-[13px] font-bold">{approveErrorMessage}</div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <MessageSquare size={14} className="text-slate-300" />
                                                Supervisor Remarks
                                            </label>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Optional</span>
                                        </div>
                                        <div className="relative group">
                                            <textarea
                                                value={approvalRemarkInput}
                                                onChange={e => setApprovalRemarkInput(e.target.value)}
                                                rows={4}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white transition-all outline-none resize-none shadow-inner-white"
                                                placeholder="Enter verification notes or quality remarks..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        {showApproveConfirm ? (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 flex items-start gap-4 ring-8 ring-rose-50/50">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                                        <AlertCircle size={20} className="text-rose-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-rose-900 m-0">No Remark Provided</p>
                                                        <p className="text-xs text-rose-600/80 font-medium leading-relaxed m-0">Are you sure you want to approve this report without any quality notes?</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowApproveConfirm(false)}
                                                        className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border-2 border-slate-100 font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                    >
                                                        No, Wait
                                                    </button>
                                                    <button
                                                        onClick={() => confirmApprove(true)}
                                                        disabled={isApproving}
                                                        className="flex-[2] py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 group"
                                                    >
                                                        {isApproving ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : (
                                                            <>
                                                                <Send size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                                Confirm Now
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => { setShowApproveModal(false); setApproveTargetId(null); }}
                                                    className="px-4 py-2 text-slate-400 hover:text-slate-600 border border-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors flex-1"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={() => confirmApprove(false)}
                                                    disabled={isApproving}
                                                    className="flex-[2] py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 group"
                                                >
                                                    {isApproving ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 size={16} />
                                                            Authorize Approval
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Approval</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentPageReports.map((report, idx) => {
                                    const reportId = report._id || idx;
                                    const history = report.history || [];
                                    const latestDate = report.updatedAt || report.createdAt || '';
                                    const isApproved = report.approvalStatus === 'approved';
                                    const isPass = (status) => String(status || '').toLowerCase() === 'pass';
                                    const latestCheck = history[history.length - 1];
                                    const reportStatus = (latestCheck &&
                                        isPass(latestCheck.top?.status) &&
                                        isPass(latestCheck.middle?.status) &&
                                        isPass(latestCheck.bottom?.status)) ? 'pass' : 'fail';

                                    const isAuthorized = user?.emp_id && AUTHORIZED_APPROVERS.some(id =>
                                        id.toLowerCase() === String(user.emp_id).trim().toLowerCase()
                                    );

                                    return (
                                        <React.Fragment key={reportId}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-center text-gray-900">{report.factoryStyleNo || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700">{report.buyerStyle || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-700">{report.customer || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(latestDate)}</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                                                        {history.length}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {getStatusBadge(history)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {isApproved ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">✓ Approved</span>
                                                            {report.approvedBy && (
                                                                <span className="text-xs text-gray-500">by {report.approvedBy.engName}</span>
                                                            )}
                                                        </div>
                                                    ) : isAuthorized ? (
                                                        <button
                                                            onClick={() => handleApprove(reportId)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full border border-green-200 transition-colors"
                                                            title="Supervisor Approve"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Approve
                                                        </button>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500 font-medium border border-gray-200">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {history.length > 0 && (
                                                            <button
                                                                onClick={() => openHistoryModal(report)}
                                                                className="inline-flex items-center p-2.5 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 group"
                                                                title="View History"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {(() => {
                                                            const latestCheck = history[history.length - 1];
                                                            const isLastPassed = latestCheck && latestCheck.top?.status === 'pass' &&
                                                                latestCheck.middle?.status === 'pass' &&
                                                                latestCheck.bottom?.status === 'pass';
                                                            const isDisabled = isLastPassed;

                                                            return (
                                                                <button
                                                                    onClick={() => handleEdit(reportId)}
                                                                    disabled={isDisabled}
                                                                    className={`inline-flex items-center p-2.5 rounded-xl transition-all duration-200 group ${isDisabled
                                                                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                                        : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                                                                    title={isDisabled ? "Report locked (3 passed)" : "Edit Report"}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                            );
                                                        })()}

                                                    </div>
                                                </td>
                                            </tr>

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

            {selectedReportForHistory && (() => {
                const isReitmans = (selectedReportForHistory.customer || '').toLowerCase() === 'reitmans';
                if (isReitmans) {
                    return (
                        <HistoryModelReitmans
                            open={isHistoryModalOpen}
                            onCancel={() => setIsHistoryModalOpen(false)}
                            report={selectedReportForHistory}
                            formatDate={formatDate}
                            formatTime={formatTime}
                            onApprove={(reportId) => {
                                setIsHistoryModalOpen(false);
                                handleApprove(reportId);
                            }}
                        />
                    );
                }
                return (
                    <HistoryModal
                        open={isHistoryModalOpen}
                        onCancel={() => setIsHistoryModalOpen(false)}
                        report={selectedReportForHistory}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        onApprove={(reportId) => {
                            setIsHistoryModalOpen(false);
                            handleApprove(reportId);
                        }}
                    />
                );
            })()}

            {selectedReportForUpdate && (
                (() => {
                    const isReitmans = (selectedReportForUpdate.customer || '').toLowerCase() === 'reitmans';
                    if (isReitmans) {
                        return (
                            <UpdateModelReimans
                                open={isUpdateModelOpen}
                                onCancel={() => setIsUpdateModelOpen(false)}
                                report={selectedReportForUpdate}
                                onUpdate={handleUpdateSuccess}
                            />
                        );
                    }
                    return (
                        <UpdateModel
                            open={isUpdateModelOpen}
                            onCancel={() => setIsUpdateModelOpen(false)}
                            report={selectedReportForUpdate}
                            onUpdate={handleUpdateSuccess}
                        />
                    );
                })()
            )}

        </div >
    );
}
