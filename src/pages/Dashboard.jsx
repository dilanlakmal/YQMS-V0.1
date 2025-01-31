import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// LineChart Component
const LineChart = ({ timeSeriesData, maxDefectRate }) => {
  const [interval, setInterval] = useState('1min');
  const [filteredData, setFilteredData] = useState(timeSeriesData);

  useEffect(() => {
    filterData(interval);
  }, [interval, timeSeriesData]);

  const filterData = (interval) => {
    const now = new Date();
    let filtered;
    switch (interval) {
      case '1min':
        filtered = timeSeriesData.filter(point => (now - new Date(point.timestamp)) <= 60000);
        break;
      case '10min':
        filtered = timeSeriesData.filter(point => (now - new Date(point.timestamp)) <= 600000);
        break;
      case '15min':
        filtered = timeSeriesData.filter(point => (now - new Date(point.timestamp)) <= 900000);
        break;
      case '30min':
        filtered = timeSeriesData.filter(point => (now - new Date(point.timestamp)) <= 1800000);
        break;
      case '1hour':
        filtered = timeSeriesData.filter(point => (now - new Date(point.timestamp)) <= 3600000);
        break;
      default:
        filtered = timeSeriesData;
    }
    setFilteredData(filtered);
  };

  return (
    <div className="bg-white overflow-hidden">
      <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Defect Rate Over Time</h3>
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="px-4 py-2 rounded-md transition-colors bg-white-200 text-black-700 hover:bg-gray-100 border rounded p-2"
        >
          {['1min', '10min', '15min', '30min', '1hour'].map((int) => (
            <option key={int} value={int}>
              {int}
            </option>
          ))}
        </select>
      </div>
      <div className="h-64">
        <div className="flex h-full">
          <div className="flex flex-col justify-between text-xs text-gray-500">
            {[100, 75, 50, 25, 0].map((tick) => (
              <span key={tick}>{tick}%</span>
            ))}
          </div>
          <div className="flex-1 ml-4">
            <div className="relative h-full">
              <svg className="absolute inset-0 w-full h-full">
                {filteredData.map((point, index) => {
                  if (index === 0) return null;
                  const prevPoint = filteredData[index - 1];
                  const x1 = ((index - 1) / (filteredData.length - 1)) * 100;
                  const y1 = 100 - (prevPoint.defectRate / maxDefectRate) * 100;
                  const x2 = (index / (filteredData.length - 1)) * 100;
                  const y2 = 100 - (point.defectRate / maxDefectRate) * 100;
                  return (
                    <line
                      key={`${prevPoint.timestamp}-${point.timestamp}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="rgb(79, 70, 229)"
                      strokeWidth="2"
                    />
                  );
                })}
                {filteredData.map((point, index) => {
                  const x = (index / (filteredData.length - 1)) * 100;
                  const y = 100 - (point.defectRate / maxDefectRate) * 100;
                  return (
                    <circle
                      key={point.timestamp}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="2"
                      fill="rgb(79, 70, 229)"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {filteredData.map((point) => (
                <span key={point.timestamp}>
                  {new Date(point.timestamp).toLocaleTimeString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LineChart.propTypes = {
  timeSeriesData: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      defectRate: PropTypes.number.isRequired,
    })
  ).isRequired,
  maxDefectRate: PropTypes.number.isRequired,
};

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
      // Don't set loading to true on refresh to prevent flicker
      if (!stats) {
        setLoading(true);
      }

      const healthCheck = await fetch("http://localhost:5001/api/health");
      if (!healthCheck.ok) {
        throw new Error("Server health check failed");
      }

      const queryParams = new URLSearchParams({
        ...filters,
        timeInterval,
      }).toString();

      const response = await fetch(
        `http://localhost:5001/api/dashboard-stats?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      // Update states only if data has changed
      if (
        JSON.stringify(data) !==
        JSON.stringify({
          stats,
          filterOptions,
          headerInfo,
          defectRateByLine,
          defectRateByMO,
          defectRateByCustomer,
          topDefects,
          timeSeriesData,
        })
      ) {
        setStats(data.stats || null);
        setFilterOptions(
          data.filters || {
            factories: [],
            lineNos: [],
            moNos: [],
            customers: [],
          }
        );
        setHeaderInfo(data.headerInfo || null);
        setDefectRateByLine(data.defectRateByLine || []);
        setDefectRateByMO(data.defectRateByMO || []);
        setDefectRateByCustomer(data.defectRateByCustomer || []);
        setTopDefects(data.topDefects || []);
        setTimeSeriesData(data.timeSeriesData || []);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const maxDefectRate = Math.max(...timeSeriesData.map(point => point.defectRate));

  useEffect(() => {
    fetchDashboardData();
    // Increase refresh interval to reduce flickering
    const interval = setInterval(fetchDashboardData, 12000); // Changed to 12 seconds
    return () => clearInterval(interval);
  }, [filters, timeInterval]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = timeSeriesData[context.dataIndex];
            if (!point) return [];
            return [
              `Defect Rate: ${point.defectRate.toFixed(2)}%`,
              `Cumulative Checked: ${point.checkedQty}`,
              `Cumulative Defects: ${point.defectQty}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Defect Rate (%)",
          font: {
            weight: "bold",
          },
        },
        ticks: {
          callback: (value) => `${value.toFixed(2)}%`,
          font: {
            weight: "bold",
          },
        },
      },
      x: {
        title: {
          display: true,
          text:
            parseInt(timeInterval) === 60 ? "Time (Hours)" : "Time (Minutes)",
          font: {
            weight: "bold",
          },
        },
        grid: {
          display: true,
        },
        ticks: {
          font: {
            weight: "bold",
          },
        },
      },
    },
    elements: {
      point: {
        radius: 6,
        backgroundColor: "red",
        borderColor: "red",
        hoverRadius: 8,
        hoverBorderWidth: 2,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
        fill: true,
      },
    },
  };

  const chartData = {
    labels: timeSeriesData.map((point) => {
      const interval = parseInt(timeInterval);
      if (interval === 60) {
        return `${point.timestamp}h`;
      } else {
        return `${point.timestamp}m`;
      }
    }),
    datasets: [
      {
        label: "Defect Rate (%)",
        data: timeSeriesData.map((point) => point.defectRate),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "red",
        pointBorderColor: "red",
        pointHoverRadius: 8,
      },
    ],
  };

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
    // Function to format the date
    const formatDate = (date) => {
      if (!date) return "N/A";
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    };
  

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Header Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{formatDate(headerInfo?.date)}</p>
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
        <div className="grid grid-cols-4 gap-4">
          <select
            value={filters.factory}
            onChange={(e) => setFilters({ ...filters, factory: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All Factories</option>
            {filterOptions.factories.map((factory) => (
              <option key={factory} value={factory}>{factory}</option>
            ))}
          </select>
          <select
            value={filters.lineNo}
            onChange={(e) => setFilters({ ...filters, lineNo: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All Lines</option>
            {filterOptions.lineNos.map((lineNo) => (
              <option key={lineNo} value={lineNo}>{lineNo}</option>
            ))}
          </select>
          <select
            value={filters.moNo}
            onChange={(e) => setFilters({ ...filters, moNo: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All MO Numbers</option>
            {filterOptions.moNos.map((moNo) => (
              <option key={moNo} value={moNo}>{moNo}</option>
            ))}
          </select>
          <select
            value={filters.customer}
            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
            className="border rounded p-2"
          >
            <option value="">All Customers</option>
            {filterOptions.customers.map((customer) => (
              <option key={customer} value={customer}>{customer}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4 mb-6 xl:flex-nowrap xl:overflow-x-auto xl:pb-2">
        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Checked Garments
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.checkedQty || 0}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Good Garments</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.goodOutput || 0}
              </p>
            </div>
            <Box className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Qty</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectQty || 0}
              </p>
            </div>
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Rate</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.defectRate || 0}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Defect Garments
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {stats?.defectPieces || 0}
              </p>
            </div>
            <Activity className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Return Defect Qty</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.returnDefectQty || 0}</p>
            </div>
            <RefreshCcw className="h-6 w-6 text-orange-500" />
          </div>
        </div>

        <div className="min-w-[220px] flex-1 xl:flex-none bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Ratio</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.defectRatio || 0}%</p>
            </div>
            <BarChart className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Defect Rate by Line */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Rate by Line</h3>
          <div className="h-64">
            {defectRateByLine.map((item) => (
              <div key={item.lineNo} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">{item.lineNo}</div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded"
                      style={{ width: `${Math.min(item.defectRate, 100)}%` }}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Rate by MO</h3>
          <div className="h-64">
            {defectRateByMO.map((item) => (
              <div key={item.moNo} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">{item.moNo}</div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 rounded"
                      style={{ width: `${Math.min(item.defectRate, 100)}%` }}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Rate by Customer</h3>
          <div className="h-64">
            {defectRateByCustomer.map((item) => (
              <div key={item.customer} className="flex items-center mb-2">
                <div className="w-20 text-sm text-gray-600">{item.customer}</div>
                <div className="flex-1">
                  <div className="relative h-6 bg-gray-200 rounded">
                    <div
                      className="absolute top-0 left-0 h-full bg-purple-500 rounded"
                      style={{ width: `${Math.min(item.defectRate, 100)}%` }}
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
              {[5, 10, 15, 20, 30, 40, 50].map((n) => (
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
                  <th className="text-left text-sm font-bold text-gray-700 sticky top-0 bg-white">
                    Defect
                  </th>
                  <th className="text-right text-sm font-bold text-gray-700 sticky top-0 bg-white">
                    Count
                  </th>
                  <th className="text-right text-sm font-bold text-gray-700 sticky top-0 bg-white">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {topDefects.slice(0, topN).map((defect) => (
                  <tr key={defect._id} className="hover:bg-gray-50">
                    <td className="text-sm font-medium text-gray-900 py-2">
                      {defect._id}
                    </td>
                    <td className="text-right text-sm font-bold text-gray-900 py-2">
                      {defect.count}
                    </td>
                    <td className="text-right text-sm font-bold text-gray-900 py-2">
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Defect Rate Over Time
          </h3>
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
        <div className="h-[400px] transition-all duration-300 ease-in-out">
          {timeSeriesData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No time series data available
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

export default Dashboard;