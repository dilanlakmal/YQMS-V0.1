import React, { useState, useCallback } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  Scissors,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  User,
  Hash,
  ShoppingBag,
  Package,
  Truck,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// ---- Helpers ----

const formatCategory = (cat) => {
  if (!cat) return "";
  const c = cat.toString().trim();
  const num = parseInt(c);
  if (!isNaN(num) && num > 0 && num < 100) return `Ratio ${num}`;
  if (c.toLowerCase().includes("orderqty")) return "Order Qty";
  if (c.toLowerCase().includes("plancut") || c.includes("+3.5"))
    return "PlanCut (+3.5%)";
  if (c.toLowerCase().includes("totalqty")) return "Total Qty";
  if (c.toLowerCase().includes("diffqty")) return "Diff Qty";
  return c;
};

const getRowStyle = (cat) => {
  if (!cat) return "";
  const c = cat.toString().trim().toLowerCase();
  if (c.includes("orderqty"))
    return "bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-800 dark:text-blue-200";
  if (c.includes("plancut") || c.includes("+3.5"))
    return "bg-cyan-50 dark:bg-cyan-900/30 font-semibold text-cyan-800 dark:text-cyan-200";
  if (c.includes("totalqty"))
    return "bg-emerald-50 dark:bg-emerald-900/30 font-bold text-emerald-800 dark:text-emerald-200";
  if (c.includes("diffqty"))
    return "bg-amber-50 dark:bg-amber-900/30 font-bold text-amber-800 dark:text-amber-200";
  return "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";
};

const fmt = (val) => {
  if (val === null || val === undefined || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return val;
  return n.toLocaleString();
};

const fmtDec = (val, decimals = 3) => {
  if (val === null || val === undefined || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return val;
  return n.toFixed(decimals);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getFTBadge = (ft) => {
  if (!ft)
    return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
  const u = ft.toUpperCase();
  if (u === "A")
    return "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200";
  if (u === "B")
    return "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200";
  if (u === "C")
    return "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200";
  return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
};

// ---- Table Cell ----
const TC = ({ children, className = "", align = "center" }) => (
  <td
    className={`px-2 py-1.5 text-${align} text-[11px] tabular-nums whitespace-nowrap ${className}`}
  >
    {children}
  </td>
);

// ---- Info Chip ----
const InfoChip = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-1.5 bg-white/70 dark:bg-gray-700/60 rounded-lg px-2.5 py-1.5 border border-gray-200/50 dark:border-gray-600/50">
      <Icon
        size={13}
        className="text-indigo-500 dark:text-indigo-400 flex-shrink-0"
      />
      <div>
        <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

// ---- Single Group Card ----
const MarkerRatioGroup = ({ group }) => {
  const [expanded, setExpanded] = useState(true);
  const { headerInfo, sizeNames, rows, totalInfo } = group;

  const hasFT2 =
    headerInfo.fabricType2 !== null &&
    headerInfo.fabricType2 !== undefined &&
    headerInfo.fabricType2 !== "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-indigo-500 rounded-lg shadow-sm">
            <Scissors size={16} className="text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {headerInfo.style}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 rounded-full text-[10px] font-bold">
                {headerInfo.engColor}
              </span>
              {headerInfo.chnColor && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-[10px] font-bold">
                  {headerInfo.chnColor}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getFTBadge(
                  headerInfo.fabricType1,
                )}`}
              >
                FT1: {headerInfo.fabricType1 || "-"}
              </span>
              {hasFT2 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getFTBadge(
                    headerInfo.fabricType2,
                  )}`}
                >
                  FT2: {headerInfo.fabricType2}
                </span>
              )}
              {headerInfo.dept && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-medium">
                  Dept: {headerInfo.dept}
                </span>
              )}
              {headerInfo.shipment && (
                <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 rounded-full text-[10px] font-medium">
                  Ship: {headerInfo.shipment}
                </span>
              )}
              {headerInfo.material && (
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 rounded-full text-[10px] font-medium">
                  {headerInfo.material}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {headerInfo.orderCode} • TxnNo: {headerInfo.txnNo} • {rows.length}{" "}
              rows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalInfo && (
            <div className="hidden sm:flex items-center gap-3 mr-3">
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase">Total Qty</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  {fmt(totalInfo.TotalQty)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase">Total Use</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  {fmt(totalInfo.TotalUse)}
                </p>
              </div>
            </div>
          )}
          {expanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Info Bar */}
          <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <InfoChip
                icon={Calendar}
                label="Create Date"
                value={formatDate(headerInfo.createDate)}
              />
              <InfoChip
                icon={User}
                label="Prepared By"
                value={headerInfo.preparedBy}
              />
              <InfoChip icon={Hash} label="TxnNo" value={headerInfo.txnNo} />
              <InfoChip
                icon={ShoppingBag}
                label="Buyer"
                value={headerInfo.buyer}
              />
              <InfoChip
                icon={Scissors}
                label="Buyer Style"
                value={headerInfo.buyerStyle}
              />
              <InfoChip icon={Package} label="Dept" value={headerInfo.dept} />
              <InfoChip
                icon={Truck}
                label="Shipment"
                value={headerInfo.shipment}
              />
              <InfoChip
                icon={Layers}
                label="Fabric Color"
                value={headerInfo.fabricColor}
              />
              {totalInfo && (
                <>
                  <InfoChip
                    icon={Hash}
                    label="Total Qty"
                    value={fmt(totalInfo.TotalQty)}
                  />
                  <InfoChip
                    icon={Hash}
                    label="Total Use"
                    value={fmt(totalInfo.TotalUse)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 px-2 py-2 text-left font-bold border-r border-gray-300 dark:border-gray-600 min-w-[95px]">
                    Category
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    Ratio#
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[42px]">
                    Dept
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    Ship
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[55px]">
                    ColNo
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[60px]">
                    ChnCol
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[60px]">
                    EngCol
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[32px]">
                    FT1
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[32px]">
                    FT2
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[60px]">
                    Material
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    Pattern
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    Act.W
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[45px]">
                    Edt.W
                  </th>
                  {/* Size Columns */}
                  {sizeNames.map((size, i) => (
                    <th
                      key={i}
                      className="px-2 py-2 text-center font-bold text-indigo-600 dark:text-indigo-300 min-w-[50px] border-l border-indigo-200 dark:border-indigo-700"
                    >
                      {size}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-bold min-w-[60px] border-l border-gray-300 dark:border-gray-500">
                    Total
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[48px]">
                    Lyrs
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    PnLyr
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    SpLyr
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[55px]">
                    MkLen
                  </th>
                  <th className="px-2 py-2 text-center font-bold min-w-[50px]">
                    MkKgs
                  </th>
                  <th className="px-2 py-2 text-left font-bold min-w-[80px]">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`${getRowStyle(row.category)} hover:opacity-80 transition-opacity`}
                  >
                    <td className="sticky left-0 z-10 px-2 py-1.5 font-semibold border-r border-gray-200 dark:border-gray-600 whitespace-nowrap bg-inherit text-[11px]">
                      {formatCategory(row.category)}
                    </td>
                    <TC>{fmt(row.ratioNo)}</TC>
                    <TC>{row.dept || "-"}</TC>
                    <TC>{row.shipment || "-"}</TC>
                    <TC>{row.colorNo || "-"}</TC>
                    <TC>{row.chnColor || "-"}</TC>
                    <TC>{row.engColor || "-"}</TC>
                    <TC>{row.fabricType1 || "-"}</TC>
                    <TC>{row.fabricType2 || "-"}</TC>
                    <TC>{row.material || "-"}</TC>
                    <TC>{row.pattern || "-"}</TC>
                    <TC>{row.actualWidth || "-"}</TC>
                    <TC>{row.editWidth || "-"}</TC>
                    {row.sizeValues.map((val, i) => (
                      <TC
                        key={i}
                        className="border-l border-indigo-100 dark:border-indigo-800"
                      >
                        {fmt(val)}
                      </TC>
                    ))}
                    <TC className="font-semibold border-l border-gray-300 dark:border-gray-500">
                      {fmt(row.totalQty)}
                    </TC>
                    <TC>{fmt(row.totalLayer)}</TC>
                    <TC>{fmt(row.spreadPlanLayer)}</TC>
                    <TC>{fmt(row.spreadLayer)}</TC>
                    <TC>{row.markerLength ? fmtDec(row.markerLength) : "-"}</TC>
                    <TC>{row.markerKgs ? fmtDec(row.markerKgs) : "-"}</TC>
                    <TC align="left" className="max-w-[120px] truncate">
                      {row.remarks || "-"}
                    </TC>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Main Component ----
const FCMarkerRatio = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fc-system/marker-ratio?search=${encodeURIComponent(
          searchTerm.trim(),
        )}`,
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setGroups(data.groups || []);
      } else {
        throw new Error(data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by TxnNo or Style..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Before Search */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-4">
            <Scissors
              size={32}
              className="text-indigo-500 dark:text-indigo-400"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Marker Ratio Search
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Enter a TxnNo or Style to search. Results grouped by Dept, Shipment,
            Style, Color, Fabric Type & Material. Fabric Type A displayed first.
          </p>
        </div>
      )}

      {/* No Results */}
      {searched && !loading && groups.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mb-4">
            <Info size={32} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            No Results Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No data found for "{searchTerm}".
          </p>
        </div>
      )}

      {/* Results Summary */}
      {groups.length > 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Found{" "}
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {groups.length}
            </span>{" "}
            table{groups.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400">
            {groups.reduce((sum, g) => sum + g.rows.length, 0)} total rows
          </p>
        </div>
      )}

      {/* Group Cards */}
      <div className="space-y-4">
        {groups.map((group, idx) => (
          <MarkerRatioGroup key={idx} group={group} />
        ))}
      </div>
    </div>
  );
};

export default FCMarkerRatio;
