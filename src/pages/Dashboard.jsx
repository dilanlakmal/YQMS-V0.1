import React, { useState, useEffect } from "react";
import {
  BarChart,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCcw,
  Box,
  TrendingUp,
  Factory,
  Hash,
  Briefcase,
  Calendar,
} from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    factory: "",
    lineNo: "",
    moNo: "",
    customer: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    lineNos: [],
    moNos: [],
    customers: [],
  });
  const [headerInfo, setHeaderInfo] = useState(null);
  const [defectRateByLine, setDefectRateByLine] = useState([]);
  const [defectRateByMO, setDefectRateByMO] = useState([]);
  const [defectRateByCustomer, setDefectRateByCustomer] = useState([]);
  const [topDefects, setTopDefects] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [timeInterval, setTimeInterval] = useState("1");
  const [topN, setTopN] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const healthCheck = await fetch("http://localhost:5001/api/health");
      //   if (!healthCheck.ok) {
      //     throw new Error("Server is not responding");
      //   }

      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(
        `http://localhost:5001/api/dashboard-stats?${queryParams}`
      );
      //   if (!response.ok) {
      //     throw new Error("Failed to fetch dashboard data");
      //   }

      const data = await response.json();
      setStats(data.stats);
      setFilterOptions(data.filters);
      setHeaderInfo(data.headerInfo);
      setDefectRateByLine(data.defectRateByLine);
      setDefectRateByMO(data.defectRateByMO);
      setDefectRateByCustomer(data.defectRateByCustomer);
      setTopDefects(data.topDefects);
      setTimeSeriesData(data.timeSeriesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [filters, timeInterval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={fetchDashboardData}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Header Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{headerInfo?.date || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Factory className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Factory</p>
              <p className="font-semibold">{headerInfo?.factory || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Line No</p>
              <p className="font-semibold">{headerInfo?.lineNo || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Box className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">MO No</p>
              <p className="font-semibold">{headerInfo?.moNo || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold">{headerInfo?.customer || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <select
            value={filters.factory}
            onChange={(e) =>
              setFilters({ ...filters, factory: e.target.value })
            }
            className="border rounded p-2"
          >
            <option value="">All Factories</option>
            {filterOptions.factories.map((factory) => (
              <option key={factory} value={factory}>
                {factory}
              </option>
            ))}
          </select>
          <select
            value={filters.lineNo}
            onChange={(e) => setFilters({ ...filters, lineNo: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All Lines</option>
            {filterOptions.lineNos.map((lineNo) => (
              <option key={lineNo} value={lineNo}>
                {lineNo}
              </option>
            ))}
          </select>
          <select
            value={filters.moNo}
            onChange={(e) => setFilters({ ...filters, moNo: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All MO Numbers</option>
            {filterOptions.moNos.map((moNo) => (
              <option key={moNo} value={moNo}>
                {moNo}
              </option>
            ))}
          </select>
          <select
            value={filters.customer}
            onChange={(e) =>
              setFilters({ ...filters, customer: e.target.value })
            }
            className="border rounded p-2"
          >
            <option value="">All Customers</option>
            {filterOptions.customers.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
          <select
            value={timeInterval}
            onChange={(e) => setTimeInterval(e.target.value)}
            className="border rounded p-2"
          >
            <option value="1">1 Min Interval</option>
            <option value="15">15 Min Interval</option>
            <option value="30">30 Min Interval</option>
            <option value="60">1 Hour Interval</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Checked Quantity
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.checkedQty || 0}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Good Output</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.goodOutput || 0}
              </p>
            </div>
            <Box className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Defect Quantity
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectQty || 0}
              </p>
            </div>
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectRate || 0}%
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Pieces</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectPieces || 0}
              </p>
            </div>
            <Activity className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Return Defect Qty
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.returnDefectQty || 0}
              </p>
            </div>
            <RefreshCcw className="h-6 w-6 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Ratio</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectRatio || 0}%
              </p>
            </div>
            <BarChart className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Defect Rate by Line */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Defect Rate by Line
          </h3>
          <div className="h-64">
            {defectRateByLine.map((item) => (
              <div key={item.lineNo} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">{item.lineNo}</div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded"
                      style={{
                        width: `${Math.min(item.defectRate, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-900">
                  {item.defectRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Rate by MO */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Defect Rate by MO
          </h3>
          <div className="h-64">
            {defectRateByMO.map((item) => (
              <div key={item.moNo} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">{item.moNo}</div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 rounded"
                      style={{
                        width: `${Math.min(item.defectRate, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-900">
                  {item.defectRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Rate by Customer */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Defect Rate by Customer
          </h3>
          <div className="h-64">
            {defectRateByCustomer.map((item) => (
              <div key={item.customer} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">
                  {item.customer}
                </div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-purple-500 rounded"
                      style={{
                        width: `${Math.min(item.defectRate, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-900">
                  {item.defectRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top N Defects */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top Defects</h3>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="border rounded p-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40].map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">
                    Defect
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500">
                    Count
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {topDefects.slice(0, topN).map((defect) => (
                  <tr key={defect._id}>
                    <td className="text-sm text-gray-900">{defect._id}</td>
                    <td className="text-right text-sm text-gray-900">
                      {defect.count}
                    </td>
                    <td className="text-right text-sm text-gray-900">
                      {(
                        (defect.count / (stats?.checkedQty || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Defect Rate Over Time
        </h3>
        <div className="h-64">
          <div className="flex h-full">
            <div className="flex flex-col justify-between text-xs text-gray-500">
              {[0, 25, 50, 75, 100].map((tick) => (
                <span key={tick}>{tick}%</span>
              ))}
            </div>
            <div className="flex-1 ml-4">
              <div className="relative h-full">
                {timeSeriesData.map((point, index) => (
                  <div
                    key={point.timestamp}
                    className="absolute bottom-0 bg-indigo-500 rounded-t"
                    style={{
                      left: `${(index / (timeSeriesData.length - 1)) * 100}%`,
                      height: `${point.defectRate}%`,
                      width: "4px",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {timeSeriesData.map((point) => (
                  <span key={point.timestamp}>{point.timestamp}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
