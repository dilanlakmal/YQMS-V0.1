import React, { useMemo } from "react";
import { BarChart3, Activity, AlertTriangle } from "lucide-react";

import DashboardStatCard from "../CommonChart/DashboardStatCard";
import SummaryTable from "../CommonChart/SummaryTable";
import DefectRateChart from "../CommonChart/DefectRateChart";
import TopDefectsTable from "../CommonChart/TopDefectsTable";
import { getWeekNumber } from "../CommonUI/weeklydateUtils";

// A helper function to perform the final aggregation of merged weekly data
const aggregateWeeklyGroup = (items, keyFields) => {
  const summaryMap = new Map();
  items.forEach((item) => {
    const key = keyFields.map((k) => item[k]).join("-");
    if (!key) return;

    if (!summaryMap.has(key)) {
      const newEntry = {};
      keyFields.forEach((k) => (newEntry[k] = item[k]));
      summaryMap.set(key, {
        ...newEntry,
        CheckedQty: 0,
        CheckedQtyT38: 0,
        CheckedQtyT39: 0,
        totalDefectsQty: 0,
        DefectArray: []
      });
    }

    const entry = summaryMap.get(key);
    entry.CheckedQty += item.CheckedQty || 0;
    entry.CheckedQtyT38 += item.CheckedQtyT38 || 0;
    entry.CheckedQtyT39 += item.CheckedQtyT39 || 0;
    entry.totalDefectsQty += item.totalDefectsQty || 0;
    entry.DefectArray = entry.DefectArray.concat(item.DefectArray || []);
  });

  const finalArray = Array.from(summaryMap.values());
  finalArray.forEach((item) => {
    const defectMap = new Map();
    item.DefectArray.forEach((defect) => {
      if (defectMap.has(defect.defectCode)) {
        defectMap.get(defect.defectCode).defectQty += defect.defectQty;
      } else {
        defectMap.set(defect.defectCode, { ...defect });
      }
    });
    item.DefectArray = Array.from(defectMap.values());
  });
  return finalArray;
};

const WeeklyView = ({
  data,
  trendData,
  filters,
  activeView,
  setActiveView
}) => {
  const processedWeeklyData = useMemo(() => {
    const weeklyMap = new Map();

    // Step 1: Group all daily data into weekly buckets
    data.forEach((day) => {
      const weekId = `${new Date(
        day.inspectionDate
      ).getFullYear()}-W${getWeekNumber(new Date(day.inspectionDate))}`;
      if (!weeklyMap.has(weekId)) {
        weeklyMap.set(weekId, {
          inspectionDate: day.inspectionDate, // Use the first day for reference
          DailyCheckedQty: 0,
          DailyCheckedQtyT38: 0,
          DailyCheckedQtyT39: 0,
          DailytotalDefectsQty: 0,
          DailyDefectArray: [],
          daily_line_MO_summary: [],
          daily_line_summary: [],
          daily_mo_summary: [],
          daily_buyer_summary: []
        });
      }
      const week = weeklyMap.get(weekId);
      week.DailyCheckedQty += day.DailyCheckedQty;
      week.DailyCheckedQtyT38 += day.DailyCheckedQtyT38;
      week.DailyCheckedQtyT39 += day.DailyCheckedQtyT39;
      week.DailytotalDefectsQty += day.DailytotalDefectsQty;
      week.DailyDefectArray.push(...day.DailyDefectArray);
      week.daily_line_MO_summary.push(...day.daily_line_MO_summary);
      week.daily_line_summary.push(...day.daily_line_summary);
      week.daily_mo_summary.push(...day.daily_mo_summary);
      week.daily_buyer_summary.push(...day.daily_buyer_summary);
    });

    // Step 2: For each week, perform final aggregations on the merged arrays
    const weeklyData = Array.from(weeklyMap.values()).map((week) => {
      return {
        ...week,
        daily_line_MO_summary: aggregateWeeklyGroup(
          week.daily_line_MO_summary,
          ["lineNo", "MONo"]
        ),
        daily_line_summary: aggregateWeeklyGroup(week.daily_line_summary, [
          "lineNo"
        ]),
        daily_mo_summary: aggregateWeeklyGroup(week.daily_mo_summary, ["MONo"]),
        daily_buyer_summary: aggregateWeeklyGroup(week.daily_buyer_summary, [
          "Buyer"
        ])
      };
    });

    // Step 3: Process the aggregated weekly data for the dashboard components
    let totalOutputT38 = 0,
      totalOutputT39 = 0,
      totalDefects = 0;
    const lineSummary = {},
      moSummary = {},
      buyerSummary = {};
    const defectMap = new Map();

    weeklyData.forEach((week) => {
      totalOutputT38 += week.DailyCheckedQtyT38;
      totalOutputT39 += week.DailyCheckedQtyT39;
      totalDefects += week.DailytotalDefectsQty;

      week.DailyDefectArray.forEach((defect) => {
        defectMap.set(
          defect.defectName,
          (defectMap.get(defect.defectName) || 0) + defect.defectQty
        );
      });

      week.daily_line_summary.forEach((item) => {
        if (!lineSummary[item.lineNo])
          lineSummary[item.lineNo] = { checked: 0, defects: 0 };
        lineSummary[item.lineNo].checked += Math.max(
          item.CheckedQtyT38,
          item.CheckedQtyT39
        );
        lineSummary[item.lineNo].defects += item.totalDefectsQty;
      });
      week.daily_mo_summary.forEach((item) => {
        if (!moSummary[item.MONo])
          moSummary[item.MONo] = { checked: 0, defects: 0 };
        moSummary[item.MONo].checked += Math.max(
          item.CheckedQtyT38,
          item.CheckedQtyT39
        );
        moSummary[item.MONo].defects += item.totalDefectsQty;
      });
      week.daily_buyer_summary.forEach((item) => {
        if (!buyerSummary[item.Buyer])
          buyerSummary[item.Buyer] = { checked: 0, defects: 0 };
        buyerSummary[item.Buyer].checked += Math.max(
          item.CheckedQtyT38,
          item.CheckedQtyT39
        );
        buyerSummary[item.Buyer].defects += item.totalDefectsQty;
      });
    });

    const totalOutput = Math.max(totalOutputT38, totalOutputT39);
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
    const topDefects = Array.from(defectMap.entries())
      .map(([name, qty]) => ({
        name,
        qty,
        rate: totalOutput > 0 ? (qty / totalOutput) * 100 : 0
      }))
      .sort((a, b) => b.qty - a.qty);

    const filterValidKeys = (obj) =>
      Object.fromEntries(
        Object.entries(obj).filter(
          ([key]) => key && key !== "undefined" && key !== "null"
        )
      );

    // Process trend data similarly
    const weeklyTrendMap = new Map();
    (trendData || []).forEach((day) => {
      const weekId = `${new Date(
        day.inspectionDate
      ).getFullYear()}-W${getWeekNumber(new Date(day.inspectionDate))}`;
      if (!weeklyTrendMap.has(weekId))
        weeklyTrendMap.set(weekId, {
          date: day.inspectionDate,
          output: 0,
          defects: 0
        });
      const week = weeklyTrendMap.get(weekId);
      week.output += day.DailyCheckedQty;
      week.defects += day.DailytotalDefectsQty;
    });
    const lastFiveWeeksData = Array.from(weeklyTrendMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-5)
      .map((week) => ({
        ...week,
        rate: week.output > 0 ? (week.defects / week.output) * 100 : 0
      }));

    return {
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
      tableData: weeklyData,
      trends: {
        output: lastFiveWeeksData.map((d) => ({
          date: d.date,
          value: d.output
        })),
        defects: lastFiveWeeksData.map((d) => ({
          date: d.date,
          value: d.defects
        })),
        defectRate: lastFiveWeeksData
      }
    };
  }, [data, trendData, filters]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard
          title="Total Output"
          value={processedWeeklyData.stats.totalOutput.toLocaleString()}
          rate={null}
          icon={BarChart3}
          trendData={processedWeeklyData.trends.output}
          insideQty={processedWeeklyData.stats.totalOutputT39}
          outsideQty={processedWeeklyData.stats.totalOutputT38}
          trendLabel="Last 5 Weeks" // New Prop
        />
        <DashboardStatCard
          title="Total Defects"
          value={processedWeeklyData.stats.totalDefects.toLocaleString()}
          rate={null}
          icon={AlertTriangle}
          trendData={processedWeeklyData.trends.defects}
          trendLabel="Last 5 Weeks" // New Prop
        />
        <DashboardStatCard
          title="Overall Defect Rate"
          value={`${processedWeeklyData.stats.defectRate.toFixed(2)}%`}
          rate={processedWeeklyData.stats.defectRate}
          icon={Activity}
          trendData={processedWeeklyData.trends.defectRate}
          isTrendChart={true}
          trendLabel="Last 5 Weeks" // New Prop
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SummaryTable
            data={processedWeeklyData.tableData}
            activeView={activeView}
            setActiveView={setActiveView}
            filters={filters}
            isWeeklyView={true} // New Prop
          />
          <DefectRateChart chartData={processedWeeklyData.chartData} />
        </div>
        <div className="xl:col-span-1">
          <TopDefectsTable topDefects={processedWeeklyData.topDefects} />
        </div>
      </div>
    </>
  );
};

export default WeeklyView;
