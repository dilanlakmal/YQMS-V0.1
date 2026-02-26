import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  ClipboardList,
  Calendar,
  User,
  Printer,
  FileText,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helpers ---

// Format Date to "Oct/2025" style
const formatMonth = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
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

// Format Number helpers
const fmtDecimal = (val, decimals = 2) => {
  if (val === null || val === undefined) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toFixed(decimals);
};

const fmtPercent = (val) => {
  if (val === null || val === undefined) return "";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  // Assuming data comes in as 0.18 for 18% based on screenshot
  return (num * 100).toFixed(2) + "%";
};

// Map DB Color strings to Tailwind classes
const getColorClass = (colorName) => {
  if (!colorName) return "bg-gray-100 text-gray-800";
  const c = colorName.toLowerCase().trim();
  if (c === "green") return "bg-green-500 text-white";
  if (c === "yellow") return "bg-yellow-400 text-black";
  if (c === "red") return "bg-red-500 text-white";
  return "bg-gray-100 text-gray-800";
};

// Map Grade Letter to Color
const getGradeColorClass = (grade) => {
  if (!grade) return "";
  const g = grade.toUpperCase().trim();
  if (g === "A") return "bg-green-500 text-white";
  if (g === "B") return "bg-yellow-400 text-black";
  if (g === "C") return "bg-red-500 text-white";
  return "";
};

// --- Main Component ---

const FCSupplierEvaluation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setData(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fc-system/supplier-evaluation?search=${encodeURIComponent(searchTerm.trim())}`,
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.report);
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
      setData(null);
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
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm disabled:opacity-50"
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
      {hasSearched && !loading && !data && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ClipboardList size={48} className="mb-3 text-gray-300" />
          <p>No Supplier Evaluation found for "{searchTerm}"</p>
        </div>
      )}

      {/* Report Content */}
      {data && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row border-b border-gray-200 dark:border-gray-700">
            {/* Header Info */}
            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-850">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="text-emerald-600 dark:text-emerald-400"
                    size={24}
                  />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Supplier Evaluation
                  </h2>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                  <Printer size={14} /> Export
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    TxnNo
                  </span>
                  <span className="font-medium">{data.header.txnNo}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    Store Date
                  </span>
                  <span className="font-medium">
                    {formatDate(data.header.storeDate)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    Prepared By
                  </span>
                  <div className="flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    <span className="font-medium">
                      {data.header.preparedBy}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    Remarks
                  </span>
                  <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded min-h-[40px] text-xs">
                    {data.header.remarks || ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Grading Criteria */}
            <div className="lg:w-[400px] p-6 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-sm font-bold text-center mb-2 uppercase tracking-wide text-gray-700 dark:text-gray-200">
                Grading Criteria
              </h3>
              <div className="overflow-hidden border border-gray-300 dark:border-gray-600 rounded">
                <table className="w-full text-xs text-center">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                      <th className="py-1.5 px-2 border-r border-b border-gray-300 dark:border-gray-600">
                        Defect% (X%)
                      </th>
                      <th className="py-1.5 px-2 border-r border-b border-gray-300 dark:border-gray-600">
                        Grade
                      </th>
                      <th className="py-1.5 px-2 border-r border-b border-gray-300 dark:border-gray-600">
                        Color
                      </th>
                      <th className="py-1.5 px-2 border-b border-gray-300 dark:border-gray-600">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades.map((g, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <td className="py-1.5 px-2 border-r border-gray-200 dark:border-gray-700">
                          {g.range}
                        </td>
                        <td className="py-1.5 px-2 border-r border-gray-200 dark:border-gray-700 font-bold">
                          {g.grade}
                        </td>
                        <td
                          className={`py-1.5 px-2 border-r border-gray-200 dark:border-gray-700 font-bold ${getColorClass(g.color)}`}
                        >
                          {g.color}
                        </td>
                        <td className="py-1.5 px-2">{g.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-blue-50 dark:bg-blue-900/30 text-gray-700 dark:text-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[30px]">
                    Id
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Month
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[70px]">
                    Buyer
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[50px]">
                    Supplier
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[120px]">
                    SupplierName
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[80px]">
                    TotalInsYds
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[90px]">
                    TotalTP100sq
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[100px]">
                    TP100sq/100Yds
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[40px]">
                    GBDP
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[40px]">
                    GBCCT
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[40px]">
                    GBDSNF
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[70px]">
                    OverGrade
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[60px]">
                    Ins_Percer
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 min-w-[150px]">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {idx + 1}
                    </td>

                    {/* Month Format: Oct/2025 */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center whitespace-nowrap">
                      {formatMonth(row.month)}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 font-medium">
                      {fmt(row.buyer)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {fmt(row.supplierCode)}
                    </td>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 truncate max-w-[150px]"
                      title={row.supplierName}
                    >
                      {fmt(row.supplierName)}
                    </td>

                    {/* TotalInsYds: 63.50 Yds */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right whitespace-nowrap">
                      {row.totalInsYds
                        ? `${fmtDecimal(row.totalInsYds)} Yds`
                        : ""}
                    </td>

                    {/* TotalTP100sq: 30 (29.75) Point */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-right whitespace-nowrap">
                      {row.totalTP100sq ? (
                        <>
                          {Math.round(row.totalTP100sq)}{" "}
                          <span className="text-gray-500">
                            ({fmtDecimal(row.totalTP100sq)})
                          </span>{" "}
                          Point
                        </>
                      ) : (
                        ""
                      )}
                    </td>

                    {/* TP100sq/100Yds: 46 Point/100Yds */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center whitespace-nowrap">
                      {row.tp100sqPer
                        ? `${Math.round(row.tp100sqPer)} Point/100Yds`
                        : ""}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {fmt(row.dp)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {fmt(row.nt)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {fmt(row.lw)}
                    </td>

                    {/* OverGrade with Color Background */}
                    <td
                      className={`border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center font-bold ${getGradeColorClass(row.overGrade)}`}
                    >
                      {fmt(row.overGrade)}
                    </td>

                    {/* Ins_Percer: 18.00% */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center font-medium">
                      {fmtPercent(row.insPer)}
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
      )}
    </div>
  );
};

export default FCSupplierEvaluation;
