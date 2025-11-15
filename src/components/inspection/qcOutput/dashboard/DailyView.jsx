import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import {
  Loader2,
  AlertTriangle,
  Filter,
  BarChart3,
  Activity
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

//-- Common UI Components --
import { reactSelectStyles } from "../CommonUI/reactSelectStyles";
import { formatDateForAPI } from "../CommonUI/dateFormatUtils";

//-- Dashboard Sub-Components --
import DashboardStatCard from "../CommonChart/DashboardStatCard";
import SummaryTable from "../CommonChart/SummaryTable";
import DefectRateChart from "../CommonChart/DefectRateChart";
import TopDefectsTable from "../CommonChart/TopDefectsTable";

/**
 * A self-contained component for the "Daily View" of the dashboard.
 * It fetches and processes its own data based on the provided date range.
 * @param {{startDate: Date, endDate: Date}} props
 */
const DailyView = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeView, setActiveView] = useState("Line-MO"); // For SummaryTable

  const [filters, setFilters] = useState({
    lineNo: null,
    moNo: null,
    buyer: null
  });
  const [filterOptions, setFilterOptions] = useState({
    lines: [],
    mos: [],
    buyers: []
  });

  // --- Data fetching logic is now inside this component ---
  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);

    const trendEndDate = new Date(startDate);
    trendEndDate.setDate(trendEndDate.getDate() - 1);
    const trendStartDate = new Date(trendEndDate);
    trendStartDate.setDate(trendEndDate.getDate() - 6);

    try {
      const [mainResponse, trendResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qc1-summary/dashboard-data`, {
          params: {
            startDate: formatDateForAPI(startDate),
            endDate: formatDateForAPI(endDate)
          }
        }),
        axios.get(`${API_BASE_URL}/api/qc1-summary/dashboard-data`, {
          params: {
            startDate: formatDateForAPI(trendStartDate),
            endDate: formatDateForAPI(trendEndDate)
          }
        })
      ]);
      setData(mainResponse.data);
      setTrendData(trendResponse.data);
    } catch (err) {
      setError("Failed to fetch dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchFilterOptions = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const params = {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        buyer: filters.buyer?.value
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qc1-summary/filter-options`,
        { params }
      );
      const { lines, mos, buyers } = response.data;
      setFilterOptions({
        lines: lines.map((l) => ({ value: l, label: l })),
        mos: mos.map((m) => ({ value: m, label: m })),
        buyers: buyers.map((b) => ({ value: b, label: b }))
      });
      if (filters.lineNo && !lines.includes(filters.lineNo.value)) {
        setFilters((prev) => ({ ...prev, lineNo: null }));
      }
      if (filters.moNo && !mos.includes(filters.moNo.value)) {
        setFilters((prev) => ({ ...prev, moNo: null }));
      }
      if (filters.buyer && !buyers.includes(filters.buyer.value)) {
        setFilters((prev) => ({ ...prev, buyer: null }));
      }
    } catch (err) {
      console.error("Failed to fetch dynamic filter options:", err);
    }
  }, [startDate, endDate, filters.lineNo, filters.moNo, filters.buyer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // --- Data processing logic is also here ---
  const processedData = useMemo(() => {
    const defaultData = {
      stats: {
        totalOutput: 0,
        totalOutputT38: 0,
        totalOutputT39: 0,
        totalDefects: 0,
        defectRate: 0
      },
      topDefects: [],
      chartData: { lineSummary: {}, moSummary: {}, buyerSummary: {} },
      tableData: [],
      trends: { output: [], defects: [], defectRate: [] }
    };

    let mainDataProcessed = defaultData;
    if (data && data.length > 0) {
      let totalOutputT38 = 0,
        totalOutputT39 = 0,
        totalDefects = 0;
      const lineSummary = {},
        moSummary = {},
        buyerSummary = {};
      const defectMap = new Map();
      data.forEach((day) => {
        const filteredFullSummary = (day.daily_full_summary || []).filter(
          (item) =>
            (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
            (!filters.moNo || item.MONo === filters.moNo.value) &&
            (!filters.buyer || item.Buyer === filters.buyer.value)
        );
        filteredFullSummary.forEach((item) => {
          totalOutputT38 += item.CheckedQtyT38;
          totalOutputT39 += item.CheckedQtyT39;
          totalDefects += item.totalDefectsQty;
          (item.DefectArray || []).forEach((defect) => {
            defectMap.set(
              defect.defectName,
              (defectMap.get(defect.defectName) || 0) + defect.defectQty
            );
          });
          const updateSummary = (summaryObj, key, dataItem) => {
            if (!key) return;
            if (!summaryObj[key]) summaryObj[key] = { checked: 0, defects: 0 };
            summaryObj[key].checked += Math.max(
              dataItem.CheckedQtyT38,
              dataItem.CheckedQtyT39
            );
            summaryObj[key].defects += dataItem.totalDefectsQty;
          };
          updateSummary(lineSummary, item.lineNo, item);
          updateSummary(moSummary, item.MONo, item);
          updateSummary(buyerSummary, item.Buyer, item);
        });
      });
      const totalOutput = Math.max(totalOutputT38, totalOutputT39);
      const defectRate =
        totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
      const topDefects = Array.from(defectMap.entries())
        .map(([name, qty]) => ({
          name,
          qty,
          rate: totalOutput > 0 ? (qty / totalOutput) * 100 : 0
        }))
        .sort((a, b) => b.qty - a.qty);
      const filterValidKeys = (summaryObj) =>
        Object.entries(summaryObj)
          .filter(([key]) => key && key !== "undefined" && key !== "null")
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      mainDataProcessed = {
        stats: {
          totalOutput,
          totalOutputT38,
          totalOutputT39,
          totalDefects,
          defectRate
        },
        topDefects,
        chartData: {
          lineSummary: filterValidKeys(lineSummary),
          moSummary: filterValidKeys(moSummary),
          buyerSummary: filterValidKeys(buyerSummary)
        },
        tableData: data
      };
    }

    const dailyTrends = new Map();
    (trendData || []).forEach((day) => {
      const dateStr = day.inspectionDate.split("T")[0];
      const filteredFullSummary = (day.daily_full_summary || []).filter(
        (item) =>
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
      );
      let dailyOutputT38 = 0,
        dailyOutputT39 = 0,
        dailyDefects = 0;
      filteredFullSummary.forEach((item) => {
        dailyOutputT38 += item.CheckedQtyT38 || 0;
        dailyOutputT39 += item.CheckedQtyT39 || 0;
        dailyDefects += item.totalDefectsQty || 0;
      });
      const dailyOutput = Math.max(dailyOutputT38, dailyOutputT39);
      if (dailyOutput > 0 || dailyDefects > 0) {
        dailyTrends.set(dateStr, {
          output: dailyOutput,
          defects: dailyDefects,
          rate: dailyOutput > 0 ? (dailyDefects / dailyOutput) * 100 : 0
        });
      }
    });
    const lastFiveDaysData = Array.from(dailyTrends.entries())
      .map(([date, values]) => ({ date, ...values }))
      .filter((day) => new Date(day.date).getDay() !== 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5);
    return {
      ...mainDataProcessed,
      trends: {
        output: lastFiveDaysData.map((d) => ({
          date: d.date,
          value: d.output
        })),
        defects: lastFiveDaysData.map((d) => ({
          date: d.date,
          value: d.defects
        })),
        defectRate: lastFiveDaysData
      }
    };
  }, [data, trendData, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 p-8">
        <AlertTriangle className="mx-auto mb-2" />
        {error}
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard
          title="Total Output"
          value={processedData.stats.totalOutput.toLocaleString()}
          subValue={`Inside: ${processedData.stats.totalOutputT39.toLocaleString()} | Outside: ${processedData.stats.totalOutputT38.toLocaleString()}`}
          icon={BarChart3}
          trendData={processedData.trends.output}
          insideQty={processedData.stats.totalOutputT39}
          outsideQty={processedData.stats.totalOutputT38}
        />
        <DashboardStatCard
          title="Total Defects"
          value={processedData.stats.totalDefects.toLocaleString()}
          icon={AlertTriangle}
          trendData={processedData.trends.defects}
        />
        <DashboardStatCard
          title="Overall Defect Rate"
          value={`${processedData.stats.defectRate.toFixed(2)}%`}
          rate={processedData.stats.defectRate}
          icon={Activity}
          trendData={processedData.trends.defectRate}
          isTrendChart={true}
        />
      </div>
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
            <Filter className="text-white" size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Filters
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            placeholder="Filter by Line..."
            options={filterOptions.lines}
            value={filters.lineNo}
            onChange={(val) => handleFilterChange("lineNo", val)}
            styles={reactSelectStyles}
            isClearable
          />
          <Select
            placeholder="Filter by MO..."
            options={filterOptions.mos}
            value={filters.moNo}
            onChange={(val) => handleFilterchange("moNo", val)}
            styles={reactSelectStyles}
            isClearable
          />
          <Select
            placeholder="Filter by Buyer..."
            options={filterOptions.buyers}
            value={filters.buyer}
            onChange={(val) => handleFilterChange("buyer", val)}
            styles={reactSelectStyles}
            isClearable
          />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SummaryTable
            data={processedData.tableData}
            activeView={activeView}
            setActiveView={setActiveView}
            filters={filters}
          />
          <DefectRateChart chartData={processedData.chartData} />
        </div>
        <div className="xl:col-span-1">
          <TopDefectsTable topDefects={processedData.topDefects} />
        </div>
      </div>
    </>
  );
};

export default DailyView;
