import React from "react";
import { Modal, Image } from "antd";

const HistoryModal = ({ open, onCancel, report, formatDate, formatTime }) => {
  if (!report) return null;

  const history = report.history || [];
  const ribsVisible =
    report.ribsAvailable ??
    history.some((h) => h.top?.ribs || h.middle?.ribs || h.bottom?.ribs);

  return (
    <Modal
      title={null}
      closeIcon={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1500}
      centered
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
        },
        content: {
          padding: 0,
          borderRadius: "16px",
          overflow: "hidden",
        },
        mask: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
      }}
    >
      <div className="bg-gradient-to-r from-green-50 to-green-50 border border-gray-200 border-b-0 px-8 py-6 relative overflow-hidden w-full shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
          <svg
            className="w-32 h-32 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 backdrop-blur-md rounded-xl border border-green-500/30 shadow-inner">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-500 mb-1 tracking-tight">
                Inspection History
              </h3>
              <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                <span className="bg-green-500/20 px-2 py-0.5 rounded text-green-500 backdrop-blur-sm">
                  {report.factoryStyleNo || "N/A"}
                </span>
                <span className="opacity-70">•</span>
                <span className="text-green-500/90">
                  {report.buyerStyle || "N/A"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-green-600/80 text-[11px] font-bold mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                  <span className="text-[12px] uppercase text-green-600/60 tracking-wider">
                    Customer:
                  </span>
                  <span className="text-green-700 text-[12px]">
                    {report.customer || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                  <span className="text-[12px] uppercase text-green-600/60 tracking-wider">
                    Fabrication:
                  </span>
                  <span className="text-green-700 text-[12px]">
                    {report.fabrication || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                  <span className="text-[12px] uppercase text-green-600/60 tracking-wider">
                    Color:
                  </span>
                  <span className="text-green-700 text-[12px]">
                    {report.colorName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                  <span className="text-[12px] uppercase text-green-600/60 tracking-wider">
                    Spec (Body):
                  </span>
                  <span className="text-green-700 text-[12px]">
                    {report.aquaboySpec ? `${report.aquaboySpec}%` : "N/A"}
                  </span>
                </div>
                {ribsVisible && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/40 border border-green-200/50 rounded-lg shadow-sm backdrop-blur-sm">
                    <span className="text-[12px] uppercase text-green-600/60 tracking-wider">
                      Spec (Ribs):
                    </span>
                    <span className="text-green-700 text-[12px]">
                      {report.aquaboySpecRibs
                        ? `${report.aquaboySpecRibs}%`
                        : "N/A"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 bg-gray-500/20 hover:bg-gray-500/50 rounded-full transition-all text-white backdrop-blur-sm group"
          >
            <svg
              className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white">
        <div className="overflow-hidden border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100/80">
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200"
                  rowSpan={2}
                >
                  Nº
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                  rowSpan={2}
                >
                  Date
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                  rowSpan={2}
                >
                  Before Dry
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                  rowSpan={2}
                >
                  After Dry
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                  colSpan={ribsVisible ? 3 : 2}
                >
                  Top Section
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                  colSpan={ribsVisible ? 3 : 2}
                >
                  Middle Section
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200 bg-green-50/30"
                  colSpan={ribsVisible ? 3 : 2}
                >
                  Bottom Section
                </th>
                <th
                  className="px-4 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-l border-gray-200"
                  rowSpan={2}
                >
                  Photos
                </th>
              </tr>
              <tr className="bg-gray-100/80">
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-blue-50/10">
                  Body
                </th>
                {ribsVisible && (
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">
                    Ribs
                  </th>
                )}
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-blue-50/10">
                  Status
                </th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-indigo-50/10">
                  Body
                </th>
                {ribsVisible && (
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">
                    Ribs
                  </th>
                )}
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-indigo-50/10">
                  Status
                </th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-l border-gray-200 bg-purple-50/10">
                  Body
                </th>
                {ribsVisible && (
                  <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">
                    Ribs
                  </th>
                )}
                <th className="px-2 py-2.5 text-center font-bold text-gray-800 text-[10px] uppercase border-b border-gray-200 bg-purple-50/10">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b">
              {history.map((check, checkIdx) => (
                <tr
                  key={checkIdx}
                  className="hover:bg-indigo-50/50 transition-colors group border-b"
                >
                  <td className="px-4 py-3.5 text-center font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                    {checkIdx + 1}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                    {formatDate(check.date)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                    {formatTime(check.beforeDryRoom || check.beforeDryRoomTime)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                    {formatTime(check.afterDryRoom || check.afterDryRoomTime)}
                  </td>
                  {/* Top Section */}
                  <td className="px-4 py-3.5 text-center text-gray-600 border-l border-gray-50 font-medium">
                    <div className="flex flex-col items-center">
                      <span>{check.top?.body || "N/A"}</span>
                      {check.top?.bodyStatus && (
                        <span
                          className={`text-[8px] font-bold uppercase ${check.top.bodyStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                        >
                          {check.top.bodyStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  {ribsVisible && (
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-blue-50/5">
                      <div className="flex flex-col items-center">
                        <span>{check.top?.ribs || "N/A"}</span>
                        {check.top?.ribsStatus && (
                          <span
                            className={`text-[8px] font-bold uppercase ${check.top.ribsStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                          >
                            {check.top.ribsStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center bg-blue-50/5">
                    {renderStatusBadge(check.top?.status)}
                  </td>
                  {/* Middle Section */}
                  <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-indigo-50/5">
                    <div className="flex flex-col items-center">
                      <span>{check.middle?.body || "N/A"}</span>
                      {check.middle?.bodyStatus && (
                        <span
                          className={`text-[8px] font-bold uppercase ${check.middle.bodyStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                        >
                          {check.middle.bodyStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  {ribsVisible && (
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-indigo-50/5">
                      <div className="flex flex-col items-center">
                        <span>{check.middle?.ribs || "N/A"}</span>
                        {check.middle?.ribsStatus && (
                          <span
                            className={`text-[8px] font-bold uppercase ${check.middle.ribsStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                          >
                            {check.middle.ribsStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center bg-indigo-50/5">
                    {renderStatusBadge(check.middle?.status)}
                  </td>
                  {/* Bottom Section */}
                  <td className="px-4 py-3.5 text-center text-gray-600 font-medium border-l border-gray-50 bg-purple-50/5">
                    <div className="flex flex-col items-center">
                      <span>{check.bottom?.body || "N/A"}</span>
                      {check.bottom?.bodyStatus && (
                        <span
                          className={`text-[8px] font-bold uppercase ${check.bottom.bodyStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                        >
                          {check.bottom.bodyStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  {ribsVisible && (
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium bg-purple-50/5">
                      <div className="flex flex-col items-center">
                        <span>{check.bottom?.ribs || "N/A"}</span>
                        {check.bottom?.ribsStatus && (
                          <span
                            className={`text-[8px] font-bold uppercase ${check.bottom.ribsStatus === "pass" ? "text-green-500" : "text-rose-500"}`}
                          >
                            {check.bottom.ribsStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center bg-purple-50/5">
                    {renderStatusBadge(check.bottom?.status)}
                  </td>
                  <td className="px-4 py-3.5 text-center border-l border-gray-50">
                    {check.images && check.images.length > 0 ? (
                      <div className="flex -space-x-2 justify-center hover:space-x-1 transition-all">
                        <Image.PreviewGroup>
                          {check.images.map((img, i) => (
                            <div
                              key={img.id || i}
                              className="relative group/img"
                            >
                              <Image
                                src={img.preview}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover border-2 border-white shadow-sm cursor-zoom-in group-hover/img:scale-110 transition-transform"
                                fallback="https://via.placeholder.com/40?text=Error"
                              />
                            </div>
                          ))}
                        </Image.PreviewGroup>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-[10px] uppercase font-bold tracking-widest italic">
                        No Photos
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length > 0 && history[history.length - 1]?.generalRemark && (
          <div className="mt-2 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 m-0 tracking-tight">
                Latest Remark
              </h3>
            </div>

            <div className="bg-white/80 backdrop-green-50 border border-green-100 rounded-xl p-6 shadow-sm ring-1 ring-green-100/50">
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
  if (status === "pass") {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 shadow-sm transition-all hover:scale-105 active:scale-95">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
        <span className="font-bold text-[10px] uppercase tracking-wider">
          Pass
        </span>
      </div>
    );
  }
  if (status === "fail") {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 shadow-sm transition-all hover:scale-105 active:scale-95">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></div>
        <span className="font-bold text-[10px] uppercase tracking-wider">
          Fail
        </span>
      </div>
    );
  }
  return (
    <span className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">
      N/A
    </span>
  );
};

export default HistoryModal;
