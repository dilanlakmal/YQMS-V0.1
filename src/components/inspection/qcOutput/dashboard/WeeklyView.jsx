// ===== WeeklyView.jsx =====
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
import {
  getWeekNumber,
  getStartOfWeek,
  getEndOfWeek,
  formatWeekLabel
} from "../CommonUI/weekUtils";

//-- Dashboard Sub-Components --
import DashboardStatCard from "../CommonChart/DashboardStatCard";
import SummaryTable from "../CommonChart/SummaryTable";
import DefectRateChart from "../CommonChart/DefectRateChart";
import TopDefectsTable from "../CommonChart/TopDefectsTable";

/**
 * WeeklyView Component - Aggregates daily data into weekly summaries
 * Uses the same backend endpoints as DailyView but groups data by week
 */
const WeeklyView = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeView, setActiveView] = useState("Line-MO");

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

  // Adjust dates to week boundaries (Monday to Sunday)
  const adjustedStartDate = useMemo(() => {
    return startDate ? getStartOfWeek(startDate) : null;
  }, [startDate]);

  const adjustedEndDate = useMemo(() => {
    return endDate ? getEndOfWeek(endDate) : null;
  }, [endDate]);

  // --- Data fetching logic (same endpoints as DailyView) ---
  const fetchData = useCallback(async () => {
    if (!adjustedStartDate || !adjustedEndDate) return;
    setLoading(true);
    setError(null);

    // Calculate 5 weeks before for trend (35 days = ~5 weeks)
    const trendEndDate = new Date(adjustedStartDate);
    trendEndDate.setDate(trendEndDate.getDate() - 1);
    const trendStartDate = new Date(trendEndDate);
    trendStartDate.setDate(trendEndDate.getDate() - 34); // 5 weeks back

    try {
      const [mainResponse, trendResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qc1-summary/dashboard-data`, {
          params: {
            startDate: formatDateForAPI(adjustedStartDate),
            endDate: formatDateForAPI(adjustedEndDate)
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
  }, [adjustedStartDate, adjustedEndDate]);

  const fetchFilterOptions = useCallback(async () => {
    if (!adjustedStartDate || !adjustedEndDate) return;
    try {
      const params = {
        startDate: formatDateForAPI(adjustedStartDate),
        endDate: formatDateForAPI(adjustedEndDate),
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
  }, [
    adjustedStartDate,
    adjustedEndDate,
    filters.lineNo,
    filters.moNo,
    filters.buyer
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // --- Client-side weekly aggregation logic ---
  const aggregateDataByWeek = useCallback((dailyData) => {
    const weekMap = new Map();

    dailyData.forEach((day) => {
      const dayDate = new Date(day.inspectionDate);
      const weekStart = getStartOfWeek(dayDate);
      const weekEnd = getEndOfWeek(dayDate);
      const weekNo = getWeekNumber(dayDate);
      const year = dayDate.getFullYear();
      const weekKey = `${year}-W${weekNo}`;

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekNo,
          year,
          startDate: formatDateForAPI(weekStart),
          endDate: formatDateForAPI(weekEnd),
          weekLabel: formatWeekLabel(weekStart, weekEnd),
          inspectionDate: day.inspectionDate, // Keep for compatibility
          daily_full_summary: [],
          daily_line_MO_summary: [],
          daily_line_summary: [],
          daily_mo_summary: [],
          daily_buyer_summary: []
        });
      }

      const weekData = weekMap.get(weekKey);

      // Aggregate daily_full_summary
      (day.daily_full_summary || []).forEach((item) => {
        weekData.daily_full_summary.push(item);
      });

      // Aggregate daily_line_MO_summary
      (day.daily_line_MO_summary || []).forEach((item) => {
        weekData.daily_line_MO_summary.push(item);
      });

      // Aggregate daily_line_summary
      (day.daily_line_summary || []).forEach((item) => {
        weekData.daily_line_summary.push(item);
      });

      // Aggregate daily_mo_summary
      (day.daily_mo_summary || []).forEach((item) => {
        weekData.daily_mo_summary.push(item);
      });

      // Aggregate daily_buyer_summary
      (day.daily_buyer_summary || []).forEach((item) => {
        weekData.daily_buyer_summary.push(item);
      });
    });

    // Now consolidate each week's aggregated items by line/MO/buyer
    const consolidatedWeeks = Array.from(weekMap.values()).map((week) => {
      return {
        ...week,
        daily_full_summary: consolidateItems(week.daily_full_summary),
        daily_line_MO_summary: consolidateItems(week.daily_line_MO_summary, [
          "lineNo",
          "MONo"
        ]),
        daily_line_summary: consolidateItems(week.daily_line_summary, [
          "lineNo"
        ]),
        daily_mo_summary: consolidateItems(week.daily_mo_summary, ["MONo"]),
        daily_buyer_summary: consolidateItems(week.daily_buyer_summary, [
          "Buyer"
        ])
      };
    });

    return consolidatedWeeks.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNo - b.weekNo;
    });
  }, []);

  // Helper function to consolidate items by key fields
  const consolidateItems = (items, keyFields = ["lineNo", "MONo", "Buyer"]) => {
    const consolidatedMap = new Map();

    items.forEach((item) => {
      const key = keyFields.map((field) => item[field] || "N/A").join("|");

      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, {
          lineNo: item.lineNo,
          MONo: item.MONo,
          Buyer: item.Buyer,
          CheckedQtyT38: 0,
          CheckedQtyT39: 0,
          totalDefectsQty: 0,
          DefectArray: []
        });
      }

      const consolidated = consolidatedMap.get(key);
      consolidated.CheckedQtyT38 += item.CheckedQtyT38 || 0;
      consolidated.CheckedQtyT39 += item.CheckedQtyT39 || 0;
      consolidated.totalDefectsQty += item.totalDefectsQty || 0;

      // Merge DefectArray
      (item.DefectArray || []).forEach((defect) => {
        const existingDefect = consolidated.DefectArray.find(
          (d) => d.defectCode === defect.defectCode
        );
        if (existingDefect) {
          existingDefect.defectQty += defect.defectQty;
        } else {
          consolidated.DefectArray.push({ ...defect });
        }
      });
    });

    return Array.from(consolidatedMap.values());
  };

  // --- Process weekly aggregated data ---
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

    // Aggregate daily data into weeks
    const weeklyData = aggregateDataByWeek(data);

    let mainDataProcessed = defaultData;
    if (weeklyData && weeklyData.length > 0) {
      let totalOutputT38 = 0,
        totalOutputT39 = 0,
        totalDefects = 0;
      const lineSummary = {},
        moSummary = {},
        buyerSummary = {};
      const defectMap = new Map();

      weeklyData.forEach((week) => {
        const filteredFullSummary = (week.daily_full_summary || []).filter(
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
        tableData: weeklyData
      };
    }

    // Process trend data (last 5 weeks)
    const weeklyTrendData = aggregateDataByWeek(trendData);
    const weeklyTrends = new Map();

    weeklyTrendData.forEach((week) => {
      const filteredFullSummary = (week.daily_full_summary || []).filter(
        (item) =>
          (!filters.lineNo || item.lineNo === filters.lineNo.value) &&
          (!filters.moNo || item.MONo === filters.moNo.value) &&
          (!filters.buyer || item.Buyer === filters.buyer.value)
      );

      let weekOutputT38 = 0,
        weekOutputT39 = 0,
        weekDefects = 0;

      filteredFullSummary.forEach((item) => {
        weekOutputT38 += item.CheckedQtyT38 || 0;
        weekOutputT39 += item.CheckedQtyT39 || 0;
        weekDefects += item.totalDefectsQty || 0;
      });

      const weekOutput = Math.max(weekOutputT38, weekOutputT39);
      if (weekOutput > 0 || weekDefects > 0) {
        weeklyTrends.set(`${week.year}-W${week.weekNo}`, {
          weekNo: week.weekNo,
          weekLabel: week.weekLabel,
          output: weekOutput,
          defects: weekDefects,
          rate: weekOutput > 0 ? (weekDefects / weekOutput) * 100 : 0
        });
      }
    });

    const lastFiveWeeksData = Array.from(weeklyTrends.values())
      .sort((a, b) => a.weekNo - b.weekNo)
      .slice(-5);

    return {
      ...mainDataProcessed,
      trends: {
        output: lastFiveWeeksData.map((d) => ({
          weekNo: d.weekNo,
          weekLabel: d.weekLabel,
          value: d.output
        })),
        defects: lastFiveWeeksData.map((d) => ({
          weekNo: d.weekNo,
          weekLabel: d.weekLabel,
          value: d.defects
        })),
        defectRate: lastFiveWeeksData.map((d) => ({
          weekNo: d.weekNo,
          weekLabel: d.weekLabel,
          rate: d.rate
        }))
      }
    };
  }, [data, trendData, filters, aggregateDataByWeek]);

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
          isWeekly={true}
        />
        <DashboardStatCard
          title="Total Defects"
          value={processedData.stats.totalDefects.toLocaleString()}
          icon={AlertTriangle}
          trendData={processedData.trends.defects}
          isWeekly={true}
        />
        <DashboardStatCard
          title="Overall Defect Rate"
          value={`${processedData.stats.defectRate.toFixed(2)}%`}
          rate={processedData.stats.defectRate}
          icon={Activity}
          trendData={processedData.trends.defectRate}
          isTrendChart={true}
          isWeekly={true}
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
            onChange={(val) => handleFilterChange("moNo", val)}
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
            isWeekly={true}
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

export default WeeklyView;
