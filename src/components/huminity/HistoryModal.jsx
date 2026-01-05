import React from 'react';
import { Modal, Image } from 'antd';

const HistoryModal = ({ open, onCancel, report, formatDate, formatTime }) => {
    if (!report) return null;

    const history = report.history || [];

    return (
        <Modal
            title={null}
            closeIcon={null}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={1300}
            centered
            styles={{
                body: {
                    padding: 0,
                    overflow: 'hidden',
                },
                content: {
                    padding: 0,
                    borderRadius: '16px',
                    overflow: 'hidden'
                },
                mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' }
            }}
        >
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-6 relative overflow-hidden w-full">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-0.5 tracking-tight">Inspection History</h3>
                            <div className="flex items-center gap-2 text-blue-100 text-sm opacity-90">
                                <span className="font-semibold uppercase tracking-wider">{report.factoryStyleNo || 'N/A'}</span>
                                <span className="opacity-40">•</span>
                                <span>{report.buyerStyle || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

            </div>

            <div className="bg-white">
                <div className="overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-gray-200" rowSpan={2}>Nº</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-l border-gray-200" rowSpan={2}>Date</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-l border-gray-200" rowSpan={2}>Before Dry</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-l border-gray-200" rowSpan={2}>After Dry</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-blue-600 uppercase tracking-widest border-b border-l border-gray-200 bg-blue-50/30" colSpan="3">Top Section</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-l border-gray-200 bg-indigo-50/30" colSpan="3">Middle Section</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-purple-600 uppercase tracking-widest border-b border-l border-gray-200 bg-purple-50/30" colSpan="3">Bottom Section</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-l border-gray-200" rowSpan={2}>Photos</th>
                            </tr>
                            <tr className="bg-gray-50/50">
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-l border-gray-200 bg-blue-50/10">Body</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">Ribs</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">Status</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-l border-gray-200 bg-indigo-50/10">Body</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">Ribs</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">Status</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-l border-gray-200 bg-purple-50/10">Body</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">Ribs</th>
                                <th className="px-2 py-2.5 text-center font-bold text-gray-700 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((check, checkIdx) => (
                                <tr key={checkIdx} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-4 py-3.5 text-center font-bold text-gray-400 group-hover:text-blue-600">{checkIdx + 1}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">{formatDate(check.date)}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">{formatTime(check.beforeDryRoom || check.beforeDryRoomTime)}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">{formatTime(check.afterDryRoom || check.afterDryRoomTime)}</td>
                                    {/* Top Section */}
                                    <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">{check.top?.body || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-blue-50/5">{check.top?.ribs || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center bg-blue-50/5">
                                        {renderStatusBadge(check.top?.status)}
                                    </td>
                                    {/* Middle Section */}
                                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-indigo-50/5">{check.middle?.body || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-indigo-50/5">{check.middle?.ribs || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center bg-indigo-50/5">
                                        {renderStatusBadge(check.middle?.status)}
                                    </td>
                                    {/* Bottom Section */}
                                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-purple-50/5">{check.bottom?.body || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-purple-50/5">{check.bottom?.ribs || 'N/A'}</td>
                                    <td className="px-4 py-3.5 text-center bg-purple-50/5">
                                        {renderStatusBadge(check.bottom?.status)}
                                    </td>
                                    <td className="px-4 py-3.5 text-center border-l border-gray-50">
                                        {check.images && check.images.length > 0 ? (
                                            <div className="flex -space-x-2 justify-center hover:space-x-1 transition-all">
                                                <Image.PreviewGroup>
                                                    {check.images.map((img, i) => (
                                                        <div key={img.id || i} className="relative group/img">
                                                            <Image
                                                                src={img.preview}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-lg object-cover border-2 border-white shadow-sm cursor-zoom-in"
                                                                fallback="https://via.placeholder.com/40?text=Error"
                                                            />
                                                        </div>
                                                    ))}
                                                </Image.PreviewGroup>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] uppercase font-bold tracking-widest italic">No Photos</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {history.length > 0 && history[history.length - 1]?.generalRemark && (
                    <div className="mt-8 p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-blue-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 m-0 tracking-tight">Latest Remark</h3>
                        </div>

                        <div className="bg-white border border-blue-200/60 rounded-2xl p-6 shadow-sm">
                            <p className="text-slate-600 text-lg font-medium leading-relaxed m-0">
                                {history[history.length - 1].generalRemark}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const renderStatusBadge = (status) => {
    if (status === 'pass') {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="font-bold text-[10px] uppercase tracking-wider">Pass</span>
            </div>
        );
    }
    if (status === 'fail') {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></div>
                <span className="font-bold text-[10px] uppercase tracking-wider">Fail</span>
            </div>
        );
    }
    return (
        <span className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">N/A</span>
    );
};

export default HistoryModal;
