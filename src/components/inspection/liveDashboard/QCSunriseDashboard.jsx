import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import QCSunriseFilterPane from "../qc1_sunrise_mongodb/QCSunriseFilterPane";
import QCSunriseSummaryCard from "../qc1_sunrise_mongodb/QCSunriseSummaryCard";
import QCSunriseSummaryTable from "../qc1_sunrise_mongodb/QCSunriseSummaryTable";
import SunriseLineBarChart from "../qc1_sunrise_mongodb/QCSunriseBarChart";
import SunriseTopNDefect from "../qc1_sunrise_mongodb/SunriseTopNDefect";

// --- Helper Functions for Default Dates ---
const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
const getDefaultStartDate = () => {
    const today = new Date();
    // Default to the last 7 days for the dashboard view
    today.setDate(today.getDate() - 6);
    return today.toISOString().split("T")[0];
};
// --- End Helper Functions ---

const QC1SunriseDashboard = () => {
  const [data, setData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalCheckedQty: 0,
    totalDefectsQty: 0,
    defectRate: 0,
  });
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);

  // Initialize filters with default values
  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    lineNo: '',
    MONo: '',
    Color: '',
    Size: '',
    Buyer: '',
    defectName: '',
  });

  const [topN, setTopN] = useState(5);

  // Use useCallback for fetchDashboardData to stabilize its reference if needed elsewhere
  const fetchDashboardData = useCallback(async (currentFilters) => {
    // console.log("Fetching data with filters:", currentFilters); // Debug log
    try {
      setLoading(true);
      setError(null);

      // Prepare parameters, ensuring default dates if not provided
      const paramsToSend = { ...currentFilters };
      if (!paramsToSend.startDate) {
          paramsToSend.startDate = getDefaultStartDate();
      }
      if (!paramsToSend.endDate) {
          paramsToSend.endDate = getDefaultEndDate();
      }

      // Remove any null/undefined/empty string values before sending if API prefers clean params
      Object.keys(paramsToSend).forEach(key => {
          if (paramsToSend[key] === '' || paramsToSend[key] === null || paramsToSend[key] === undefined) {
            delete paramsToSend[key];
          }
      });

      // console.log("API Request Params:", paramsToSend); // Debug log

      const response = await axios.get(`${API_BASE_URL}/api/sunrise/qc1-data`, {
        params: paramsToSend, // Use the prepared params
      });
      const fetchedData = response.data || []; // Ensure fetchedData is an array

      // console.log("API Response Data:", fetchedData); // Debug log

      const totalCheckedQty = fetchedData.reduce(
        (sum, item) => sum + (item.CheckedQty || 0), // Add || 0 for safety
        0
      );

      const totalDefectsQty = fetchedData.reduce(
        (sum, item) => sum + (item.totalDefectsQty || 0), // Add || 0 for safety
        0
      );

      const defectRate =
        totalCheckedQty > 0
          ? ((totalDefectsQty / totalCheckedQty) * 100).toFixed(2)
          : "0.00"; // Ensure string format matches calculation

      // Process and sort data
      const sortedData = fetchedData.map((item) => {
        // Ensure DefectArray exists and is an array
        const defectArray = Array.isArray(item.DefectArray) ? item.DefectArray : [];

        const sortedDefectArray = [...defectArray].sort((a, b) => {
          const rateA =
            item.CheckedQty > 0 ? ((a.defectQty || 0) / item.CheckedQty) * 100 : 0;
          const rateB =
            item.CheckedQty > 0 ? ((b.defectQty || 0) / item.CheckedQty) * 100 : 0;
          return rateB - rateA;
        });

        return {
          ...item,
          // Ensure default values for potentially missing fields used by other components
          inspectionDate: item.inspectionDate || 'N/A',
          CheckedQty: item.CheckedQty || 0,
          totalDefectsQty: item.totalDefectsQty || 0,
          DefectArray: sortedDefectArray.map((defect) => ({
            defectName: defect.defectName || 'Unknown Defect',
            defectQty: defect.defectQty || 0,
          })),
          WorkLine: item.lineNo || item.LineNo || "No Line", // Check both lineNo and LineNo
          MONo: item.MONo || 'N/A',
          ColorName: item.Color || 'N/A',
          SizeName: item.Size || 'N/A',
          Buyer: item.Buyer || 'N/A',
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
        `Failed to load dashboard data: ${error.response?.data?.message || error.message}. Please check filters or API.`
      );
      // Reset data on error
      setData([]);
      setSummaryStats({ totalCheckedQty: 0, totalDefectsQty: 0, defectRate: 0 });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for useCallback as it doesn't depend on component state/props directly

  // useEffect to fetch data on mount and when filters change
  useEffect(() => {
    fetchDashboardData(filters);
    // The dependency is 'filters'. fetchDashboardData itself is stable due to useCallback.
  }, [filters, fetchDashboardData]);

  // Handler for filter changes from the pane
  const handleFilterChange = useCallback((newFilters) => {
    // console.log("Filters updated:", newFilters); // Debug log
    setFilters(newFilters);
  }, []); // Empty dependency array, setFilters is stable

  // Note: The client-side filtering logic (`filteredData`) might be redundant
  // if the API call (`fetchDashboardData`) already fetches precisely filtered data.
  // We will use the `data` state directly which comes from the API based on `filters`.
  // If additional client-side filtering *is* needed on top of API results, uncomment and adjust the logic below.
  /*
  const filteredData = useMemo(() => data.filter((item) => {
    // Add specific client-side filtering logic here if needed
    // This example assumes API provides fully filtered data based on `filters` state
    return true;
  }), [data, filters]); // Re-filter if data or filters change
  */

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6"> {/* Added space-y-6 */}
      {/* Filter Pane: Pass initialFilters */}
      <QCSunriseFilterPane
        onFilterChange={handleFilterChange}
        initialFilters={filters} // Pass initial state down
      />

      {/* Loading and Error Display */}
      {loading && (
        <div className="text-center text-gray-600 p-4 bg-white rounded shadow">Loading dashboard data...</div>
      )}
      {error && <div className="text-center text-red-600 p-4 bg-red-100 rounded shadow border border-red-300">{error}</div>}

      {/* Summary Card: Display even if loading/error to show structure */}
      <QCSunriseSummaryCard summaryStats={summaryStats} loading={loading} />

      {/* Summary Table: Pass data directly from state */}
      <QCSunriseSummaryTable
        data={data} // Use data fetched based on filters
        loading={loading}
        error={error} // Pass error state
        filters={filters} // Pass filters if table needs them for context/display
      />

      {/* Charts: Pass data directly from state */}
      {/* Only render charts if not loading, no error, and data exists */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SunriseLineBarChart
             filteredData={data} // Use data fetched based on filters
             filters={filters}
          />
          <SunriseTopNDefect
            filteredData={data} // Use data fetched based on filters
            topN={topN}
            setTopN={setTopN}
          />
        </div>
      )}
       {/* Message when no data is found after loading */}
       {!loading && !error && data.length === 0 && (
         <div className="text-center text-gray-500 p-4 bg-white rounded shadow">
           No data found for the selected filters and date range.
         </div>
       )}
    </div>
  );
};

export default QC1SunriseDashboard;
