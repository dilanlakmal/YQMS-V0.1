import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addHours } from "date-fns";
import { Loader2, XCircle, FileDown } from "lucide-react";
import { API_BASE_URL } from "../../../../config"; // Adjust path if needed
import { PDFDownloadLink } from "@react-pdf/renderer";
import SupplierIssueDownloadPDF from "./SupplierIssueDownloadPDF";

// --- Helper Functions ---
const parseTimeToSeconds = (timeString = "00:00:00") => {
  if (!timeString || typeof timeString !== "string") return 0;
  const parts = timeString.split(":");
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
};

const formatSecondsToTime = (totalSeconds) => {
  if (isNaN(totalSeconds)) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// --- NEW HELPER FUNCTION ---
const formatSecondsToHumanReadable = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0 Mins";
  if (seconds === 0) return "0 Mins";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (h > 0) {
    parts.push(`${h} hr`);
  }
  if (m > 0) {
    parts.push(`${m} Mins`);
  }
  return parts.join(" ");
};

const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary, #F3F4F6)",
    borderColor: "var(--color-border, #D1D5DB)",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--color-border-hover, #9CA3AF)" }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-accent, #E0E7FF)"
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "var(--color-text-accent, #1E40AF)" // Using a dark blue for high contrast on the light tag
  }),
  // --- ADD THESE LINES TO FIX TEXT COLOR ---
  singleValue: (base) => ({
    ...base,
    color: "var(--color-text-primary, #111827)"
  }),
  input: (base) => ({ ...base, color: "var(--color-text-primary, #111827)" }),
  placeholder: (base) => ({
    ...base,
    color: "var(--color-text-secondary, #6B7280)"
  }),
  // For the dropdown menu items
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary, white)"
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--color-bg-accent-active, #C7D2FE)"
      : isFocused
      ? "var(--color-bg-accent, #E0E7FF)"
      : "transparent",
    color: "var(--color-text-primary, #111827)",
    ":active": {
      backgroundColor: "var(--color-bg-accent-active, #C7D2FE)"
    }
  })
};

const SupplierIssueResults = () => {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    moNos: [],
    colors: [],
    qcIds: [],
    factoryType: null,
    factoryNames: []
  });

  const [options, setOptions] = useState({
    moNos: [],
    colors: [],
    qcIds: [],
    factoryTypes: [],
    factoryNames: []
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/supplier-issues/report-options`
        );
        setOptions({
          moNos: res.data.moNos.map((o) => ({ value: o, label: o })),
          colors: res.data.colors.map((o) => ({ value: o, label: o })),
          qcIds: res.data.qcIds.map((o) => ({ value: o, label: o })),
          factoryTypes: res.data.factoryTypes.map((o) => ({
            value: o,
            label: o
          })),
          factoryNames: res.data.factoryNames.map((o) => ({
            value: o,
            label: o
          }))
        });
      } catch (error) {
        console.error("Error fetching filter options", error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch results when filters change
  useEffect(() => {
    // Only fetch if at least one filter is set
    const hasActiveFilters = Object.values(filters).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== null;
    });

    if (!hasActiveFilters) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = {
          startDate: filters.startDate
            ? format(filters.startDate, "yyyy-MM-dd")
            : undefined,
          endDate: filters.endDate
            ? format(filters.endDate, "yyyy-MM-dd")
            : undefined,
          moNos:
            filters.moNos.length > 0
              ? filters.moNos.map((o) => o.value).join(",")
              : undefined,
          colors:
            filters.colors.length > 0
              ? filters.colors.map((o) => o.value).join(",")
              : undefined,
          qcIds:
            filters.qcIds.length > 0
              ? filters.qcIds.map((o) => o.value).join(",")
              : undefined,
          factoryType: filters.factoryType
            ? filters.factoryType.value
            : undefined,
          factoryNames:
            filters.factoryNames.length > 0
              ? filters.factoryNames.map((o) => o.value).join(",")
              : undefined
        };
        const res = await axios.get(
          `${API_BASE_URL}/api/supplier-issues/reports/summary`,
          { params }
        );
        setResults(res.data);
      } catch (error) {
        console.error("Error fetching results", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      moNos: [],
      colors: [],
      qcIds: [],
      factoryType: null,
      factoryNames: []
    });
    setResults([]);
  };

  // --- Data Aggregation using useMemo for performance ---
  const aggregatedSummaryData = useMemo(() => {
    const summary = new Map();
    results.forEach((report) => {
      const key = `${report.factoryName}-${report.factoryType}-${report.moNo}`;
      if (!summary.has(key)) {
        summary.set(key, {
          factoryName: report.factoryName,
          factoryType: report.factoryType,
          moNo: report.moNo,
          qcIds: new Set(),
          totalTimeSeconds: 0,
          totalChecked: 0,
          totalClaim: 0
        });
      }
      const entry = summary.get(key);
      entry.qcIds.add(report.inspectorId);
      entry.totalTimeSeconds += parseTimeToSeconds(
        report.totalInspectionTimeString
      );
      entry.totalChecked += report.totalCheckedQty;
      entry.totalClaim += report.totalClaimAmountUSD;
    });
    return Array.from(summary.values()).map((item) => ({
      ...item,
      qcIds: Array.from(item.qcIds).join(", ")
    }));
  }, [results]);

  const defectSummaryData = useMemo(() => {
    const summary = new Map();
    results.forEach((report) => {
      const key = `${report.factoryName}-${report.factoryType}`;
      if (!summary.has(key)) {
        summary.set(key, {
          factoryName: report.factoryName,
          factoryType: report.factoryType,
          totalCheckedPcs: 0,
          defects: {}
        });
      }
      const entry = summary.get(key);
      // --- the total from each report to the running sum ---
      entry.totalCheckedPcs += report.totalCheckedQty || 0;

      report.defectCounts.forEach((defect) => {
        entry.defects[defect.defectNameEng] =
          (entry.defects[defect.defectNameEng] || 0) + defect.qty;
      });
    });
    return Array.from(summary.values());
  }, [results]);

  // --- NEW: CALCULATE TOTALS FOR THE SUMMARY TABLE ---
  const summaryTotals = useMemo(() => {
    return aggregatedSummaryData.reduce(
      (totals, item) => {
        totals.totalTime += item.totalTimeSeconds || 0;
        totals.totalChecked += item.totalChecked || 0;
        totals.totalClaim += item.totalClaim || 0;
        return totals;
      },
      {
        totalTime: 0,
        totalChecked: 0,
        totalClaim: 0
      }
    );
  }, [aggregatedSummaryData]);

  return (
    <div className="space-y-6 p-4">
      {/* Filter Pane */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          <DatePicker
            placeholderText="Start Date"
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            portalId="root-portal"
            popperClassName="react-datepicker-popper-z-50"
          />
          <DatePicker
            placeholderText="End Date"
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            portalId="root-portal"
            popperClassName="react-datepicker-popper-z-50"
          />
          <Select
            placeholder="All MO Nos"
            isMulti
            options={options.moNos}
            value={filters.moNos}
            onChange={(val) => handleFilterChange("moNos", val)}
            styles={selectStyles}
          />
          <Select
            placeholder="All Colors"
            isMulti
            options={options.colors}
            value={filters.colors}
            onChange={(val) => handleFilterChange("colors", val)}
            styles={selectStyles}
          />
          <Select
            placeholder="All QC IDs"
            isMulti
            options={options.qcIds}
            value={filters.qcIds}
            onChange={(val) => handleFilterChange("qcIds", val)}
            styles={selectStyles}
          />
          <Select
            placeholder="All Factory Types"
            isClearable
            options={options.factoryTypes}
            value={filters.factoryType}
            onChange={(val) => handleFilterChange("factoryType", val)}
            styles={selectStyles}
          />
          <Select
            placeholder="All Factory Names"
            isMulti
            options={options.factoryNames}
            value={filters.factoryNames}
            onChange={(val) => handleFilterChange("factoryNames", val)}
            styles={selectStyles}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <XCircle size={18} /> Clear
          </button>
          <PDFDownloadLink
            document={
              <SupplierIssueDownloadPDF
                aggregatedSummaryData={aggregatedSummaryData}
                detailedData={results}
                defectSummaryData={defectSummaryData}
              />
            }
            fileName={`supplier_issue_summary_${format(
              new Date(),
              "yyyy-MM-dd"
            )}.pdf`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                            ${
                              results.length === 0
                                ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
            style={results.length === 0 ? { pointerEvents: "none" } : {}}
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Generating...
                </>
              ) : (
                <>
                  <FileDown size={18} /> Download PDF
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
        </div>
      )}

      {/* Aggregated Summary Table */}
      {!loading && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Factory Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Factory Name</th>
                  <th className="p-2 text-left">Factory Type</th>
                  <th className="p-2 text-left">MO No</th>
                  <th className="p-2 text-left">QC ID(s)</th>
                  <th className="p-2 text-right">Total Inspected Time</th>
                  <th className="p-2 text-right">Total Checked Pcs</th>
                  <th className="p-2 text-right">Total Claim</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedSummaryData.map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-700">
                    <td className="p-2">{item.factoryName}</td>
                    <td className="p-2">{item.factoryType}</td>
                    <td className="p-2">{item.moNo}</td>
                    <td className="p-2">{item.qcIds}</td>
                    <td className="p-2 text-right font-mono">
                      {formatSecondsToTime(item.totalTimeSeconds)}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {item.totalChecked.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-bold text-green-600">
                      ${item.totalClaim.toFixed(2)}{" "}
                      <span className="text-xs text-gray-500">
                        ({(item.totalClaim * 4000).toLocaleString()} KHR)
                      </span>
                    </td>
                  </tr>
                ))}
                {/* --- THIS IS THE NEW "TOTAL" ROW --- */}
                <tr className="bg-gray-100 dark:bg-blue-900/60 font-bold text-black dark:text-white border-t-2 border-gray-300 dark:border-gray-600">
                  {/* `colSpan="4"` merges the first four cells into one */}
                  <td colSpan="4" className="p-2 text-right text-base">
                    Total:
                  </td>

                  {/* Total Inspected Time Cell */}
                  <td className="p-2 text-right font-mono">
                    {formatSecondsToTime(summaryTotals.totalTime)}
                    <br />
                    <span className="text-xs font-normal">
                      ({formatSecondsToHumanReadable(summaryTotals.totalTime)})
                    </span>
                  </td>

                  {/* Total Checked Pcs Cell */}
                  <td className="p-2 text-right">
                    {summaryTotals.totalChecked.toLocaleString()}
                  </td>

                  {/* Total Claim Cell */}
                  <td className="p-2 text-right text-green-600 dark:text-green-400">
                    ${summaryTotals.totalClaim.toFixed(2)}
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      ({(summaryTotals.totalClaim * 4000).toLocaleString()} KHR)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed View Table */}
      {!loading && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">
            Defect Details (Detailed View)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Factory Name</th>
                  <th className="p-2 text-left">Factory Type</th>
                  <th className="p-2 text-left">MO No</th>
                  <th className="p-2 text-left">Inspected Date</th>
                  <th className="p-2 text-left">QC ID</th>
                  <th className="p-2 text-left">Start Time (+7h)</th>
                  <th className="p-2 text-left">Total Inspected Time</th>
                  <th className="p-2 text-right">Total Issues</th>
                  <th className="p-2 text-right">Claimed Money ($)</th>
                  <th className="p-2 text-left">Defect Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id} className="border-b dark:border-gray-700">
                    <td className="p-2">{r.factoryName}</td>
                    <td className="p-2">{r.factoryType}</td>
                    <td className="p-2">{r.moNo}</td>
                    <td className="p-2">
                      {format(new Date(r.reportDate), "MMM d, yyyy")}
                    </td>
                    <td className="p-2">{r.inspectorId}</td>
                    <td className="p-2">
                      {format(addHours(new Date(r.createdAt), 0), "h:mm a")}
                    </td>
                    <td className="p-2 font-mono">
                      {r.totalInspectionTimeString}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {r.totalCheckedQty}
                    </td>
                    <td className="p-2 text-right font-bold text-green-600">
                      ${r.totalClaimAmountUSD.toFixed(2)}
                    </td>
                    <td className="p-2 whitespace-pre-wrap">
                      {r.defectCounts
                        .map((d) => `${d.defectNameEng}: ${d.qty}`)
                        .join("\n")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Defect Summary Table */}
      {!loading && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Defect Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Factory Name</th>
                  <th className="p-2 text-left">Factory Type</th>
                  <th className="p-2 text-center">Total Checked Pcs</th>
                  <th className="p-2 text-left">Defect Details</th>
                </tr>
              </thead>
              <tbody>
                {defectSummaryData.map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-700">
                    <td className="p-2">{item.factoryName}</td>
                    <td className="p-2">{item.factoryType}</td>
                    <td className="p-2 text-center font-semibold">
                      {item.totalCheckedPcs.toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-pre-wrap">
                      {Object.entries(item.defects)
                        .map(([name, qty]) => `${name}: ${qty}`)
                        .join("\n")}
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

export default SupplierIssueResults;

// Old download function

//   const handleDownloadPDF = () => {
//     const doc = new jsPDF("l", "pt", "a4");
//     doc.text("Supplier Issue Report Summary", 40, 40);

//     // Summary Table
//     doc.text("Factory Summary", 40, 60);
//     autoTable(doc, {
//       // <-- UPDATED
//       head: [
//         [
//           "Factory",
//           "Type",
//           "MO No",
//           "QC IDs",
//           "Total Insp. Time",
//           "Total Checked",
//           "Total Claim"
//         ]
//       ],
//       body: aggregatedSummaryData.map((item) => [
//         item.factoryName,
//         item.factoryType,
//         item.moNo,
//         item.qcIds,
//         formatSecondsToTime(item.totalTimeSeconds),
//         item.totalChecked.toLocaleString(),
//         `$${item.totalClaim.toFixed(2)}`
//       ]),
//       startY: 70
//     });

//     // Detailed View Table
//     doc.addPage("l", "pt", "a4");
//     doc.text("Detailed Inspection View", 40, 40);
//     autoTable(doc, {
//       // <-- UPDATED
//       head: [
//         [
//           "Factory",
//           "Type",
//           "MO No",
//           "Date",
//           "QC ID",
//           "Start Time",
//           "Insp. Time",
//           "Issues",
//           "Claim ($)",
//           "Defect Details"
//         ]
//       ],
//       body: results.map((r) => [
//         r.factoryName,
//         r.factoryType,
//         r.moNo,
//         format(new Date(r.reportDate), "MMM d, yyyy"),
//         r.inspectorId,
//         format(addHours(new Date(r.createdAt), 7), "h:mm a"), // Corrected to +7h as requested
//         r.totalInspectionTimeString,
//         r.totalCheckedQty,
//         `$${r.totalClaimAmountUSD.toFixed(2)}`,
//         r.defectCounts.map((d) => `${d.defectNameEng}: ${d.qty}`).join("\n")
//       ]),
//       startY: 50,
//       styles: { cellPadding: 2, fontSize: 8 },
//       headStyles: { fillColor: [22, 160, 133] }
//     });

//     // Defect Summary Table
//     doc.addPage("l", "pt", "a4");
//     doc.text("Defect Summary by Factory", 40, 40);
//     autoTable(doc, {
//       // <-- UPDATED
//       head: [
//         ["Factory Name", "Type", "Total Checked", "Aggregated Defect Details"]
//       ],
//       body: defectSummaryData.map((item) => [
//         item.factoryName,
//         item.factoryType,
//         item.totalCheckedPcs.toLocaleString(),
//         Object.entries(item.defects)
//           .map(([name, qty]) => `${name}: ${qty}`)
//           .join("\n")
//       ]),
//       startY: 50
//     });

//     doc.save(`supplier_issue_summary_${format(new Date(), "yyyy-MM-dd")}.pdf`);
//   };
