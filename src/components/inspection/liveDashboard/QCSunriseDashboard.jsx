import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import QCSunriseFilterPane from "../qc1_sunrise_mongodb/QCSunriseFilterPane";
import QCSunriseSummaryCard from "../qc1_sunrise_mongodb/QCSunriseSummaryCard";
import QCSunriseSummaryTable from "../qc1_sunrise_mongodb/QCSunriseSummaryTable";
import SunriseLineBarChart from "../qc1_sunrise_mongodb/QCSunriseBarChart";
import SunriseTopNDefect from "../qc1_sunrise_mongodb/SunriseTopNDefect";

const QC1SunriseDashboard = () => {
  // State for dashboard data
  const [data, setData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalCheckedQty: 0,
    totalDefectsQty: 0,
    defectRate: 0
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for filters (will be managed by QCSunriseFilterPane)
  const [filters, setFilters] = useState({});

  // State for top N defects
  const [topN, setTopN] = useState(5);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
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
        return {
          ...item,
          DefectArray: sortedDefectArray.map((defect) => ({
            defectName: defect.defectName,
            defectQty: defect.defectQty
          })),
          WorkLine: item.LineNo || "No Line",
          MONo: item.MONo,
          ColorName: item.Color,
          SizeName: item.Size,
          Buyer: item.Buyer
        };
      });

      setSummaryStats({
        totalCheckedQty,
        totalDefectsQty,
        defectRate
      });
      setData(sortedData);
    } catch (error) {
      console.error(
        "Error fetching dashboard data:",
        error.response?.data || error.message
      );
      setError(
        "Failed to load dashboard data. Please check the filters or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchDashboardData();
    }
  }, [filters]);

  // Handle filter changes from QCSunriseFilterPane
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredData = data.filter((item) => {
    let passesFilter = true;

    if (
      filters.workLine &&
      String(item.WorkLine) !== String(filters.workLine)
    ) {
      passesFilter = false;
    }

    if (filters.moNo && item.MONo !== filters.moNo) {
      passesFilter = false;
    }

    if (filters.colorName && item.ColorName !== filters.colorName) {
      passesFilter = false;
    }

    if (filters.sizeName && item.SizeName !== filters.sizeName) {
      passesFilter = false;
    }

    if (filters.buyer && item.Buyer !== filters.buyer) {
      passesFilter = false;
    }

    if (
      filters.startDate &&
      new Date(item.Date) < new Date(filters.startDate)
    ) {
      passesFilter = false;
    }

    if (filters.endDate && new Date(item.Date) > new Date(filters.endDate)) {
      passesFilter = false;
    }

    return passesFilter;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Loading and Error States */}
      {loading && (
        <div className="text-center text-gray-600 mb-4">Loading...</div>
      )}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}

      {/* Filter Panel */}
      <QCSunriseFilterPane onFilterChange={handleFilterChange} />

      {/* Summary Cards */}
      <QCSunriseSummaryCard summaryStats={summaryStats} />

      {/* Summary Table */}
      <QCSunriseSummaryTable
        data={data}
        loading={loading}
        error={error}
        filters={filters} // Pass filters to Summary Table
      />
      <div className="mt-8 grid grid-cols-2 gap-6">
        <SunriseLineBarChart filteredData={filteredData} filters={filters} />
        <SunriseTopNDefect
          filteredData={filteredData}
          topN={topN}
          setTopN={setTopN}
        />
      </div>
    </div>
  );
};

export default QC1SunriseDashboard;
