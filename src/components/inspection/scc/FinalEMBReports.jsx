import axios from "axios";
import {
  BookOpen,
  CalendarDays,
  Filter as FilterIcon,
  Loader2,
  Palette,
  RefreshCw
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";

const FinalEMBReports = () => {
  const { t } = useTranslation();

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFactory, setSelectedFactory] = useState("All");
  const [selectedEmpId, setSelectedEmpId] = useState("All");
  const [selectedMoNo, setSelectedMoNo] = useState("All");

  // Data States
  const [reportData, setReportData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    empIds: [],
    moNos: [],
    factories: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConsolidatedReport = useCallback(
    async (date, factory, empId, moNo) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/scc/final-report/emb`,
          {
            params: {
              date: date.toISOString(),
              factoryName: factory,
              empId,
              moNo
            }
          }
        );
        setReportData(response.data.embReport || []);
        if (factory === "All" && empId === "All" && moNo === "All") {
          setFilterOptions(
            response.data.filterOptions || {
              empIds: [],
              moNos: [],
              factories: []
            }
          );
        }
      } catch (err) {
        console.error("Error fetching consolidated EMB report:", err);
        setError(
          t(
            "scc.finalReports.fetchError",
            "Failed to fetch consolidated report."
          )
        );
        setReportData([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchConsolidatedReport(
      selectedDate,
      selectedFactory,
      selectedEmpId,
      selectedMoNo
    );
  }, [
    selectedDate,
    selectedFactory,
    selectedEmpId,
    selectedMoNo,
    fetchConsolidatedReport
  ]);

  const handleClearFilters = () => {
    setSelectedFactory("All");
    setSelectedEmpId("All");
    setSelectedMoNo("All");
  };

  const sortByFactory = (data) => {
    if (!data) return [];
    return [...data].sort((a, b) => a.factoryName.localeCompare(b.factoryName));
  };

  // --- NEW: Memoized function to calculate factory summary ---
  const factorySummaryData = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];

    const summary = {};
    // { 'Tong Chai': { totalPcs: 100, ... }, 'WEL': { ... } }

    reportData.forEach((row) => {
      const factory = row.factoryName;
      if (!summary[factory]) {
        summary[factory] = {
          factoryName: factory,
          totalPcs: 0,
          totalInspectedQty: 0,
          totalDefectsQty: 0,
          defectSummary: {}
        };
      }

      const factoryGroup = summary[factory];
      factoryGroup.totalPcs += row.totalPcs || 0;
      factoryGroup.totalInspectedQty += row.totalInspectedQty || 0;
      factoryGroup.totalDefectsQty += row.totalDefectsQty || 0;

      Object.entries(row.defectSummary).forEach(([defectName, qty]) => {
        factoryGroup.defectSummary[defectName] =
          (factoryGroup.defectSummary[defectName] || 0) + qty;
      });
    });

    return Object.values(summary).map((group) => ({
      ...group,
      finalDefectRate:
        group.totalInspectedQty > 0
          ? group.totalDefectsQty / group.totalInspectedQty
          : 0
    }));
  }, [reportData]);

  const detailColumns = [
    { key: "factory", label: "scc.factory", render: (row) => row.factoryName },
    { key: "moNo", label: "scc.moNo", render: (row) => row.moNo },
    { key: "buyer", label: "scc.buyer", render: (row) => row.buyer },
    {
      key: "buyerStyle",
      label: "scc.buyerStyle",
      render: (row) => row.buyerStyle
    },
    { key: "color", label: "scc.color", render: (row) => row.color },
    {
      key: "batchNo",
      label: "sccEMBReport.batchNo",
      render: (row) => row.batchNo
    },
    {
      key: "tableNo",
      label: "sccEMBReport.tableNo",
      render: (row) => row.tableNo
    },
    {
      key: "totalPcs",
      label: "sccEMBReport.totalPcs",
      render: (row) => row.totalPcs
    },
    {
      key: "inspQty",
      label: "sccEMBReport.inspQty",
      render: (row) => row.totalInspectedQty
    },
    {
      key: "defectsQty",
      label: "sccEMBReport.defectsQty",
      render: (row) => row.totalDefectsQty
    },
    {
      key: "defectDetails",
      label: "sccEMBReport.defectDetails",
      render: (row) => (
        <div className="text-xs">
          {Object.entries(row.defectSummary).map(([name, qty]) => (
            <div key={name}>
              {name}: {qty}
            </div>
          ))}
        </div>
      )
    },
    {
      key: "defectRate",
      label: "sccEMBReport.defectRate",
      render: (row) => (
        <span
          className={`inline-block w-full text-center p-1 rounded-md font-semibold ${
            row.finalDefectRate > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >{`${(row.finalDefectRate * 100).toFixed(2)}%`}</span>
      )
    }
  ];

  // --- NEW: Columns definition for the summary table ---
  const summaryColumns = [
    {
      key: "factory",
      label: "scc.factory",
      render: (row) => <span className="font-bold">{row.factoryName}</span>
    },
    {
      key: "totalPcs",
      label: "sccEMBReport.totalPcs",
      render: (row) => row.totalPcs
    },
    {
      key: "inspQty",
      label: "sccEMBReport.inspQty",
      render: (row) => row.totalInspectedQty
    },
    {
      key: "defectsQty",
      label: "sccEMBReport.defectsQty",
      render: (row) => row.totalDefectsQty
    },
    {
      key: "defectDetails",
      label: "sccEMBReport.defectDetails",
      render: (row) => (
        <div className="text-xs">
          {Object.entries(row.defectSummary).map(([name, qty]) => (
            <div key={name}>
              {name}: {qty}
            </div>
          ))}
        </div>
      )
    },
    {
      key: "defectRate",
      label: "sccEMBReport.defectRate",
      render: (row) => (
        <span
          className={`inline-block w-full text-center p-1 rounded-md font-semibold ${
            row.finalDefectRate > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >{`${(row.finalDefectRate * 100).toFixed(2)}%`}</span>
      )
    }
  ];

  const renderTable = (titleKey, data, columns) => (
    <section className="mb-8 p-4 bg-white border border-slate-200 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <BookOpen className="mr-3 text-indigo-600" />
        {t(titleKey)}
      </h2>
      <div className="overflow-x-auto pretty-scrollbar">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 border border-slate-300 text-left font-semibold text-slate-600"
                >
                  {t(col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={`${col.key}-${rowIndex}`}
                      className="p-2 border border-slate-300 align-top"
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-4 text-center text-slate-500 italic"
                >
                  {t("scc.finalReports.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-sm text-slate-600">
          SCC - EMB Daily Reports | {selectedDate.toLocaleDateString()} |{" "}
          {selectedFactory === "All"
            ? t("scc.finalReports.allFactories")
            : selectedFactory}{" "}
          | {selectedEmpId === "All" ? t("scc.allEmpIds") : selectedEmpId} |{" "}
          {selectedMoNo === "All" ? t("scc.allMoNos") : selectedMoNo}
        </p>
      </div>

      <div className="p-4 mb-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label
              htmlFor="reportDate"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.date")}
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="MM/dd/yyyy"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              id="reportDate"
            />
          </div>
          <div>
            <label
              htmlFor="factoryFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.factory")}
            </label>
            <select
              id="factoryFilter"
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">{t("scc.finalReports.allFactories")}</option>
              {filterOptions.factories.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="empIdFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.empId")}
            </label>
            <select
              id="empIdFilter"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">{t("scc.allEmpIds")}</option>
              {filterOptions.empIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="moNoFilter"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              {t("scc.moNo")}
            </label>
            <select
              id="moNoFilter"
              value={selectedMoNo}
              onChange={(e) => setSelectedMoNo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="All">{t("scc.allMoNos")}</option>
              {filterOptions.moNos.map((mo) => (
                <option key={mo} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm"
            >
              <RefreshCw size={16} className="mr-2" />
              {t("scc.clearFilters")}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
        </div>
      ) : error ? (
        <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* --- NEW: Render the summary table --- */}
          {renderTable(
            "scc.finalReports.embFactorySummaryTitle",
            factorySummaryData,
            summaryColumns
          )}
          {/* Render the detailed table */}
          {renderTable(
            "scc.finalReports.embCheckingTitle",
            sortByFactory(reportData),
            detailColumns
          )}
        </div>
      )}
    </div>
  );
};

export default FinalEMBReports;
