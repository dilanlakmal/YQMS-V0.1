import React from "react";

const PaperPreview = ({ data }) => {
  if (!data) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "N/A") return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;

    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) {
      if (
        timeStr.includes("T") ||
        (timeStr.includes("-") && timeStr.includes(" "))
      ) {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr;
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
      return timeStr;
    }

    const hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  const formData = data;
  const rawHistory = formData.history || formData.inspectionRecords || [];

  // Helper to group nested history by Session (Item 1, Item 2, etc.)
  const getGroupedHistory = (history) => {
    if (Array.isArray(history)) {
      if (history.length > 0 && (history[0].itemName || history[0].checkName)) {
        const sessions = {};
        history.forEach((item) => {
          const ck = item.checkName || "Item 1";
          if (!sessions[ck]) sessions[ck] = { name: ck, items: [] };
          sessions[ck].items.push(item);
        });
        return Object.keys(sessions)
          .sort((a, b) => {
            const numA = parseInt(a.replace("Item ", ""));
            const numB = parseInt(b.replace("Item ", ""));
            return numA - numB;
          })
          .map((k) => sessions[k]);
      }
      return history.map((h, i) => ({
        name: h.checkName || `Item ${i + 1}`,
        items: [{ ...h, itemName: h.itemName || "Check 1" }],
      }));
    }

    if (typeof history !== "object" || history === null) return [];

    const sessions = {};
    Object.keys(history).forEach((itemKey) => {
      const checks = history[itemKey] || {};
      Object.keys(checks).forEach((checkKey) => {
        // Here itemKey is expected to be "Item 1" and checkKey "Check 1"
        // But PaperPreview was using checkName for session and itemName for reading.
        // We normalize to Session = itemKey, Reading = checkKey
        if (!sessions[itemKey]) {
          sessions[itemKey] = {
            name: itemKey,
            items: [],
          };
        }
        sessions[itemKey].items.push({
          ...checks[checkKey],
          itemName: checkKey,
          checkName: itemKey,
        });
      });
    });

    return Object.keys(sessions)
      .sort((a, b) => {
        const numA = parseInt(a.replace("Item ", ""));
        const numB = parseInt(b.replace("Item ", ""));
        return numA - numB;
      })
      .map((k) => sessions[k]);
  };

  const groupedHistory = getGroupedHistory(rawHistory);
  const flattenedHistory = groupedHistory.flatMap((s) => s.items);

  const getItemStatus = (item) => {
    const getSStatus = (s) =>
      s?.status === "pass" || !s?.status ? "pass" : "fail";
    return getSStatus(item.top) === "pass" &&
      getSStatus(item.middle) === "pass" &&
      getSStatus(item.bottom) === "pass"
      ? "pass"
      : "fail";
  };

  const getSessionStatus = (session) => {
    if (!session || !session.items) return "fail";
    return session.items.every((item) => getItemStatus(item) === "pass")
      ? "pass"
      : "fail";
  };

  const ribsVisible =
    formData.ribsAvailable ??
    flattenedHistory.some(
      (h) => h.top?.ribs || h.middle?.ribs || h.bottom?.ribs,
    );

  return (
    <div className="mx-6 my-4 p-6 bg-white border rounded shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 page-break-after-always">
      <div className="text-center mb-4">
        <div className="font-bold text-2xl uppercase">
          YORKMARS (CAMBODIA) GARMENTS MFG CO.,LTD
        </div>
        <div className="text-xl font-semibold">Humidity inspection record</div>
      </div>

      <div className="flex justify-between mb-3 text-sm">
        <div className="w-1/2">
          <div>
            <span className="font-bold">Buyer style#:</span>{" "}
            {formData.buyerStyle}
          </div>
          <div>
            <span className="font-bold">Factory style no:</span>{" "}
            {formData.factoryStyleNo}
          </div>
          <div>
            <span className="font-bold">Fabrication:</span>{" "}
            {formData.fabrication}
          </div>
          <div>
            <span className="font-bold">Aquaboy spec (Body):</span>{" "}
            {formData.aquaboySpecBody || formData.aquaboySpec}
          </div>
          {ribsVisible && (
            <div>
              <span className="font-bold">Aquaboy spec (Ribs):</span>{" "}
              {formData.aquaboySpecRibs || formData.aquaboySpec}
            </div>
          )}
        </div>
        <div className="w-1/2 text-right">
          <div>
            <span className="font-bold">Customer:</span> {formData.customer}
          </div>
          <div>
            <span className="font-bold">Type:</span> {formData.inspectionType}
          </div>
          <div>
            <span className="font-bold">Date:</span> {formatDate(formData.date)}
          </div>
          <div>
            <span className="font-bold">Color:</span> {formData.colorName}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm border border-black table-fixed py-6">
          <colgroup>
            <col className="w-[70px]" /> {/* Check */}
            <col className="w-[110px]" /> {/* Date */}
            <col className="w-[120px]" /> {/* Customer */}
            <col className="w-[150px]" /> {/* Fabrication */}
            <col className="w-[110px]" /> {/* Color */}
            <col className="w-[100px]" /> {/* Before Dry Room */}
            <col className="w-[100px]" /> {/* After Dry Room */}
            {/* Sections */}
            <col className="w-[75px]" /> {/* Top Body */}
            {ribsVisible && <col className="w-[75px]" />} {/* Top Rib */}
            <col className="w-[75px]" /> {/* Mid Body */}
            {ribsVisible && <col className="w-[75px]" />} {/* Mid Rib */}
            <col className="w-[75px]" /> {/* Bot Body */}
            {ribsVisible && <col className="w-[75px]" />} {/* Bot Rib */}
            <col className="w-[90px]" /> {/* Total Result */}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 font-bold uppercase text-[15px]">
              <th className="border border-black px-1 py-2">Check</th>
              <th className="border border-black px-1 py-2">Date</th>
              <th className="border border-black px-1 py-2">Customer</th>
              <th className="border border-black px-1 py-2">Fabrication</th>
              <th className="border border-black px-1 py-2">Color</th>
              <th className="border border-black px-2 py-2 leading-tight">
                Before Dry Room
              </th>
              <th className="border border-black px-2 py-2 leading-tight">
                After Dry Room
              </th>
              <th
                className="border border-black px-1 py-2"
                colSpan={ribsVisible ? 2 : 1}
              >
                Top Section
              </th>
              <th
                className="border border-black px-1 py-2"
                colSpan={ribsVisible ? 2 : 1}
              >
                Middle Section
              </th>
              <th
                className="border border-black px-1 py-2"
                colSpan={ribsVisible ? 2 : 1}
              >
                Bottom Section
              </th>
              <th className="border border-black px-1 py-2">Total Result</th>
            </tr>
            <tr className="bg-gray-50 font-bold uppercase text-[13px]">
              <th className="border border-black px-2 py-2" colSpan={7}></th>
              <th className="border border-black px-2 py-2">Body</th>
              {ribsVisible && (
                <th className="border border-black px-2 py-2">Rib</th>
              )}
              <th className="border border-black px-2 py-2">Body</th>
              {ribsVisible && (
                <th className="border border-black px-2 py-2">Rib</th>
              )}
              <th className="border border-black px-2 py-2">Body</th>
              {ribsVisible && (
                <th className="border border-black px-2 py-2">Rib</th>
              )}
              <th className="border border-black px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {groupedHistory.map((session, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* Session Header */}
                <tr className="bg-green-50/30">
                  <td
                    colSpan={ribsVisible ? 14 : 11}
                    className="border border-black px-3 py-2 font-bold text-green-700"
                  >
                    <div className="flex justify-between items-center uppercase tracking-wider text-xs">
                      <span>{session.name}</span>
                      <span>
                        Item Result: {getSessionStatus(session).toUpperCase()}
                      </span>
                    </div>
                  </td>
                </tr>
                {session.items.map((item, iIdx) => {
                  const status = getItemStatus(item);
                  const add = item.additional || {};
                  return (
                    <React.Fragment key={iIdx}>
                      <tr className="text-xs">
                        <td className="border border-black px-1 py-2 text-center font-bold">
                          {item.itemName || `Check ${iIdx + 1}`}
                        </td>
                        <td className="border border-black px-1 py-2 text-center whitespace-nowrap">
                          {formatDate(item.date || formData.date)}
                        </td>
                        <td className="border border-black px-1 py-2 text-center truncate">
                          {item.customer || formData.customer}
                        </td>
                        <td className="border border-black px-2 py-2 text-center leading-tight">
                          {item.fabrication || formData.fabrication}
                        </td>
                        <td className="border border-black px-1 py-2 text-center truncate">
                          {item.colorName || item.color || formData.colorName}
                        </td>
                        <td className="border border-black px-1 py-2 text-center">
                          {formatTime(
                            item.beforeDryRoom || item.beforeDryRoomTime,
                          )}
                        </td>
                        <td className="border border-black px-1 py-2 text-center">
                          {formatTime(
                            item.afterDryRoom || item.afterDryRoomTime,
                          )}
                        </td>

                        {["top", "middle", "bottom"].map((sect) => {
                          const s = item[sect] || {};
                          const status = s.status || (s.body ? "pass" : "");
                          return (
                            <React.Fragment key={sect}>
                              <td className="border border-black px-1 py-1 text-center">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="font-semibold">
                                    {s.body || "-"}
                                  </span>
                                  {status && (
                                    <span
                                      className={`text-[10px] font-black uppercase ${status === "fail" ? "text-red-600" : "text-green-600"}`}
                                    >
                                      {status}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {ribsVisible && (
                                <td className="border border-black px-1 py-1 text-center">
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="font-semibold">
                                      {s.ribs || "-"}
                                    </span>
                                    {status && (
                                      <span
                                        className={`text-[10px] font-black uppercase ${status === "fail" ? "text-red-600" : "text-green-600"}`}
                                      >
                                        {status}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                            </React.Fragment>
                          );
                        })}

                        <td
                          className={`border border-black px-1 py-2 text-center font-black uppercase text-xs ${
                            status === "fail"
                              ? "text-red-600 bg-red-50"
                              : "text-green-600 bg-green-50"
                          }`}
                        >
                          {status}
                        </td>
                      </tr>

                      {/* Additional Readings row if any */}
                      {(add.top?.body ||
                        add.middle?.body ||
                        add.bottom?.body) && (
                        <tr className="bg-gray-50/50 italic text-[12px]">
                          <td
                            className="border border-black px-1 py-2 text-center font-bold text-gray-400"
                            colSpan={7}
                          >
                            Add. Readings
                          </td>
                          {["top", "middle", "bottom"].map((sect) => {
                            const s = add[sect] || {};
                            const status = s.status || (s.body ? "pass" : "");
                            return (
                              <React.Fragment key={sect}>
                                <td className="border border-black px-1 py-1 text-center">
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span>{s.body || "-"}</span>
                                    {status && (
                                      <span
                                        className={`text-[9px] font-black uppercase ${status === "fail" ? "text-red-500" : "text-green-500"}`}
                                      >
                                        {status}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {ribsVisible && (
                                  <td className="border border-black px-1 py-1 text-center">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <span>{s.ribs || "-"}</span>
                                      {status && (
                                        <span
                                          className={`text-[9px] font-black uppercase ${status === "fail" ? "text-red-500" : "text-green-500"}`}
                                        >
                                          {status}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <td className="border border-black px-1 py-2"></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 items-start print:grid-cols-2">
        <div className="border border-black rounded overflow-hidden flex flex-col">
          <div className="font-bold text-sm bg-gray-50 px-3 py-3 border-b border-black uppercase text-gray-700">
            Remark / Comments
          </div>
          <div className="p-3 py-10 text-sm text-gray-800">
            {formData.generalRemark || "No additional remarks."}
          </div>
        </div>

        {flattenedHistory.some((rec) => rec.images && rec.images.length > 0) ? (
          <div className="border border-black rounded overflow-hidden print:break-inside-avoid flex flex-col">
            <div className="font-bold text-sm bg-gray-50 px-3 py-3 border-b border-black uppercase text-gray-700">
              Inspection Proof Photos
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 content-start">
              {flattenedHistory
                .flatMap((rec) => rec.images || [])
                .map((img, i) => (
                  <div
                    key={img.id || i}
                    className="flex flex-col items-center gap-1"
                  >
                    <img
                      src={img.preview}
                      alt={`Proof ${i}`}
                      className="w-full h-auto max-h-[250px] object-contain border border-gray-300 rounded"
                    />
                    <span className="text-[8px] text-gray-500 truncate w-full text-center">
                      {img.name || `Photo ${i + 1}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="border border-black rounded overflow-hidden bg-gray-50/30 flex items-center justify-center italic text-gray-400 text-xs text-center p-16">
            No inspection photos available
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end px-10 gap-8">
        <div className="flex flex-col items-center">
          <div className="w-48 text-center p-4 font-bold pb-2 border-b border-black">
            Inspector
          </div>
          {(formData.updatedBy?.engName || formData.createdBy?.engName) && (
            <div className="text-xs font-medium text-gray-700 mt-2">
              {formData.updatedBy?.engName || formData.createdBy?.engName}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="w-48 text-center p-4 font-bold pb-2 border-b border-black">
            QAM / Supervisor
          </div>
          {formData.approvalStatus === "approved" && formData.approvedBy && (
            <div className="mt-2 text-center">
              <div className="text-green-700 font-bold text-xs uppercase">
                ✓ Approved
              </div>
              <div className="text-[10px] text-gray-600">
                by {formData.approvedBy.engName || formData.approvedBy.empId}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-4 print:hidden"></div>
    </div>
  );
};

export default PaperPreview;
