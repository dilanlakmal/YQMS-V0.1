import React from 'react';

const PaperPreview = ({ data }) => {
    if (!data) return null;
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
    };

    const formData = data;
    const history = formData.history || formData.inspectionRecords || [];
    const ribsVisible = formData.ribsAvailable ?? history.some(h => h.top?.ribs || h.middle?.ribs || h.bottom?.ribs);
    return (
        <div className="mx-6 my-4 p-6 bg-white border rounded shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break-after-always">
            <div className="text-center mb-4">
                <div className="font-bold text-2xl">YORKMARS (CAMBODIA) GARMENTS MFG CO.,LTD</div>
                <div className="text-xl font-semibold">Humidity inspection record</div>
            </div>
            <div className="flex justify-between mb-3 text-sm">
                <div className="w-1/2">
                    <div><span className="font-bold">Buyer style#:</span> {formData.buyerStyle}</div>
                    <div><span className="font-bold">Factory style no:</span> {formData.factoryStyleNo}</div>
                    <div><span className="font-bold">Fabrication:</span> {formData.fabrication}</div>
                    <div><span className="font-bold">Aquaboy spec:</span> {formData.aquaboySpec}</div>
                </div>
                <div className="w-1/2 text-right">
                    <div><span className="font-bold">Customer:</span> {formData.customer}</div>
                    <div><span className="font-bold">Type:</span> {formData.inspectionType}</div>
                    <div><span className="font-bold">Date:</span> {formatDate(formData.date)}</div>
                    <div><span className="font-bold">Color:</span> {formData.colorName}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-lg border border-black">
                    <thead>
                        <tr>
                            <th className="border border-black px-2 py-2" rowSpan="2">Date</th>
                            <th className="border border-black px-2 py-2" rowSpan="2">Color name</th>
                            <th className="border border-black px-2 py-2" rowSpan="2">Before dry room</th>
                            <th className="border border-black px-2 py-2" rowSpan="2">After dry room</th>
                            <th className="border border-black px-2 py-2" colSpan={ribsVisible ? 3 : 2}>Top</th>
                            <th className="border border-black px-2 py-2" colSpan={ribsVisible ? 3 : 2}>Middle</th>
                            <th className="border border-black px-2 py-2" colSpan={ribsVisible ? 3 : 2}>Bottom</th>
                        </tr>
                        <tr>
                            <th className="border border-black px-2 py-2">Body</th>
                            {ribsVisible && <th className="border border-black px-2 py-2">Ribs</th>}
                            <th className="border border-black px-2 py-2">Pass/Fail</th>
                            <th className="border border-black px-2 py-2">Body</th>
                            {ribsVisible && <th className="border border-black px-2 py-2">Ribs</th>}
                            <th className="border border-black px-2 py-2">Pass/Fail</th>
                            <th className="border border-black px-2 py-2">Body</th>
                            {ribsVisible && <th className="border border-black px-2 py-2">Ribs</th>}
                            <th className="border border-black px-2 py-2">Pass/Fail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.history || formData.inspectionRecords || []).map((rec, idx) => {
                            const formatTime = (timeStr) => {
                                if (!timeStr || timeStr === 'N/A') return '';
                                if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

                                const match = timeStr.match(/(\d{1,2}):(\d{2})/);
                                if (!match) {
                                    if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.includes(' '))) {
                                        const date = new Date(timeStr);
                                        if (isNaN(date.getTime())) return timeStr;
                                        return date.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        });
                                    }
                                    return timeStr;
                                }

                                const hour = parseInt(match[1], 10);
                                const minute = match[2];
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const h12 = hour % 12 || 12;
                                return `${h12}:${minute} ${ampm}`;
                            };

                            // Read times ONLY from history entry
                            const beforeTime = rec.beforeDryRoom || rec.beforeDryRoomTime || '';
                            const afterTime = rec.afterDryRoom || rec.afterDryRoomTime || '';

                            return (
                                <tr key={idx}>
                                    <td className="border border-black px-2 py-2 text-center">{formatDate(rec.date || formData.date)}</td>
                                    <td className="border border-black px-2 py-2 text-center">{rec.colorName || formData.colorName || ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{formatTime(beforeTime)}</td>
                                    <td className="border border-black px-2 py-2 text-center">{formatTime(afterTime)}</td>
                                    {['top', 'middle', 'bottom'].map(section => {
                                        const s = rec[section] || {};
                                        // Get status from database or calculate from pass/fail flags
                                        const status = s.status || (s.fail ? 'fail' : (s.pass ? 'pass' : ''));
                                        return (
                                            <React.Fragment key={section}>
                                                <td className="border border-black px-2 py-2 text-center">
                                                    {s.body || ''}
                                                    {s.bodyStatus && <div className={`text-[8px] font-bold uppercase ${s.bodyStatus === 'fail' ? 'text-red-600' : 'text-green-600'}`}>{s.bodyStatus}</div>}
                                                </td>
                                                {ribsVisible && (
                                                    <td className="border border-black px-2 py-2 text-center">
                                                        {s.ribs || ''}
                                                        {s.ribsStatus && <div className={`text-[8px] font-bold uppercase ${s.ribsStatus === 'fail' ? 'text-red-600' : 'text-green-600'}`}>{s.ribsStatus}</div>}
                                                    </td>
                                                )}
                                                <td className={`border border-black px-2 py-2 text-center ${status === 'fail' ? 'font-bold text-red-600' : (status === 'pass' ? 'font-bold text-green-600' : '')}`}>
                                                    {status === 'fail' ? 'Fail' : (status === 'pass' ? 'Pass' : '')}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 border border-black rounded overflow-hidden">
                <div className="font-bold text-lg bg-gray-50 px-3 py-3 border-b border-black uppercase text-gray-700">Remark / Comments</div>
                <div className="p-3 min-h-[60px] text-lg text-gray-800">
                    {formData.generalRemark || 'No additional remarks.'}
                </div>
            </div>

            <div className="mt-2 flex justify-end px-16 gap-8">
                <div className="w-64 border-b border-black text-center p-6 font-bold">Inspector</div>
                <div className="w-64 border-b border-black text-center p-6 font-bold">QAM / Supervisor</div>
            </div>
            <div className="h-8 print:hidden"></div>
        </div>
    );
};

export default PaperPreview;