const PREVIEW_ROW_LIMIT = 100;

function flattenByInspectionQCMono(data) {
  const rows = [];
  data.forEach(item => {
    // Find all unique MONo in Output_data
    const monoSet = new Set();
    if (Array.isArray(item.Output_data)) {
      item.Output_data.forEach(o => {
        if (o.MONo) monoSet.add(o.MONo);
      });
    }
    if (Array.isArray(item.Defect_data)) {
      item.Defect_data.forEach(d => {
        if (d.MONo) monoSet.add(d.MONo);
      });
    }
    // For each MONo, create a row
    if (monoSet.size === 0) monoSet.add('-');
    monoSet.forEach(mono => {
      // Filter Output_data and Defect_data for this MONo
      const outputData = Array.isArray(item.Output_data)
        ? item.Output_data.filter(o =>
            (o.MONo || o['款号'] || o['ModelNo'] || o['MoNo'] || o['StyleNo'] || o['Style_No'] || o['型号'] || '-') === mono
          )
        : [];
      const defectData = Array.isArray(item.Defect_data)
        ? item.Defect_data.filter(d => d.MONo === mono)
        : [];
      rows.push({
        ...item,
        MONo: mono,
        Output_data: outputData,
        Defect_data: defectData,
      });
    });
  });
  return rows;
}

function groupByInspectionAndQC(data) {
      const map = new Map();
      data.forEach(item => {
        const key = `${item.Inspection_date}|${item.QC_ID}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
      });
      return Array.from(map.entries()).map(([key, items]) => {
        const monoMap = new Map();
        items.forEach(item => {
          const mono = item.MONo || '-';
          if (!monoMap.has(mono)) monoMap.set(mono, []);
          monoMap.get(mono).push(item);
        });
        const rows = Array.from(monoMap.entries()).map(([MONo, monoItems]) => ({
          MONo,
          Output_data: monoItems.flatMap(i => i.Output_data || []),
          Defect_data: monoItems.flatMap(i => i.Defect_data || []),
          Seq_No: monoItems[0]?.Seq_No || monoItems[0]?.SeqNo || '',
        }));
        const [Inspection_date, QC_ID] = key.split('|');
        return { Inspection_date, QC_ID, rows };
      });
    }

function renderOutputData(outputData) {
  if (!Array.isArray(outputData) || outputData.length === 0) return <span>-</span>;
  const groupMap = new Map();
  outputData.forEach(o => {
    const key = `${o.Color}|${o.Size}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { Color: o.Color, Size: o.Size, Qty: 0 });
    }
    groupMap.get(key).Qty += Number(o.Qty) || 0;
  });
  const grouped = Array.from(groupMap.values());
  return (
    <table className="border border-gray-200 dark:border-gray-700 mb-1">
      <thead>
        <tr>
          <th className="px-1 py-0.5 border">Color</th>
          <th className="px-1 py-0.5 border">Size</th>
          <th className="px-1 py-0.5 border">Qty</th>
        </tr>
      </thead>
      <tbody>
        {grouped.map((o, i) => (
          <tr key={i}>
            <td className="px-1 py-0.5 border">{o.Color}</td>
            <td className="px-1 py-0.5 border">{o.Size}</td>
            <td className="px-1 py-0.5 border">{o.Qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderDefectData(defectData) {
  if (!Array.isArray(defectData) || defectData.length === 0) return <span>-</span>;
  // Flatten all DefectDetails arrays if present, else use defectData directly
  let details = [];
  if (defectData[0]?.DefectDetails) {
    defectData.forEach(d => {
      if (Array.isArray(d.DefectDetails)) {
        details.push(...d.DefectDetails);
      }
    });
  } else {
    details = defectData;
  }
  // Group by Defect_code & Defect_name
  const groupMap = new Map();
  details.forEach(dd => {
    const key = `${dd.Defect_code}|${dd.Defect_name}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { Defect_code: dd.Defect_code, Defect_name: dd.Defect_name, Qty: 0 });
    }
    groupMap.get(key).Qty += Number(dd.Qty) || 0;
  });
  const grouped = Array.from(groupMap.values());
  return (
    <table className="border border-gray-200 dark:border-gray-700 mb-1">
      <thead>
        <tr>
          <th className="px-1 py-0.5 border">Defect Code</th>
          <th className="px-1 py-0.5 border">Defect Name</th>
          <th className="px-1 py-0.5 border">Qty</th>
        </tr>
      </thead>
      <tbody>
        {grouped.map((dd, i) => (
          <tr key={i}>
            <td className="px-1 py-0.5 border">{dd.Defect_code}</td>
            <td className="px-1 py-0.5 border">{dd.Defect_name}</td>
            <td className="px-1 py-0.5 border">{dd.Qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FinalResultTable = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return <div>No data</div>;

  const flatRows = flattenByInspectionQCMono(data);
  const grouped = groupByInspectionAndQC(flatRows);

  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Showing first {PREVIEW_ROW_LIMIT} groups of {grouped.length}
      </div>
      <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700">
        <thead>
          <tr>
            <th className="px-2 py-1 border">Inspection Date</th>
            <th className="px-2 py-1 border">QC ID</th>
            <th className="px-2 py-1 border">MONo</th>
            <th className="px-2 py-1 border">Seq_No</th>
            <th className="px-2 py-1 border">Output Data</th>
            <th className="px-2 py-1 border">Defect Data</th>
          </tr>
        </thead>
        <tbody>
          {grouped.slice(0, PREVIEW_ROW_LIMIT).map((group, groupIdx) =>
            group.rows.map((row, rowIdx) => (
              <tr key={groupIdx + '-' + rowIdx} className="even:bg-gray-50 dark:even:bg-gray-800">
                {rowIdx === 0 && (
                  <>
                    <td className="px-2 py-1 border" rowSpan={group.rows.length}>
                      {group.Inspection_date ? new Date(group.Inspection_date).toLocaleDateString() : ''}
                    </td>
                    <td className="px-2 py-1 border" rowSpan={group.rows.length}>
                      {group.QC_ID}
                    </td>
                  </>
                )}
                <td className="px-2 py-1 border">{row.MONo}</td>
                <td className="px-2 py-1 border">
                  {Array.isArray(row.Seq_No) ? row.Seq_No.join(', ') : row.Seq_No}
                </td>
                <td className="px-2 py-1 border">{renderOutputData(row.Output_data)}</td>
                <td className="px-2 py-1 border">{renderDefectData(row.Defect_data)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FinalResultTable;