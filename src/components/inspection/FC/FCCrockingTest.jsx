import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  Droplets,
  Calendar,
  Printer,
  Hash,
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";

// --- Helpers ---
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

const HeaderField = ({ label, value }) => (
  <div className="flex items-center text-xs border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
    <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1.5 font-semibold text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 min-w-[80px]">
      {label}
    </div>
    <div className="bg-white dark:bg-gray-800 px-2 py-1.5 flex-1 text-gray-800 dark:text-gray-200 font-medium truncate">
      {value || ""}
    </div>
  </div>
);

// --- Main Component ---

const FCCrockingTest = () => {
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
        `${API_BASE_URL}/api/fc-system/crocking-test?search=${encodeURIComponent(searchTerm.trim())}`,
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
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm disabled:opacity-50"
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
          <Droplets size={48} className="mb-3 text-gray-300" />
          <p>No Crocking Test Reports found for "{searchTerm}"</p>
        </div>
      )}

      {/* Reports List */}
      {reports.map((report, rIdx) => (
        <div
          key={rIdx}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8"
        >
          {/* Header Card */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {/* Title & Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Droplets
                  className="text-cyan-600 dark:text-cyan-400"
                  size={24}
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Crocking Test Report
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Hash size={12} /> {report.header.txnNo}
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                <Printer size={14} /> Export PDF
              </button>
            </div>

            {/* Header Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <HeaderField
                label="Buyer Style"
                value={report.header.buyerStyle}
              />
              <HeaderField label="Container" value={report.header.container} />
              <HeaderField label="Supplier" value={report.header.supplier} />
              <HeaderField label="MPO No" value={report.header.mpoNo} />
              <HeaderField label="Buyer" value={report.header.buyer || "-"} />
              <HeaderField label="Invoice" value={report.header.invoice} />
              <HeaderField label="Eng Color" value={report.header.engColor} />
              <HeaderField
                label="Store Date"
                value={formatDate(report.header.createDate)}
              />
              <div className="hidden lg:block"></div> {/* Spacer */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <HeaderField
                  label="Description"
                  value={report.header.description}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {/* Main Headers */}
                  <th
                    rowSpan={2}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-10"
                  >
                    Id
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                  >
                    Lot
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-16"
                  >
                    Roll No
                  </th>

                  {/* Dry Group */}
                  <th
                    colSpan={4}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-amber-50 dark:bg-amber-900/30"
                  >
                    Dry
                  </th>

                  {/* Wet Group */}
                  <th
                    colSpan={4}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-blue-50 dark:bg-blue-900/30"
                  >
                    Wet
                  </th>

                  <th
                    rowSpan={2}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                  >
                    Barcode
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-gray-300 dark:border-gray-600 px-2 py-1 min-w-[150px]"
                  >
                    Remarks
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  {/* Dry Sub-headers */}
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Sample
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Requirment
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Grade
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Result
                  </th>

                  {/* Wet Sub-headers */}
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Sample
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Requirment
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Grade
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 font-medium">
                      {row.lot}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {row.rollNo}
                    </td>

                    {/* Dry Data */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center bg-gray-50 dark:bg-gray-800">
                      Sample
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {row.dry.req}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {row.dry.grade}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.dry.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {row.dry.result}
                      </span>
                    </td>

                    {/* Wet Data */}
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center bg-gray-50 dark:bg-gray-800">
                      Sample
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {row.wet.req}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      {row.wet.grade}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.wet.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {row.wet.result}
                      </span>
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center font-mono text-xs">
                      {row.barcode}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5">
                      {row.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-500 mb-2">
                Prepared By
              </span>
              <div className="border-b border-gray-400 dark:border-gray-500 py-1 text-sm font-medium h-8">
                {report.header.preparedBy || " "}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-500 mb-2">
                Checked By
              </span>
              <div className="border-b border-gray-400 dark:border-gray-500 py-1 text-sm font-medium h-8">
                {report.header.checkBy || " "}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-500 mb-2">
                Received By
              </span>
              <div className="border-b border-gray-400 dark:border-gray-500 py-1 text-sm font-medium h-8">
                {report.header.receivedBy || " "}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FCCrockingTest;
