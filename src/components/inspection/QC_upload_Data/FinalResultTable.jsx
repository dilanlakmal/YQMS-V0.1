const PREVIEW_ROW_LIMIT = 100;

function flattenByInspectionQCMono(data) {
  const rows = [];
  data.forEach((item) => {
    // Find all unique MONo in Output_data
    const monoSet = new Set();
    if (Array.isArray(item.Output_data)) {
      item.Output_data.forEach((o) => {
        if (o.MONo) monoSet.add(o.MONo);
      });
    }
    if (Array.isArray(item.Defect_data)) {
      item.Defect_data.forEach((d) => {
        if (d.MONo) monoSet.add(d.MONo);
      });
    }
    // For each MONo, create a row
    if (monoSet.size === 0) monoSet.add("-");
    monoSet.forEach((mono) => {
      // Filter Output_data and Defect_data for this MONo
      const outputData = Array.isArray(item.Output_data)
        ? item.Output_data.filter(
            (o) =>
              (o.MONo ||
                o["款号"] ||
                o["ModelNo"] ||
                o["MoNo"] ||
                o["StyleNo"] ||
                o["Style_No"] ||
                o["型号"] ||
                "-") === mono
          )
        : [];
      const defectData = Array.isArray(item.Defect_data)
        ? item.Defect_data.filter((d) => d.MONo === mono)
        : [];
      rows.push({
        ...item,
        MONo: mono,
        Output_data: outputData,
        Defect_data: defectData
      });
    });
  });
  return rows;
}

function groupByInspectionAndQC(data) {
  const map = new Map();
  data.forEach((item) => {
    const key = `${item.Inspection_date}|${item.QC_ID}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.entries()).map(([key, items]) => {
    const monoMap = new Map();
    items.forEach((item) => {
      const mono = item.MONo || "-";
      if (!monoMap.has(mono)) monoMap.set(mono, []);
      monoMap.get(mono).push(item);
    });
    const rows = Array.from(monoMap.entries()).map(([MONo, monoItems]) => ({
      MONo,
      Output_data: monoItems.flatMap((i) => i.Output_data || []),
      Defect_data: monoItems.flatMap((i) => i.Defect_data || []),
      Seq_No: monoItems[0]?.Seq_No || monoItems[0]?.SeqNo || ""
    }));
    const [Inspection_date, QC_ID] = key.split("|");
    return { Inspection_date, QC_ID, rows };
  });
}

function renderOutputData(outputData) {
  if (!Array.isArray(outputData) || outputData.length === 0) {
    return (
      <span className="text-gray-400 dark:text-gray-500 italic">No data</span>
    );
  }

  const groupMap = new Map();
  outputData.forEach((o) => {
    const key = `${o.Color}|${o.Size}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { Color: o.Color, Size: o.Size, Qty: 0 });
    }
    groupMap.get(key).Qty += Number(o.Qty) || 0;
  });
  const grouped = Array.from(groupMap.values());

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 shadow-sm border border-blue-200 dark:border-gray-600">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-center">
          Color
        </div>
        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-center">
          Size
        </div>
        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-center">
          Qty
        </div>
      </div>
      <div className="space-y-1">
        {grouped.map((o, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-700 rounded px-2 py-1 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-gray-700 dark:text-gray-200 text-center">
              {o.Color || "-"}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-200 text-center">
              {o.Size || "-"}
            </div>
            <div className="text-xs font-semibold text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/20 rounded px-1">
              {o.Qty}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderDefectData(defectData) {
  if (!Array.isArray(defectData) || defectData.length === 0) {
    return (
      <span className="text-gray-400 dark:text-gray-500 italic">
        No defects
      </span>
    );
  }

  let details = [];
  if (defectData[0]?.DefectDetails) {
    defectData.forEach((d) => {
      if (Array.isArray(d.DefectDetails)) {
        details.push(...d.DefectDetails);
      }
    });
  } else {
    details = defectData;
  }

  const groupMap = new Map();
  details.forEach((dd) => {
    const key = `${dd.Defect_code}|${dd.Defect_name}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        Defect_code: dd.Defect_code,
        Defect_name: dd.Defect_name,
        Qty: 0
      });
    }
    groupMap.get(key).Qty += Number(dd.Qty) || 0;
  });
  const grouped = Array.from(groupMap.values());

  return (
    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-red-900/20 rounded-lg p-3 shadow-sm border border-red-200 dark:border-red-700/50">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-center">
          Code
        </div>
        <div className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-center">
          Defect Name
        </div>
        <div className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-center">
          Qty
        </div>
      </div>
      <div className="space-y-1">
        {grouped.map((dd, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-700 rounded px-2 py-1 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-gray-700 dark:text-gray-200 text-center font-mono">
              {dd.Defect_code || "-"}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-200 text-center">
              {dd.Defect_name || "-"}
            </div>
            <div className="text-xs font-semibold text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 rounded px-1">
              {dd.Qty}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FinalResultTable = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
            📊
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            No data available
          </div>
        </div>
      </div>
    );
  }

  const flatRows = flattenByInspectionQCMono(data);
  const grouped = groupByInspectionAndQC(flatRows);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">
            QC Inspection Results
          </h3>
          <div className="text-blue-100 text-xs bg-blue-700/30 px-2 py-1 rounded">
            Showing {Math.min(PREVIEW_ROW_LIMIT, grouped.length)} of{" "}
            {grouped.length} groups
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                📅 Inspection Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                👤 QC ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                🏷️ MONo
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                🔢 Seq No
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                📦 Output Data
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                ⚠️ Defect Data
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {grouped.slice(0, PREVIEW_ROW_LIMIT).map((group, groupIdx) =>
              group.rows.map((row, rowIdx) => (
                <tr
                  key={groupIdx + "-" + rowIdx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {rowIdx === 0 && (
                    <>
                      <td
                        className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20"
                        rowSpan={group.rows.length}
                      >
                        <div className="font-medium text-blue-700 dark:text-blue-300">
                          {group.Inspection_date
                            ? new Date(
                                group.Inspection_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20"
                        rowSpan={group.rows.length}
                      >
                        <div className="font-mono font-medium text-green-700 dark:text-green-300">
                          {group.QC_ID || "N/A"}
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <span className="font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {row.MONo || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      {Array.isArray(row.Seq_No)
                        ? row.Seq_No.join(", ")
                        : row.Seq_No || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    {renderOutputData(row.Output_data)}
                  </td>
                  <td className="px-4 py-3">
                    {renderDefectData(row.Defect_data)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalResultTable;
