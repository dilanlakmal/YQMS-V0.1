import React from 'react';
import { Modal, Image } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import PaperPreviewReitmans from './PaperPreviewReitmans';
import { FileText, MessageSquare, X as CloseIcon, Calendar, Clock, Target, Beaker, Camera, ArrowRight, FlaskConical, History, User, Info, Briefcase, FileSearch, Printer } from 'lucide-react';

const HistoryModelReitmans = ({ open, onCancel, report, formatDate, formatTime }) => {
    if (!report) return null;

    const history = report.history || [];
    const specLimit = Number(report.upperCentisimalIndex || 0);

    const renderStatusBadge = (status) => {
        const isPass = status === 'pass' || status === 'Optimal';
        return (
            <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                {isPass ? 'Pass' : 'Fail'}
            </span>
        );
    };

    const getValueColor = (val) => {
        if (!val) return 'text-slate-400';
        return Number(val) > specLimit ? 'text-rose-600' : 'text-emerald-600';
    };

    const handlePrint = () => {
        try {
            const reportHtml = renderToStaticMarkup(<PaperPreviewReitmans data={report} />);
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                <title>Reitmans Humidity Report - ${report.factoryStyleNo || ''}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page { margin: 0; }
                        body { padding: 10px; -webkit-print-color-adjust: exact; }
                        .page-break-after-always { page-break-after: always; }
                    }
                </style>
                </head>
                <body class="bg-gray-100 print:bg-white text-gray-800">
                    <div class="max-w-[800px] mx-auto bg-white p-4 print:p-0">
                        ${reportHtml}
                    </div>
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
                return;
            }
            w.document.open();
            w.document.write(fullHtml);
            w.document.close();
        } catch (err) {
            console.error('Print error', err);
            alert('Failed to generate print preview.');
        }
    };

    return (
        <Modal
            title={null}
            closeIcon={null}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={1200}
            centered
            styles={{
                body: { padding: 0, overflow: 'hidden' },
                content: { padding: 0, borderRadius: '16px', overflow: 'hidden', border: 'none' },
                mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' }
            }}
        >
            {/* Header: Exact Match to "Request Details" */}
            <div className="bg-emerald-500 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                        <FileText size={22} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-white leading-tight">Reitmans Humidity History</h3>
                        <p className="text-white text-sm font-bold mt-1">
                            Factory Style No: {report.factoryStyleNo || 'N/A'} • Buyer Style: {report.buyerStyle || 'N/A'} • Po Line: {report.poLine || 'N/A'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                    <CloseIcon size={24} />
                </button>
            </div>

            {/* Content Area: Grid of cards matching the Reference style */}
            <div className="p-8 bg-slate-50/30 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-8">
                {history.length > 0 ? history.map((record, idx) => {
                    const isLatest = idx === history.length - 1;
                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 animate-fade-in items-stretch"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            {/* Card 1: Session Information */}
                            <div className="bg-white rounded-2xl border border-gray-100/50 p-6 space-y-4 shadow-sm">
                                <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-4">
                                    <Clock size={18} />
                                    <h4 className="text-sm font-bold uppercase tracking-wide">Check #{String(idx + 1).padStart(2, '0')}</h4>
                                    {isLatest && <span className="ml-auto bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Latest</span>}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Time Checked:</span>
                                        <span className="text-sm font-bold text-slate-800">{formatTime(record.timeChecked || (isLatest ? report.timeChecked : ''))}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">No. pc checked:</span>
                                        <span className="text-sm font-bold text-slate-800">{record.noPcChecked || (isLatest ? report.noPcChecked : 'N/A')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Time in:</span>
                                        <span className="text-sm font-bold text-slate-800">{formatTime(record.timeIn || (isLatest ? report.timeIn : ''))}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Moisture rate (Before):</span>
                                        <span className="text-sm font-black text-slate-800">
                                            {record.moistureRateBeforeDehumidify || record.moistureRateBeforeDry || (isLatest ? report.moistureRateBeforeDehumidify : '---')}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Moisture rate (After):</span>
                                        <span className={`text-sm font-black tracking-tight ${getValueColor(record.moistureRateAfter || record.moistureRateAfterDry || (isLatest ? report.moistureRateAfter : null))}`}>
                                            {record.moistureRateAfter || record.moistureRateAfterDry || (isLatest ? report.moistureRateAfter : '---')}%
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-4">
                                        <Camera size={18} />
                                        <h4 className="text-sm font-bold uppercase tracking-wide">Image</h4>
                                    </div>
                                    {record.images?.length > 0 ? (
                                        <Image.PreviewGroup>
                                            <div className="flex flex-wrap gap-3">
                                                {record.images.map((img, i) => (
                                                    <Image
                                                        key={i}
                                                        src={img.preview}
                                                        width={70}
                                                        height={70}
                                                        className="rounded-xl object-cover border border-slate-100 shadow-sm"
                                                        preview={{ mask: <div className="text-[8px] font-black">VIEW</div> }}
                                                    />
                                                ))}
                                            </div>
                                        </Image.PreviewGroup>
                                    ) : (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic leading-none">Not available for this session</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Technical Readings */}
                            <div className="bg-white rounded-2xl border border-gray-100/50 p-6 space-y-3 shadow-sm">
                                <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-4">
                                    <Beaker size={18} />
                                    <h4 className="text-sm font-bold uppercase tracking-wide">Record</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Date:</span>
                                        <span className="text-sm font-bold text-slate-800">{formatDate(record.date || (isLatest ? report.date : ''))}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-sm text-slate-500 font-medium capitalize">Time out:</span>
                                        <span className="text-sm font-bold text-slate-800">{formatTime(record.timeOut || (isLatest ? report.timeOut : ''))}</span>
                                    </div>
                                    {['top', 'middle', 'bottom'].map((section, sIdx) => (
                                        <div key={section} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                            <div className="flex justify-between items-center">
                                                <div className="w-1.5 h-1.5 rounded-full" />
                                                <span className="text-sm text-slate-500 font-medium capitalize">{section} Section Body:</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-slate-800">{record[section]?.body || '0'}%</span>
                                                {renderStatusBadge(record[section]?.status)}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-100 pb-4">
                                            <MessageSquare size={18} />
                                            <h4 className="text-sm font-bold uppercase">General Remark</h4>
                                        </div>
                                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-6 min-h-[80px]">
                                            <p className="text-[14px] text-gray-600 font-medium leading-relaxed">
                                                {record.generalRemark || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 mb-4">
                            <History size={32} />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">No Synchronized Audit Flow</h3>
                    </div>
                )}
            </div>

            {/* Footer: Matching the green button style */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Upper Centisimal Index</span>
                        <span className="text-xs font-black text-emerald-600 leading-none mt-1">{specLimit}%</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Nodes</span>
                        <span className="text-xs font-black text-slate-800 leading-none mt-1">{history.length} Entries</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* <button
                        onClick={handlePrint}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Print Report
                    </button> */}
                    <button
                        onClick={onCancel}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default HistoryModelReitmans;
