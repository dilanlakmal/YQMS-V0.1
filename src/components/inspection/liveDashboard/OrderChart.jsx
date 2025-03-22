import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { API_BASE_URL } from "../../../../config";

// Register ChartJS components and plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const OrderChart = ({ filters }) => {
  const [moData, setMoData] = useState({ labels: [], data: [] });
  const [empData, setEmpData] = useState({ labels: [], data: [] });
  const [buyerData, setBuyerData] = useState({ labels: [], data: [] });
  const [buyerTableData, setBuyerTableData] = useState([]);
  const [chartDataReady, setChartDataReady] = useState(false);
  const chartRefs = useRef({ mo: null, emp: null, buyer: null });

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qc2-orderdata-summary`,
        {
          params: { ...filters, page: 1, limit: 1000 } // Increase limit for charts
        }
      );
      const tableData = response.data.tableData;

      // MO Chart Data (Total Bundle Qty by MO)
      const moMap = {};
      tableData.forEach((item) => {
        if (moMap[item.moNo]) {
          moMap[item.moNo] += item.totalRegisteredBundleQty || 0;
        } else {
          moMap[item.moNo] = item.totalRegisteredBundleQty || 0;
        }
      });
      const sortedMo = Object.entries(moMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      setMoData({
        labels: sortedMo.map(([mo]) => mo),
        data: sortedMo.map(([, qty]) => qty)
      });

      // Emp ID Chart Data (Total Bundle Qty by Emp ID)
      const empMap = {};
      tableData.forEach((item) => {
        const empId = item.empId || "Unknown"; // Use empId from updated endpoint
        if (empMap[empId]) {
          empMap[empId] += item.totalRegisteredBundleQty || 0;
        } else {
          empMap[empId] = item.totalRegisteredBundleQty || 0;
        }
      });
      const sortedEmp = Object.entries(empMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      setEmpData({
        labels: sortedEmp.map(([emp]) => emp),
        data: sortedEmp.map(([, qty]) => qty)
      });

      // Buyer Chart Data (Total Bundle Qty) and Table (Total Order Qty by Unique MO)
      const buyerBundleMap = {};
      const buyerOrderMap = {};
      const moToBuyerMap = new Map(); // Track unique MO No to Buyer mapping
      tableData.forEach((item) => {
        // Bundle Qty for Chart
        if (buyerBundleMap[item.buyer]) {
          buyerBundleMap[item.buyer] += item.totalRegisteredBundleQty || 0;
        } else {
          buyerBundleMap[item.buyer] = item.totalRegisteredBundleQty || 0;
        }
        // Order Qty for Table (sum orderQty of unique MOs)
        if (!moToBuyerMap.has(item.moNo)) {
          moToBuyerMap.set(item.moNo, item.buyer);
          if (buyerOrderMap[item.buyer]) {
            buyerOrderMap[item.buyer] += item.orderQty || 0;
          } else {
            buyerOrderMap[item.buyer] = item.orderQty || 0;
          }
        }
      });
      const sortedBuyerBundles = Object.entries(buyerBundleMap).sort(
        ([, a], [, b]) => b - a
      );
      const sortedBuyerOrders = Object.entries(buyerOrderMap).sort(
        ([, a], [, b]) => b - a
      );
      setBuyerData({
        labels: sortedBuyerBundles.map(([buyer]) => buyer),
        data: sortedBuyerBundles.map(([, qty]) => qty)
      });
      setBuyerTableData(sortedBuyerOrders);

      setChartDataReady(true);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  // Chart Options (No Horizontal Grid Lines)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, font: { size: 18 }, padding: 20 },
      datalabels: {
        anchor: "end",
        align: "top",
        color: "#030000",
        font: { weight: "bold", size: 12 },
        formatter: (value) => value.toLocaleString()
      }
    },
    scales: {
      x: { ticks: { font: { size: 12 } } },
      y: {
        beginAtZero: true,
        grid: { display: false }, // Remove horizontal grid lines
        ticks: {
          font: { size: 12 },
          callback: (value) => value.toLocaleString()
        }
      }
    }
  };

  // Gradient Fill Function
  const createGradient = (ctx, chartArea) => {
    if (!chartArea) return "#3b82f6";
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.bottom,
      0,
      chartArea.top
    );
    gradient.addColorStop(0, "#3b82f6"); // Blue
    gradient.addColorStop(1, "#9333ea"); // Purple
    return gradient;
  };

  // Chart Data Configurations
  const getChartData = (labels, data, chartRef) => ({
    labels,
    datasets: [
      {
        label: "Total Bundle Qty",
        data,
        backgroundColor: (context) => {
          const chart = chartRef && chartRef.current;
          if (!chart) return "#3b82f6";
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea);
        },
        borderWidth: 0,
        barThickness: 40
      }
    ]
  });

  const moChartData = chartDataReady
    ? getChartData(moData.labels, moData.data, chartRefs.current.mo)
    : { labels: [], datasets: [] };
  const empChartData = chartDataReady
    ? getChartData(empData.labels, empData.data, chartRefs.current.emp)
    : { labels: [], datasets: [] };
  const buyerChartData = chartDataReady
    ? getChartData(buyerData.labels, buyerData.data, chartRefs.current.buyer)
    : { labels: [], datasets: [] };

  return (
    <div className="space-y-8">
      {/* Chart 1: No of Orders by MO */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          No of Orders by MO
        </h2>
        <div className="h-96">
          <Bar
            ref={(ref) => (chartRefs.current.mo = ref)}
            data={moChartData}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: { text: "Top 10 MOs by Bundle Qty" }
              }
            }}
          />
        </div>
      </div>

      {/* Chart 2: No of Orders Registered by Emp ID */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          No of Orders Registered by Emp ID
        </h2>
        <div className="h-96">
          <Bar
            ref={(ref) => (chartRefs.current.emp = ref)}
            data={empChartData}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: { text: "Top 10 Emp IDs by Bundle Qty" }
              }
            }}
          />
        </div>
      </div>

      {/* Chart 3: No of Orders by Buyer with Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          No of Orders by Buyer
        </h2>
        <div className="flex space-x-6">
          {/* Table */}
          <div className="w-1/3">
            <table className="min-w-full bg-gray-50 rounded-lg">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Buyer
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Total Order Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {buyerTableData.map(([buyer, qty], index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="px-4 py-2 text-sm text-gray-700">{buyer}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 font-medium">
                      {qty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Chart */}
          <div className="w-2/3 h-96">
            <Bar
              ref={(ref) => (chartRefs.current.buyer = ref)}
              data={buyerChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { text: "Orders by Buyer (Bundle Qty)" }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderChart;
