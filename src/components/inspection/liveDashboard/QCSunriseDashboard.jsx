import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import QCSunriseFilterPane from "../qc1_sunrise_mongodb/QCSunriseFilterPane";
import QCSunriseSummaryCard from "../qc1_sunrise_mongodb/QCSunriseSummaryCard";
import QCSunriseSummaryTable from "../qc1_sunrise_mongodb/QCSunriseSummaryTable";
import SunriseLineBarChart from "../qc1_sunrise_mongodb/QCSunriseBarChart";
import SunriseTopNDefect from "../qc1_sunrise_mongodb/SunriseTopNDefect";

const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 6);
  return today.toISOString().split("T")[0];
};

const QC1SunriseDashboard = () => {
  const [data, setData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalCheckedQty: 0,
    totalDefectsQty: 0,
    defectRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    lineNo: "",
    MONo: "",
    Color: "",
    Size: "",
    Buyer: "",
    defectName: "",
  });

  const [topN, setTopN] = useState(5);

  const fetchDashboardData = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const paramsToSend = { ...currentFilters };
      if (!paramsToSend.startDate) {
        paramsToSend.startDate = getDefaultStartDate();
      }
      if (!paramsToSend.endDate) {
        paramsToSend.endDate = getDefaultEndDate();
      }

      Object.keys(paramsToSend).forEach((key) => {
        if (
          paramsToSend[key] === "" ||
          paramsToSend[key] === null ||
          paramsToSend[key] === undefined
        ) {
          delete paramsToSend[key];
        }
      });

      const response = await axios.get(`${API_BASE_URL}/api/sunrise/qc1-data`, {
        params: paramsToSend,
      });
      const fetchedData = response.data || [];

      const totalCheckedQty = fetchedData.reduce(
        (sum, item) => sum + (item.CheckedQty || 0),
        0
      );

      const totalDefectsQty = fetchedData.reduce(
        (sum, item) => sum + (item.totalDefectsQty || 0),
        0
      );

      const defectRate =
        totalCheckedQty > 0
          ? ((totalDefectsQty / totalCheckedQty) * 100).toFixed(2)
          : "0.00";

      const sortedData = fetchedData.map((item) => {
        const defectArray = Array.isArray(item.DefectArray)
          ? item.DefectArray
          : [];

        const sortedDefectArray = [...defectArray].sort((a, b) => {
          const rateA =
            item.CheckedQty > 0
              ? ((a.defectQty || 0) / item.CheckedQty) * 100
              : 0;
          const rateB =
            item.CheckedQty > 0
              ? ((b.defectQty || 0) / item.CheckedQty) * 100
              : 0;
          return rateB - rateA;
        });

        return {
          ...item,
          inspectionDate: item.inspectionDate || "N/A",
          CheckedQty: item.CheckedQty || 0,
          totalDefectsQty: item.totalDefectsQty || 0,
          DefectArray: sortedDefectArray.map((defect) => ({
            defectName: defect.defectName || "Unknown Defect",
            defectQty: defect.defectQty || 0,
          })),
          WorkLine: item.lineNo || item.LineNo || "No Line",
          MONo: item.MONo || "N/A",
          ColorName: item.Color || "N/A",
          SizeName: item.Size || "N/A",
          Buyer: item.Buyer || "N/A",
        };
      });

      setSummaryStats({
        totalCheckedQty,
        totalDefectsQty,
        defectRate,
      });

      setData(sortedData);
    } catch (error) {
      console.error(
        "Error fetching dashboard data:",
        error.response?.data || error.message
      );
      setError(
        `Failed to load dashboard data: ${
          error.response?.data?.message || error.message
        }. Please check filters or API.`
      );
      setData([]);
      setSummaryStats({ totalCheckedQty: 0, totalDefectsQty: 0, defectRate: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(filters);
  }, [filters, fetchDashboardData]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

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
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <QCSunriseFilterPane
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {loading && (
        <div className="text-center text-gray-600 p-4 bg-white rounded shadow">
          Loading dashboard data...
        </div>
      )}
      {error && (
        <div className="text-center text-red-600 p-4 bg-red-100 rounded shadow border border-red-300">
          {error}
        </div>
      )}

      <QCSunriseSummaryCard summaryStats={summaryStats} loading={loading} />

      <QCSunriseSummaryTable
        data={data}
        loading={loading}
        error={error}
        filters={filters}
      />

      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SunriseLineBarChart filteredData={data} filters={filters} />
          <SunriseTopNDefect
            filteredData={data}
            topN={topN}
            setTopN={setTopN}
          />
        </div>
      )}
      {!loading && !error && data.length === 0 && (
        <div className="text-center text-gray-500 p-4 bg-white rounded shadow">
          No data found for the selected filters and date range.
        </div>
      )}
    </div>
  );
};

export default QC1SunriseDashboard;
