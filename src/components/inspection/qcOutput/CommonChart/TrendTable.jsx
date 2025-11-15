import React, { useMemo } from "react";

// New color logic to include Yellow
const getTrendDefectRateColor = (rate) => {
  if (rate > 5) return "bg-red-500/20 text-red-800 dark:text-red-300";
  if (rate >= 3) return "bg-orange-500/20 text-orange-800 dark:text-orange-300";
  if (rate >= 1) return "bg-yellow-500/20 text-yellow-800 dark:text-yellow-300";
  if (rate > 0) return "bg-green-500/20 text-green-800 dark:text-green-300";
  return "bg-gray-500/10 text-gray-500";
};

const TopNButton = ({ n, activeN, setTopN }) => (
  <button
    onClick={() => setTopN(n)}
    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
      activeN === n
        ? "bg-indigo-600 text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
  >
    {n === Infinity ? "All" : `Top ${n}`}
  </button>
);

const TrendTable = ({ data, view, filters, topN, setTopN }) => {
  const { headers, rows, dates } = useMemo(() => {
    if (!data || data.length === 0) return { headers: [], rows: [], dates: [] };

    const dates = data.map((day) => day.inspectionDate.split("T")[0]).sort();
    const dateIndexMap = new Map(dates.map((date, i) => [date, i]));

    const sourceMap = {
      "Line-MO": { key: "daily_full_summary", groupBy: ["lineNo", "MONo"] },
      Line: { key: "daily_line_summary", groupBy: ["lineNo"] },
      MO: { key: "daily_mo_summary", groupBy: ["MONo"] },
      Buyer: { key: "daily_buyer_summary", groupBy: ["Buyer"] },
      All: { key: "daily_totals", groupBy: [] } // Special case
    };

    const { key: sourceKey, groupBy } = sourceMap[view];
    let headers = ["Defect Name", ...groupBy];

    const dataMatrix = new Map();

    // --- STEP 1: Build the full data matrix, applying filters correctly ---
    data.forEach((day) => {
      const dateStr = day.inspectionDate.split("T")[0];
      let sourceData = day[sourceKey];

      if (view === "All") {
        // Create a single item for 'All' view from top-level data
        sourceData = [
          {
            DefectArray: day.DailyDefectArray,
            CheckedQtyT38: day.DailyCheckedQtyT38,
            CheckedQtyT39: day.DailyCheckedQtyT39
          }
        ];
      }

      (sourceData || []).forEach((item) => {
        // FIX: Filter logic now uses && (AND) instead of || (OR)
        const passesFilters =
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value);

        if (passesFilters) {
          const checkedQty = Math.max(
            item.CheckedQtyT38 || 0,
            item.CheckedQtyT39 || 0
          );

          (item.DefectArray || []).forEach((defect) => {
            if (
              !filters.defectName ||
              defect.defectName === filters.defectName.value
            ) {
              const rowKeyParts = [
                defect.defectName,
                ...groupBy.map((key) => item[key])
              ];
              const rowKey = rowKeyParts.join("||");

              if (!dataMatrix.has(rowKey)) {
                dataMatrix.set(rowKey, {
                  keyParts: rowKeyParts,
                  values: new Array(dates.length).fill(null)
                });
              }

              const rate =
                checkedQty > 0 ? (defect.defectQty / checkedQty) * 100 : 0;
              const dateIdx = dateIndexMap.get(dateStr);
              if (dateIdx !== undefined) {
                dataMatrix.get(rowKey).values[dateIdx] = {
                  rate: rate,
                  qty: defect.defectQty
                };
              }
            }
          });
        }
      });
    });

    let matrixRows = Array.from(dataMatrix.values());

    // --- STEP 2: Apply correct TOP N logic ---
    if (topN !== Infinity) {
      const topDefectsAcrossDates = new Set();
      dates.forEach((date, i) => {
        const defectsForDay = matrixRows
          .map((row) => ({
            defectName: row.keyParts[0], // Defect name is always the first key part
            qty: row.values[i]?.qty || 0
          }))
          .filter((d) => d.qty > 0);

        defectsForDay.sort((a, b) => b.qty - a.qty);
        const topDefectsForDay = defectsForDay.slice(0, topN);
        topDefectsForDay.forEach((d) =>
          topDefectsAcrossDates.add(d.defectName)
        );
      });

      matrixRows = matrixRows.filter((row) =>
        topDefectsAcrossDates.has(row.keyParts[0])
      );
    }

    // --- STEP 3: Apply primary sorting based on the view ---
    const customLineSortHelper = (a, b) => {
      const lineA = a || "",
        lineB = b || "";
      const isNumA = !isNaN(parseFloat(lineA)) && isFinite(lineA);
      const isNumB = !isNaN(parseFloat(lineB)) && isFinite(lineB);
      if (isNumA && !isNumB) return -1;
      if (!isNumA && isNumB) return 1;
      if (isNumA && isNumB) return Number(lineA) - Number(lineB);
      return String(lineA).localeCompare(String(lineB));
    };
    const customMoSortHelper = (a, b) => {
      const moA = a || "",
        moB = b || "";
      const isNumMoA = !isNaN(parseFloat(moA)) && isFinite(moA);
      const isNumMoB = !isNaN(parseFloat(moB)) && isFinite(moB);
      if (!isNumMoA && isNumMoB) return -1;
      if (isNumMoA && !isNumMoB) return 1;
      return moA.localeCompare(moB, undefined, { numeric: true });
    };

    matrixRows.sort((a, b) => {
      switch (view) {
        case "Line-MO": // Sort by Line (numeric), then MO (alphanumeric), then Defect Name
          const lineCompare = customLineSortHelper(
            a.keyParts[1],
            b.keyParts[1]
          );
          if (lineCompare !== 0) return lineCompare;
          const moCompare = customMoSortHelper(a.keyParts[2], b.keyParts[2]);
          if (moCompare !== 0) return moCompare;
          return a.keyParts[0].localeCompare(b.keyParts[0]); // Defect Name
        case "Line": // Sort by Line (numeric), then Defect Name
          const lineCompare2 = customLineSortHelper(
            a.keyParts[1],
            b.keyParts[1]
          );
          if (lineCompare2 !== 0) return lineCompare2;
          return a.keyParts[0].localeCompare(b.keyParts[0]); // Defect Name
        case "MO": // Sort by MO (alphanumeric), then Defect Name
          const moCompare2 = customMoSortHelper(a.keyParts[1], b.keyParts[1]);
          if (moCompare2 !== 0) return moCompare2;
          return a.keyParts[0].localeCompare(b.keyParts[0]); // Defect Name
        case "Buyer": // Sort by Buyer, then Defect Name
          const buyerCompare = (a.keyParts[1] || "").localeCompare(
            b.keyParts[1] || ""
          );
          if (buyerCompare !== 0) return buyerCompare;
          return a.keyParts[0].localeCompare(b.keyParts[0]); // Defect Name
        case "All": // Sort by Defect Name only
          return a.keyParts[0].localeCompare(b.keyParts[0]);
        default:
          return 0;
      }
    });

    // Header order needs to match the sorting logic for each view
    const headerMap = {
      "Line-MO": ["Line", "MO", "Defect Name"],
      Line: ["Line", "Defect Name"],
      MO: ["MO", "Defect Name"],
      Buyer: ["Buyer", "Defect Name"],
      All: ["Defect Name"]
    };
    headers = headerMap[view];

    return { headers, rows: matrixRows, dates };
  }, [data, view, filters, topN]);

  const getLeftOffset = (index) => {
    if (index === 0) return "0px";
    // Adjust width based on content if necessary, 150px is a good start
    return `${index * 150}px`;
  };

  return (
    <div>
      <div className="p-4 flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Show:
          </span>
          {[3, 5, 7, 10, Infinity].map((n) => (
            <TopNButton key={n} n={n} activeN={topN} setTopN={setTopN} />
          ))}
        </div>
      </div>
      {/* FIX: Add fixed height and vertical scroll */}
      <div className="overflow-auto h-[70vh]">
        <table className="w-full text-sm border-t dark:border-gray-700 border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50 dark:bg-gray-900/50 border-r dark:border-gray-700"
                  style={{ left: getLeftOffset(i), zIndex: 20 - i }}
                >
                  {h}
                </th>
              ))}
              {dates.map((date) => (
                <th
                  key={date}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider min-w-[120px] sticky top-0 bg-gray-50 dark:bg-gray-900/50"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
              >
                {row.keyParts.map((part, i) => (
                  <td
                    key={i}
                    className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200 sticky left-0 border-r dark:border-gray-700 bg-white dark:bg-gray-800"
                    style={{ left: getLeftOffset(i), zIndex: 10 - i }}
                  >
                    {part}
                  </td>
                ))}
                {row.values.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2 text-center ${
                      cell ? getTrendDefectRateColor(cell.rate) : ""
                    }`}
                  >
                    {cell ? (
                      <div>
                        <span className="font-bold">
                          {cell.rate.toFixed(2)}%
                        </span>
                        <span className="block text-[10px] opacity-70">
                          ({cell.qty})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendTable;
