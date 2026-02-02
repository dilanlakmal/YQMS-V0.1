import React from "react";

const PaperPreviewReitmans = ({ data }) => {
  if (!data) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      return "N/A";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "N/A") return "N/A";
    try {
      if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;

      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return timeStr;

      let hour = parseInt(match[1], 10);
      const minute = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formData = data;
  const rawHistory = formData.history || formData.inspectionRecords || [];

  // Helper to flatten nested history if it's an object/Map
  const getFlattenedHistory = (history) => {
    if (Array.isArray(history)) return history;
    if (typeof history !== "object" || history === null) return [];

    // For Reitmans, we might want to just show the latest check of each item
    // or all checks. Usually for paper preview we show everything.
    return Object.keys(history)
      .sort((a, b) => {
        const numA = parseInt(a.replace("Item ", ""));
        const numB = parseInt(b.replace("Item ", ""));
        return numA - numB;
      })
      .flatMap((itemKey) => {
        const checks = history[itemKey] || {};
        return Object.keys(checks)
          .sort((a, b) => {
            const numA = parseInt(a.replace("Check ", ""));
            const numB = parseInt(b.replace("Check ", ""));
            return numA - numB;
          })
          .map((checkKey) => ({
            ...checks[checkKey],
            itemName: itemKey,
            checkName: checkKey,
          }));
      });
  };

  const history = getFlattenedHistory(rawHistory);

  // Find the max reading for the "before" dehumidify rate across any history entries
  const getMoistureBefore = () => {
    if (formData.moistureRateBeforeDehumidify)
      return formData.moistureRateBeforeDehumidify;
    // Fallback to max of readings if not explicitly provided
    let max = 0;
    history.forEach((rec) => {
      ["top", "middle", "bottom"].forEach((s) => {
        const val = parseFloat(rec[s]?.body);
        if (!isNaN(val) && val > max) max = val;
      });
    });
    return max ? `${max}%` : "N/A";
  };

  return (
    <div className="reitmans-preview-container p-4 font-sans text-sm bg-white text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    body { -webkit-print-color-adjust: exact; margin: 0; }
                    .no-print { display: none !important; height: 0 !important; overflow: hidden !important; }
                    .reitmans-preview-container { padding: 0 !important; width: 100% !important; height: auto !important; min-height: 0 !important; }
                    table { page-break-inside: avoid; }
                }
                .reitmans-table th, .reitmans-table td {
                    border: 0.5px solid #000;
                    padding: 4px;
                    text-align: center;
                    vertical-align: middle;
                    line-height: normal;
                }
                .reitmans-table th {
                    background-color: #f8f8f8;
                    font-weight: 600;
                }
                .vertical-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    font-size: 9px;
                }
                .bilingual-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1px;
                }
                .label-cn { font-size: 10px; }
                .label-en { font-size: 8px; font-weight: normal; }
            `,
        }}
      />

      {/* Top Branding Section */}
      <div className="flex justify-between items-start mb-2 px-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter leading-none">
            RCL ASIA
          </h1>
          <span className="text-[12px] font-bold tracking-widest mt-1 pt-1">
            LIMITED
          </span>
        </div>
        <div className="text-center flex-1 mx-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold inline-block px-10 mb-1">
            大貨抽濕記錄表
          </h2>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-right flex flex-col">
            <span className="text-2xl font-bold">
              {formData.date
                ? new Date(formData.date)
                  .toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                  .replace(" ", " , ")
                : new Date()
                  .toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                  .replace(" ", " , ")}
            </span>
            <span className="text-[12px] font-bold mt-1">
              Style#: {formData.moNo || formData.factoryStyleNo || "N/A"}
            </span>
          </div>
          <div className="mt-1 ml-6">
            <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-lg text-black">
              J
            </div>
          </div>
        </div>
      </div>

      {/* Main RCL Log Table */}
      <table className="reitmans-table w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[5%] text-[14px] font-bold">Date</th>
            <th className="w-[10%] text-[14px] font-bold">Buyer Style #</th>
            <th className="w-[10%] text-[14px] font-bold">Color</th>
            <th className="w-[8%] text-[14px] font-bold">PO #</th>
            <th className="w-[11%] text-[14px] font-bold">Composition</th>
            <th className="w-[7%] text-[14px] font-bold leading-tight">
              Time Checked
            </th>
            <th className="w-[6%] text-[14px] font-bold leading-tight">
              No.pc checked
            </th>
            <th className="w-[11%] text-[14px] font-bold leading-tight">
              Moisture rate before
            </th>
            <th className="w-[6%] text-[14px] font-bold">Time In</th>
            <th className="w-[6%] text-[14px] font-bold">Time out</th>
            <th className="w-[7%] text-[14px] font-bold leading-tight">
              Moisture rate after
            </th>
            <th className="w-[8%] text-[14px] leading-tight font-bold">
              Upper Centisimal Index
            </th>
            <th className="w-[10%] text-[14px] font-bold">Signature</th>
          </tr>
        </thead>
        <tbody>
          {history.map((rec, idx) => {
            // Max moisture for this specific record
            let rowMax = 0;
            ["top", "middle", "bottom"].forEach((s) => {
              const val = parseFloat(rec[s]?.body);
              if (!isNaN(val) && val > rowMax) rowMax = val;
            });
            const moistureBefore = rowMax
              ? `${rowMax}%`
              : formData.moistureRateBeforeDehumidify
                ? `${formData.moistureRateBeforeDehumidify}%`
                : "N/A";

            return (
              <tr key={idx} className="h-12 text-[15px] font-medium">
                <td>{formatDate(rec.date || formData.date)}</td>
                <td className="font-bold">
                  {formData.buyerStyle || formData.factoryStyleNo || "N/A"}
                </td>
                <td>{formData.colorName || "N/A"}</td>
                <td>{formData.poLine || "N/A"}</td>
                <td className="text-[14px] leading-tight px-1">
                  {formData.composition || "N/A"}
                </td>
                <td>{formatTime(rec.saveTime || formData.timeChecked)}</td>
                <td className="font-bold text-[16px]">
                  {formData.noPcChecked || "N/A"}
                </td>
                <td className="font-bold text-gray-700">{moistureBefore}</td>
                <td>{formatTime(formData.timeIn)}</td>
                <td>{formatTime(formData.timeOut)}</td>
                <td className="font-bold text-blue-800 text-[16px]">
                  {formData.moistureRateAfter || "N/A"}%
                </td>
                <td className="font-black text-rose-700 text-[16px]">
                  {formData.upperCentisimalIndex || "N/A"}%
                </td>
                <td className="relative p-0 pt-2">
                  {formData.inspectorSignature && (
                    <img
                      src={formData.inspectorSignature}
                      className="max-h-10 mx-auto grayscale"
                      alt="sig"
                    />
                  )}
                  {(formData.updatedBy?.engName ||
                    formData.createdBy?.engName) && (
                      <div className="text-[10px] font-bold text-gray-800 mt-1 uppercase">
                        {formData.updatedBy?.engName ||
                          formData.createdBy?.engName}
                      </div>
                    )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Detailed Readings Section (Optional/Sub-info) */}
      <div className="mt-4">
        {/* <div className="border border-black p-2 rounded">
                    <h4 className="font-bold text-[10px] uppercase border-b border-black mb-1 p-1 bg-gray-50">Detailed Site Readings (Top, Middle, Bottom)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1">Type</th>
                                    <th className="text-center">Top</th>
                                    <th className="text-center">Middle</th>
                                    <th className="text-center">Bottom</th>
                                    <th className="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((rec, idx) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="font-bold py-1">Check {idx + 1}</td>
                                        <td className="text-center">{rec.top?.body || 'N/A'}%</td>
                                        <td className="text-center">{rec.middle?.body || 'N/A'}%</td>
                                        <td className="text-center">{rec.bottom?.body || 'N/A'}%</td>
                                        <td className="text-center">
                                            <span className={`px-1 py-0.5 rounded-sm font-bold text-[8px] ${rec.top?.status === 'pass' && rec.middle?.status === 'pass' && rec.bottom?.status === 'pass'
                                                ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {rec.top?.status === 'pass' && rec.middle?.status === 'pass' && rec.bottom?.status === 'pass' ? 'PASS' : 'FAIL'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div> */}
        <div className="border border-black p-4 rounded flex flex-col w-full">
          <h4 className="font-bold text-[12px] uppercase border-b border-black mb-2 p-1 bg-gray-50">
            General Remarks
          </h4>
          <div className="flex-1 p-1 text-[13px] italic text-gray-600 min-h-[60px]">
            {formData.generalRemark || "No additional remarks."}
          </div>
          {formData.qamSignature && (
            <div className="mt-2 border-t border-gray-200 pt-2 text-right">
              <span className="text-[10px] font-bold block">Supervisor:</span>
              <img
                src={formData.qamSignature}
                className="max-h-12 ml-auto grayscale opacity-80"
                alt="supervisor"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperPreviewReitmans;
