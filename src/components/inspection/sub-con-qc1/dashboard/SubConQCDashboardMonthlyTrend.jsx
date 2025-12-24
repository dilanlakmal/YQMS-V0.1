import axios from "axios";
import { Loader2, Search, XCircle } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";

// --- Reusable UI Components ---
const FilterControl = ({ label, children }) => (
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </label>
    {children}
  </div>
);

const ToggleButton = ({ label, value, activeValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
      activeValue === value
        ? "bg-indigo-600 text-white shadow-md"
        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
  >
    {label}
  </button>
);

// --- Custom Sort Function for Line No ---
const customAlphanumericSort = (a, b) => {
  const reA = /([A-Z]+)(\d+)/;
  const reN = /(\d+)/;
  const cleanA = String(a).replace(/\s/g, "").toUpperCase();
  const cleanB = String(b).replace(/\s/g, "").toUpperCase();
  const aMatch = cleanA.match(reA);
  const bMatch = cleanB.match(reA);
  if (aMatch && bMatch) {
    if (aMatch[1] === bMatch[1]) {
      return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
    }
    return aMatch[1].localeCompare(bMatch[1]);
  }
  const aNumMatch = cleanA.match(reN);
  const bNumMatch = cleanB.match(reN);
  if (
    aNumMatch &&
    bNumMatch &&
    aNumMatch[0] === cleanA &&
    bNumMatch[0] === cleanB
  ) {
    return parseInt(cleanA, 10) - parseInt(cleanB, 10);
  }
  return cleanA.localeCompare(cleanB);
};

// --- The Main Table Component for Each Factory ---
const FactoryTrendTable = ({
  factory,
  trends,
  dateRangeText,
  localFilterOptions
}) => {
  const [viewMode, setViewMode] = useState("default");
  const [topN, setTopN] = useState({ value: "All", label: "All Defects" });
  const [selectedDefects, setSelectedDefects] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedMOs, setSelectedMOs] = useState([]);

  const processedData = useMemo(() => {
    // 1. Local Filtering
    const lineSet =
      selectedLines.length > 0
        ? new Set(selectedLines.map((l) => l.value))
        : null;
    const moSet =
      selectedMOs.length > 0 ? new Set(selectedMOs.map((m) => m.value)) : null;
    const defectSet =
      selectedDefects.length > 0
        ? new Set(selectedDefects.map((d) => d.value))
        : null;
    let filteredTrends = trends.filter(
      (t) =>
        (!lineSet || lineSet.has(t.lineNo)) &&
        (!moSet || moSet.has(t.moNo)) &&
        (!defectSet || defectSet.has(t.defectName))
    );

    // 2. Aggregation based on View Mode
    const aggregationMap = new Map();
    filteredTrends.forEach((trend) => {
      let key, rowData;
      if (viewMode === "line") {
        key = `${trend.lineNo}#-#${trend.defectName}`;
        rowData = { lineNo: trend.lineNo, defectName: trend.defectName };
      } else if (viewMode === "mo") {
        key = `${trend.moNo}#-#${trend.defectName}`;
        rowData = { moNo: trend.moNo, defectName: trend.defectName };
      } else {
        key = `${trend.lineNo}#-#${trend.moNo}#-#${trend.defectName}`;
        rowData = {
          lineNo: trend.lineNo,
          moNo: trend.moNo,
          defectName: trend.defectName
        };
      }
      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, { ...rowData, monthlyData: {}, key });
      }
      const entry = aggregationMap.get(key);
      if (!entry.monthlyData[trend.monthName]) {
        entry.monthlyData[trend.monthName] = { qty: 0, checkedQty: 0 };
      }
      entry.monthlyData[trend.monthName].qty += trend.qty;
      entry.monthlyData[trend.monthName].checkedQty += trend.checkedQty;
    });

    let aggregatedRows = Array.from(aggregationMap.values());

    // 3. Get all unique months and sort them chronologically
    const monthOrder = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12
    };
    const allMonths = [
      ...new Set(aggregatedRows.flatMap((row) => Object.keys(row.monthlyData)))
    ].sort((a, b) => monthOrder[a] - monthOrder[b]);

    // 4. Calculate Top N defects for each month
    const monthlyTopRowKeys = new Map();
    if (topN.value !== "All") {
      const topNValue = parseInt(topN.value, 10);
      allMonths.forEach((month) => {
        const topRowsForMonth = aggregatedRows
          .map((row) => ({
            key: row.key,
            qty: row.monthlyData[month]?.qty || 0
          }))
          .filter((item) => item.qty > 0)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, topNValue)
          .map((item) => item.key);
        monthlyTopRowKeys.set(month, new Set(topRowsForMonth));
      });
    }

    // 5. Filter rows to only include those that are "Top N" in at least one month
    const finalRows = aggregatedRows.filter((row) => {
      if (topN.value === "All") return true;
      for (const topKeysForAMonth of monthlyTopRowKeys.values()) {
        if (topKeysForAMonth.has(row.key)) return true;
      }
      return false;
    });

    // 6. Create final pivot rows
    const rows = finalRows
      .map((row) => {
        const rowData = { ...row, months: {} };
        allMonths.forEach((month) => {
          const data = row.monthlyData[month];
          const isTopDefectForMonth =
            topN.value === "All" ||
            (monthlyTopRowKeys.get(month) &&
              monthlyTopRowKeys.get(month).has(row.key));
          if (data && data.checkedQty > 0 && isTopDefectForMonth) {
            rowData.months[month] = {
              qty: data.qty,
              rate: (data.qty / data.checkedQty) * 100
            };
          } else {
            rowData.months[month] = null;
          }
        });
        return rowData;
      })
      .sort((a, b) => customAlphanumericSort(a.lineNo, b.lineNo));

    return { headers: allMonths, rows };
  }, [trends, viewMode, topN, selectedDefects, selectedLines, selectedMOs]);

  const getRateColorClass = (rate) => {
    if (rate > 3) return "bg-red-100 dark:bg-red-900/50";
    if (rate >= 1) return "bg-orange-100 dark:bg-orange-900/50";
    if (rate > 0) return "bg-green-100 dark:bg-green-900/50";
    return "bg-white dark:bg-gray-800";
  };

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "42px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
          {factory}
          <span className="block text-sm font-normal text-indigo-500">
            {dateRangeText} - QC Monthly Defect Trend
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <ToggleButton
            label="Default View"
            value="default"
            activeValue={viewMode}
            onClick={setViewMode}
          />
          <ToggleButton
            label="Line View"
            value="line"
            activeValue={viewMode}
            onClick={setViewMode}
          />
          <ToggleButton
            label="MO View"
            value="mo"
            activeValue={viewMode}
            onClick={setViewMode}
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {viewMode !== "mo" && (
          <FilterControl label="Filter by Line No">
            <Select
              options={localFilterOptions.lineNos}
              value={selectedLines}
              onChange={setSelectedLines}
              isMulti
              isClearable
              placeholder="All Lines..."
              styles={reactSelectStyles}
              closeMenuOnSelect={false}
            />
          </FilterControl>
        )}
        {viewMode !== "line" && (
          <FilterControl label="Filter by MO No">
            <Select
              options={localFilterOptions.moNos}
              value={selectedMOs}
              onChange={setSelectedMOs}
              isMulti
              isClearable
              placeholder="All MOs..."
              styles={reactSelectStyles}
              closeMenuOnSelect={false}
            />
          </FilterControl>
        )}
        <FilterControl label="Filter by Defect Name">
          <Select
            options={localFilterOptions.defects}
            value={selectedDefects}
            onChange={setSelectedDefects}
            isMulti
            isClearable
            placeholder="All Defects..."
            styles={reactSelectStyles}
            closeMenuOnSelect={false}
          />
        </FilterControl>
        <FilterControl label="Show Top N Defects">
          <Select
            options={[
              { value: "All", label: "All Defects" },
              { value: "3", label: "Top 3" },
              { value: "5", label: "Top 5" },
              { value: "7", label: "Top 7" },
              { value: "10", label: "Top 10" }
            ]}
            value={topN}
            onChange={setTopN}
            styles={reactSelectStyles}
          />
        </FilterControl>
      </div>

      <div className="overflow-x-auto max-h-[80vh] rounded-lg border dark:border-gray-700">
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-20">
            <tr>
              {viewMode !== "mo" && (
                <th className="p-2 border-b border-r dark:border-gray-600 text-left font-semibold sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 w-24">
                  Line
                </th>
              )}
              {viewMode !== "line" && (
                <th
                  className="p-2 border-b border-r dark:border-gray-600 text-left font-semibold sticky z-10 bg-gray-100 dark:bg-gray-700 w-32"
                  style={{ left: viewMode === "default" ? "96px" : "0" }}
                >
                  MO
                </th>
              )}
              <th
                className="p-2 border-b border-r dark:border-gray-600 text-left font-semibold sticky z-10 bg-gray-100 dark:bg-gray-700 w-48"
                style={{
                  left:
                    viewMode === "default"
                      ? "224px"
                      : viewMode === "line"
                      ? "96px"
                      : "128px"
                }}
              >
                Defect Name
              </th>
              {processedData.headers.map((month) => (
                <th
                  key={month}
                  className="p-2 border-b dark:border-gray-600 min-w-[100px] text-center font-semibold"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.rows.length > 0 ? (
              processedData.rows.map((row) => (
                <tr
                  key={row.key}
                  className="group hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {viewMode !== "mo" && (
                    <td className="p-2 border-b border-r dark:border-gray-600 font-medium sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50">
                      {row.lineNo}
                    </td>
                  )}
                  {viewMode !== "line" && (
                    <td
                      className="p-2 border-b border-r dark:border-gray-600 font-medium sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50"
                      style={{ left: viewMode === "default" ? "96px" : "0" }}
                    >
                      {row.moNo}
                    </td>
                  )}
                  <td
                    className="p-2 border-b border-r dark:border-gray-600 font-medium sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50"
                    style={{
                      left:
                        viewMode === "default"
                          ? "224px"
                          : viewMode === "line"
                          ? "96px"
                          : "128px"
                    }}
                  >
                    {row.defectName}
                  </td>
                  {processedData.headers.map((month) => {
                    const cellData = row.months[month];
                    const bgColor = cellData
                      ? getRateColorClass(cellData.rate)
                      : "";
                    return (
                      <td
                        key={month}
                        className={`p-2 border-b dark:border-gray-600 text-center transition-colors ${bgColor}`}
                      >
                        {cellData ? (
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-100">
                              {cellData.rate.toFixed(2)}%
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              ({cellData.qty})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={processedData.headers.length + 3}
                  className="text-center p-8 text-gray-500 dark:text-gray-400"
                >
                  No data available for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Component Wrapper
const SubConQCDashboardMonthlyTrend = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    year: { value: currentYear, label: currentYear.toString() },
    monthRange: [0, new Date().getMonth()],
    factory: null,
    buyer: null
  });
  const [data, setData] = useState({
    trendData: [],
    filterOptions: { buyers: [], lineNos: [], moNos: [] }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allFactories, setAllFactories] = useState([]);

  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`
        );
        setAllFactories(res.data.map((f) => f.factory));
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []);

  const userFactory = useMemo(() => {
    if (user && user.name && allFactories.length > 0) {
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );
      if (matchedFactoryName)
        return { value: matchedFactoryName, label: matchedFactoryName };
    }
    return null;
  }, [user, allFactories]);

  useEffect(() => {
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const params = {
        year: filters.year.value,
        startMonth: filters.monthRange[0] + 1,
        endMonth: filters.monthRange[1] + 1,
        factory: filters.factory?.value,
        buyer: filters.buyer?.value
      };
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-qc-dashboard-monthly-trend`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard monthly trend data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (name, value) =>
    setFilters((prev) => ({ ...prev, [name]: value }));

  const clearFilters = () =>
    setFilters({
      year: { value: currentYear, label: currentYear.toString() },
      monthRange: [0, 11],
      factory: userFactory || null,
      buyer: null
    });

  const factoryFilterOptions = useMemo(() => {
    if (userFactory) return [userFactory];
    return allFactories.map((f) => ({ value: f, label: f }));
  }, [userFactory, allFactories]);

  const buyerFilterOptions = useMemo(
    () => data.filterOptions.buyers.map((b) => ({ value: b, label: b })),
    [data.filterOptions.buyers]
  );

  const localFilterOptionsByFactory = useMemo(() => {
    const options = {};
    data.trendData.forEach((factoryData) => {
      const allTrends = factoryData.trends;
      options[factoryData.factory] = {
        lineNos: [...new Set(allTrends.map((t) => t.lineNo))]
          .sort(customAlphanumericSort)
          .map((l) => ({ value: l, label: l })),
        moNos: [...new Set(allTrends.map((t) => t.moNo))]
          .sort()
          .map((m) => ({ value: m, label: m })),
        defects: [...new Set(allTrends.map((t) => t.defectName))]
          .sort()
          .map((d) => ({ value: d, label: d }))
      };
    });
    return options;
  }, [data.trendData]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const dateRangeText = `Year: ${filters.year.label} | Months: ${
    monthNames[filters.monthRange[0]]
  } to ${monthNames[filters.monthRange[1]]}`;

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)",
      minHeight: "42px"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 9999
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  const yearOptions = useMemo(() => {
    const endYear = new Date().getFullYear() + 1;
    const years = [];
    for (let y = 2020; y <= endYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse();
  }, []);

  const monthSliderMarks = monthNames.reduce((acc, month, index) => {
    acc[index] = month;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Year
            </label>
            <Select
              options={yearOptions}
              value={filters.year}
              onChange={(val) => handleFilterChange("year", val)}
              styles={reactSelectStyles}
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Month Range
            </label>
            <div className="px-3 pt-2">
              <Slider
                range
                min={0}
                max={11}
                marks={monthSliderMarks}
                value={filters.monthRange}
                onChange={(val) => handleFilterChange("monthRange", val)}
                trackStyle={[{ backgroundColor: "#4f46e5" }]}
                handleStyle={[
                  { borderColor: "#4f46e5" },
                  { borderColor: "#4f46e5" }
                ]}
              />
            </div>
          </div>
          <FilterControl label="Factory">
            <Select
              options={factoryFilterOptions}
              value={filters.factory}
              onChange={(val) => handleFilterChange("factory", val)}
              isDisabled={!!userFactory}
              isClearable={!userFactory}
              placeholder="All Factories"
              styles={reactSelectStyles}
            />
          </FilterControl>
          <FilterControl label="Buyer">
            <Select
              options={buyerFilterOptions}
              value={filters.buyer}
              onChange={(val) => handleFilterChange("buyer", val)}
              isClearable
              placeholder="All Buyers"
              styles={reactSelectStyles}
            />
          </FilterControl>
          <div className="flex items-center gap-2 pt-6">
            <button
              onClick={clearFilters}
              className="p-2.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <XCircle size={20} />
            </button>
            <button className="p-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-full flex items-center justify-center gap-2">
              <Search size={20} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
        </div>
      ) : data.trendData.length > 0 ? (
        <div className="space-y-8">
          {data.trendData.map((factoryData) => (
            <FactoryTrendTable
              key={factoryData.factory}
              factory={factoryData.factory}
              trends={factoryData.trends}
              dateRangeText={dateRangeText}
              localFilterOptions={
                localFilterOptionsByFactory[factoryData.factory] || {}
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-16 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            No Data Found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please adjust your filters or select a different date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubConQCDashboardMonthlyTrend;
