import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  Palette,
  Calendar,
  FileText,
  Printer,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helpers ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const fmt = (val) => (val !== null && val !== undefined ? val : "");

// --- Main Component ---

const FCSeperationColorList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fc-system/seperation-color-list?search=${encodeURIComponent(searchTerm.trim())}`,
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by TxnNo..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Search Report
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={20} className="text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {hasSearched && !loading && reports.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Palette size={48} className="mb-3 text-gray-300" />
          <p>No Seperation Color Lists found for "{searchTerm}"</p>
        </div>
      )}

      {/* Reports List */}
      {reports.map((report, rIdx) => (
        <div
          key={rIdx}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-end gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Palette
                  size={24}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Seperation Color List
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      TxnNo:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {report.header.txnNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(report.header.createDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
              <Printer size={14} /> Export / Print
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-[11px] border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[30px]">
                    No
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Tone
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[80px]">
                    MPOCode
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[80px]">
                    MPONo
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Style
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[100px]">
                    Material
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[80px]">
                    EngColor
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[100px]">
                    Body_Lot
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Body_Total
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Body_CST
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[40px]">
                    Unit
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Rib_Lot
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Rib_TotalQ
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Rib_CST
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Rib_DiffQty
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[120px]">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300"
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.tone)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.mpoCode)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.mpoNo)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.style)}
                    </td>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 truncate max-w-[150px]"
                      title={row.material}
                    >
                      {fmt(row.material)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.engColor)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.bodyLot)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right font-medium">
                      {fmt(row.bodyQty)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right">
                      {fmt(row.bodyCst)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {fmt(row.unit)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.ribLot)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right">
                      {fmt(row.ribQty)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right">
                      {fmt(row.ribCst)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right text-blue-600 dark:text-blue-400 font-semibold">
                      {fmt(row.ribDiffQty)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {fmt(row.remarks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FCSeperationColorList;
