import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { format } from "date-fns";

const QCSunriseDashboard = () => {
  // State for filters
  const [filters, setFilters] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    lineNo: "",
    MONo: "",
    Color: "",
    Size: "",
    Buyer: "",
    defectName: ""
  });

  // State for filter options (for dropdowns)
  const [filterOptions, setFilterOptions] = useState({
    lineNos: [],
    MONos: [],
    Colors: [],
    Sizes: [],
    Buyers: [],
    defectNames: []
  });

  // State for dashboard data
  const [data, setData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalCheckedQty: 0,
    totalDefectsQty: 0,
    defectRate: 0
  });

  // Fetch filter options with cross-filtering
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/sunrise/qc1-filters`,
        {
          params: filters
        }
      );
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sunrise/qc1-data`, {
        params: filters
      });
      const fetchedData = response.data;

      // Calculate summary stats
      const totalCheckedQty = fetchedData.reduce(
        (sum, item) => sum + item.CheckedQty,
        0
      );
      const totalDefectsQty = fetchedData.reduce(
        (sum, item) => sum + item.totalDefectsQty,
        0
      );
      const defectRate =
        totalCheckedQty > 0
          ? ((totalDefectsQty / totalCheckedQty) * 100).toFixed(2)
          : 0;

      // Sort DefectArray by defect rate (highest to lowest) for each item
      const sortedData = fetchedData.map((item) => {
        const sortedDefectArray = [...item.DefectArray].sort((a, b) => {
          const rateA =
            item.CheckedQty > 0 ? (a.defectQty / item.CheckedQty) * 100 : 0;
          const rateB =
            item.CheckedQty > 0 ? (b.defectQty / item.CheckedQty) * 100 : 0;
          return rateB - rateA; // Sort descending
        });
        return { ...item, DefectArray: sortedDefectArray };
      });

      setSummaryStats({
        totalCheckedQty,
        totalDefectsQty,
        defectRate
      });
      setData(sortedData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Fetch filter options and data on mount and when filters change
  useEffect(() => {
    fetchFilterOptions();
    fetchDashboardData();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Determine background color for defect rate
  const getDefectRateColor = (rate) => {
    if (rate > 5) return "bg-red-100";
    if (rate >= 3 && rate <= 5) return "bg-orange-100";
    return "bg-green-100";
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
        <div className="grid grid-cols-8 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Line No */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Line No
            </label>
            <select
              name="lineNo"
              value={filters.lineNo}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.lineNos.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>

          {/* MO No */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              MO No
            </label>
            <select
              name="MONo"
              value={filters.MONo}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.MONos.map((mo) => (
                <option key={mo} value={mo}>
                  {mo}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <select
              name="Color"
              value={filters.Color}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.Colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Size
            </label>
            <select
              name="Size"
              value={filters.Size}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.Sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Buyer
            </label>
            <select
              name="Buyer"
              value={filters.Buyer}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.Buyers.map((buyer) => (
                <option key={buyer} value={buyer}>
                  {buyer}
                </option>
              ))}
            </select>
          </div>

          {/* Defect Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Defect Name
            </label>
            <select
              name="defectName"
              value={filters.defectName}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {filterOptions.defectNames.map((defect) => (
                <option key={defect} value={defect}>
                  {defect}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Checked Qty Card */}
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Checked Qty</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {summaryStats.totalCheckedQty}
            </p>
          </div>
        </div>

        {/* Defects Qty Card */}
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Defects Qty</h3>
            <p className="text-3xl font-bold text-red-600">
              {summaryStats.totalDefectsQty}
            </p>
          </div>
        </div>

        {/* Defect Rate Card */}
        <div
          className={`p-6 rounded-lg shadow-md flex items-center ${getDefectRateColor(
            summaryStats.defectRate
          )}`}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Defect Rate</h3>
            <p className="text-3xl font-bold text-gray-800">
              {summaryStats.defectRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Summary Table</h2>
        <div className="overflow-x-auto max-h-[500px] relative">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Line No
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  MO No
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Color
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Size
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Checked Qty
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defects Qty
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defect Rate
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Defect Details
                </th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {data.map((item, index) => {
                // Calculate defect rate for this row
                const rowDefectRate =
                  item.CheckedQty > 0
                    ? ((item.totalDefectsQty / item.CheckedQty) * 100).toFixed(
                        2
                      )
                    : 0;

                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.inspectionDate}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.lineNo}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.MONo}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.Color}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.Size}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.CheckedQty}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.totalDefectsQty}
                    </td>
                    <td
                      className={`px-4 py-2 text-sm text-gray-600 ${getDefectRateColor(
                        rowDefectRate
                      )}`}
                    >
                      {rowDefectRate}%
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defect Name
                            </th>
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defects Qty
                            </th>
                            <th className="px-2 py-1 text-xs font-medium text-gray-600 w-1/3">
                              Defect Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.DefectArray.map((defect, defectIndex) => (
                            <tr
                              key={defectIndex}
                              className={
                                defectIndex % 2 === 0
                                  ? "bg-gray-50"
                                  : "bg-white"
                              }
                            >
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3">
                                {defect.defectName}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3 text-center">
                                {defect.defectQty}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600 w-1/3 text-center">
                                {item.CheckedQty > 0
                                  ? (
                                      (defect.defectQty / item.CheckedQty) *
                                      100
                                    ).toFixed(2)
                                  : 0}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QCSunriseDashboard;
