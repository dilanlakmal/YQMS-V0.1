import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { Loader2, AlertTriangle, Search } from "lucide-react";

const reactSelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    borderColor: "var(--color-border)",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--color-border-hover)" }
  }),
  singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-secondary)",
    zIndex: 30
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--color-bg-accent-active)"
      : isFocused
      ? "var(--color-bg-accent)"
      : "var(--color-bg-secondary)",
    color: "var(--color-text-primary)"
  }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-secondary)" })
};

const getWeekRange = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const formatWeekLabel = (year, week) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoWeekStart = simple;
  isoWeekStart.setDate(simple.getDate() - dayOfWeek + 1);
  if (dayOfWeek === 0) {
    isoWeekStart.setDate(isoWeekStart.getDate() - 7);
  }
  const { start, end } = getWeekRange(isoWeekStart);

  return (
    <div className="text-center text-xs whitespace-nowrap">
      <div className="font-semibold">
        {start.toLocaleDateString([], { month: "short", day: "numeric" })}
      </div>
      <div className="text-gray-400">
        to {end.toLocaleDateString([], { month: "short", day: "numeric" })}
      </div>
    </div>
  );
};

const getCellColor = (value, type) => {
  if (type === "accuracy") {
    if (value >= 100) return "bg-green-100 dark:bg-green-800/20";
    if (value >= 95) return "bg-blue-100 dark:bg-blue-800/20";
    if (value >= 92.5) return "bg-orange-100 dark:bg-orange-800/20";
    return "bg-red-100 dark:bg-red-800/20";
  }
  // For defect rate/ratio
  if (value > 3) return "bg-red-100 dark:bg-red-800/20";
  if (value >= 1) return "bg-orange-100 dark:bg-orange-800/20";
  return "bg-green-100 dark:bg-green-800/20";
};

const QCAccuracyWeeklySummary = () => {
  const { start, end } = getWeekRange(new Date());
  const [filters, setFilters] = useState({
    startWeek: start,
    endWeek: end,
    qaId: null,
    qcId: null,
    reportType: null,
    moNo: null,
    lineNo: null,
    tableNo: null,
    grade: null
  });
  const [filterOptions, setFilterOptions] = useState({
    qaIds: [],
    qcIds: [],
    moNos: [],
    lineNos: [],
    tableNos: []
  });
  const [summaryData, setSummaryData] = useState([]);
  const [trendData, setTrendData] = useState({});
  const [trendType, setTrendType] = useState("Report Type");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groupByMap = {
        "Report Type": "reportType",
        Line: "lineNo",
        Table: "tableNo",
        MO: "moNo",
        QC: "scannedQc.empId"
      };
      const params = {
        startDate: filters.startWeek?.toISOString(),
        endDate: filters.endWeek?.toISOString(),
        qaId: filters.qaId?.value,
        qcId: filters.qcId?.value,
        reportType: filters.reportType?.value,
        moNo: filters.moNo?.value,
        lineNo: filters.lineNo?.value,
        tableNo: filters.tableNo?.value,
        grade: filters.grade?.value,
        groupBy: groupByMap[trendType]
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-accuracy/weekly-summary`,
        { params }
      );
      processData(response.data);
    } catch (err) {
      setError("Failed to load weekly summary.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, trendType]);

  const processData = (data) => {
    const summary = {};
    const trend = {};

    data.forEach((item) => {
      const weekKey = `${item.weekId.year}-W${String(item.weekId.week).padStart(
        2,
        "0"
      )}`;
      if (!summary[weekKey]) {
        summary[weekKey] = {
          checked: 0,
          rejects: 0,
          defects: 0,
          points: 0,
          ...item.weekId
        };
      }
      summary[weekKey].checked += item.totalChecked;
      summary[weekKey].rejects += item.rejectedPcs;
      summary[weekKey].defects += item.totalDefects;
      summary[weekKey].points += item.totalDefectPoints;

      const groupName = item.groupName;
      if (groupName && groupName !== "N/A") {
        if (!trend[groupName]) trend[groupName] = {};
        if (!trend[groupName][weekKey])
          trend[groupName][weekKey] = { checked: 0, points: 0 };
        trend[groupName][weekKey].checked += item.totalChecked;
        trend[groupName][weekKey].points += item.totalDefectPoints;
      }
    });

    setSummaryData(
      Object.values(summary).sort((a, b) => a.year - b.year || a.week - b.week)
    );
    setTrendData(trend);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-accuracy/filter-options`
        );
        const formatOptions = (arr) =>
          arr.map((item) => ({ value: item, label: item }));
        setFilterOptions({
          qaIds: formatOptions(response.data.qaIds),
          qcIds: formatOptions(response.data.qcIds),
          moNos: formatOptions(response.data.moNos),
          lineNos: formatOptions(response.data.lineNos),
          tableNos: formatOptions(response.data.tableNos)
        });
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- NEW: Memoized and sorted keys for the trend chart ---
  const sortedTrendKeys = useMemo(() => {
    let keys = Object.keys(trendData);

    // 1. Conditionally filter out 'NA' keys
    if (trendType === "Line" || trendType === "Table") {
      keys = keys.filter((key) => key !== "NA");
    }

    // 2. Sort the keys with a custom comparison function
    keys.sort((a, b) => {
      // For 'Line' and 'Table', attempt a numeric sort
      if (trendType === "Line" || trendType === "Table") {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);

        // If both values are valid numbers, sort them numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
      }

      // For all other cases (or if numeric parse fails), use default string comparison
      return a.localeCompare(b);
    });

    return keys;
  }, [trendData, trendType]); // Re-run only when data or type changes

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const handleWeekChange = (date, type) => {
    const { start, end } = getWeekRange(date);
    setFilters((f) => ({ ...f, [type]: type === "startWeek" ? start : end }));
  };

  const handleSearch = () => {
    fetchData();
  };

  const gradeOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" }
  ];

  const reportTypeOptions = [
    { value: "First Output", label: "First Output" },
    { value: "Inline Sewing", label: "Inline Sewing" },
    { value: "Inline Finishing", label: "Inline Finishing" }
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DatePicker
            selected={filters.startWeek}
            onChange={(date) => handleWeekChange(date, "startWeek")}
            selectsStart
            startDate={filters.startWeek}
            endDate={filters.endWeek}
            dateFormat="MM/dd/yyyy"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            popperPlacement="bottom-start"
            popperClassName="react-datepicker-popper-z-50"
            portalId="root-portal"
          />
          <DatePicker
            selected={filters.endWeek}
            onChange={(date) => handleWeekChange(date, "endWeek")}
            selectsEnd
            startDate={filters.startWeek}
            endDate={filters.endWeek}
            minDate={filters.startWeek}
            dateFormat="MM/dd/yyyy"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            popperPlacement="bottom-start"
            popperClassName="react-datepicker-popper-z-50"
            portalId="root-portal"
          />
          <Select
            placeholder="QA ID"
            options={filterOptions.qaIds}
            value={filters.qaId}
            onChange={(val) => handleFilterChange("qaId", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="QC ID"
            options={filterOptions.qcIds}
            value={filters.qcId}
            onChange={(val) => handleFilterChange("qcId", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="MO No"
            options={filterOptions.moNos}
            value={filters.moNo}
            onChange={(val) => handleFilterChange("moNo", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Report Type"
            options={reportTypeOptions}
            value={filters.reportType}
            onChange={(val) => handleFilterChange("reportType", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Line No"
            options={filterOptions.lineNos}
            value={filters.lineNo}
            onChange={(val) => handleFilterChange("lineNo", val)}
            isDisabled={filters.reportType?.value === "Inline Finishing"}
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Table No"
            options={filterOptions.tableNos}
            value={filters.tableNo}
            onChange={(val) => handleFilterChange("tableNo", val)}
            isDisabled={
              filters.reportType?.value &&
              filters.reportType.value !== "Inline Finishing"
            }
            isClearable
            styles={reactSelectStyles}
          />
          <Select
            placeholder="Grade"
            options={gradeOptions}
            value={filters.grade}
            onChange={(val) => handleFilterChange("grade", val)}
            isClearable
            styles={reactSelectStyles}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="col-span-full lg:col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}{" "}
            Search
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      )}
      {error && (
        <div className="text-center p-8 text-red-500">
          <AlertTriangle className="mx-auto" />
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Weekly Summary</h3>
            <div className="max-h-[400px] overflow-auto relative">
              <table className="w-full text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left font-bold border dark:border-gray-600 sticky left-0 z-10 bg-gray-100 dark:bg-gray-700">
                      Details
                    </th>
                    {summaryData.map((week) => (
                      <th
                        key={`${week.year}-${week.week}`}
                        className="p-2 font-bold border dark:border-gray-600 w-32"
                      >
                        {formatWeekLabel(week.year, week.week)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Checked Qty",
                    "Rejects Pcs",
                    "Defect Qty",
                    "Defect Rate",
                    "Defect Ratio",
                    "Accuracy",
                    "Grade"
                  ].map((row) => (
                    <tr
                      key={row}
                      className="border-b dark:border-gray-600 last:border-b-0"
                    >
                      <td className="p-2 font-semibold border-l border-r dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                        {row}
                      </td>
                      {summaryData.map((week) => {
                        const defectRate =
                          week.checked > 0
                            ? (week.defects / week.checked) * 100
                            : 0;
                        const defectRatio =
                          week.checked > 0
                            ? (week.rejects / week.checked) * 100
                            : 0;
                        const accuracy =
                          week.checked > 0
                            ? (1 - week.points / week.checked) * 100
                            : 100;
                        let grade = "D";
                        if (accuracy >= 100) grade = "A";
                        else if (accuracy >= 95) grade = "B";
                        else if (accuracy >= 92.5) grade = "C";

                        let value, colorClass;
                        switch (row) {
                          case "Checked Qty":
                            value = week.checked.toLocaleString();
                            break;
                          case "Rejects Pcs":
                            value = week.rejects.toLocaleString();
                            break;
                          case "Defect Qty":
                            value = week.defects.toLocaleString();
                            break;
                          case "Defect Rate":
                            value = `${defectRate.toFixed(2)}%`;
                            colorClass = getCellColor(defectRate, "rate");
                            break;
                          case "Defect Ratio":
                            value = `${defectRatio.toFixed(2)}%`;
                            colorClass = getCellColor(defectRatio, "rate");
                            break;
                          case "Accuracy":
                            value = `${accuracy.toFixed(2)}%`;
                            colorClass = getCellColor(accuracy, "accuracy");
                            break;
                          case "Grade":
                            value = grade;
                            colorClass = getCellColor(accuracy, "accuracy");
                            break;
                          default:
                            value = "";
                        }
                        return (
                          <td
                            key={`${week.year}-${week.week}-${row}`}
                            className={`p-2 text-center font-bold border-r dark:border-gray-600 ${colorClass}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Weekly Accuracy Trend</h3>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-md">
                {["Report Type", "Line", "Table", "MO", "QC"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTrendType(type)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${
                      trendType === type
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[500px] overflow-auto relative">
              <table className="w-full text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left font-bold border dark:border-gray-600 sticky top-0 left-0 z-20 bg-gray-100 dark:bg-gray-700">
                      {trendType}
                    </th>
                    {summaryData.map((week) => (
                      <th
                        key={`${week.year}-${week.week}`}
                        className="p-2 font-bold border dark:border-gray-600 sticky top-0 z-10 bg-gray-100 dark:bg-gray-700 w-32"
                      >
                        {formatWeekLabel(week.year, week.week)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* --- CHANGE: Use the new sorted and filtered keys --- */}
                  {sortedTrendKeys.map((groupName) => (
                    <tr
                      key={groupName}
                      className="border-b dark:border-gray-600 last:border-b-0"
                    >
                      <td className="p-2 font-semibold border-l border-r dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                        {groupName}
                      </td>
                      {summaryData.map((week) => {
                        const weekKey = `${week.year}-W${String(
                          week.week
                        ).padStart(2, "0")}`;
                        const weekData = trendData[groupName]?.[weekKey];
                        const accuracy =
                          weekData && weekData.checked > 0
                            ? (1 - weekData.points / weekData.checked) * 100
                            : null;
                        const colorClass =
                          accuracy !== null
                            ? getCellColor(accuracy, "accuracy")
                            : "";
                        return (
                          <td
                            key={`${weekKey}-${groupName}`}
                            className={`p-2 text-center font-bold border-r dark:border-gray-600 ${colorClass}`}
                          >
                            {accuracy !== null
                              ? `${accuracy.toFixed(2)}%`
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QCAccuracyWeeklySummary;
