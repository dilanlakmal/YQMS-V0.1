import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Waves, ArrowLeft, RefreshCw, WashingMachine } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import sub-components
import DashboardFilters from "./DashboardFilters";
import CardTiles from "./CardTiles";
import QualityInsights from "./QuntityInsights";
import ProductionCharts from "./ProductionCharts";
import AnalyticsTables from "./AnalyticsTables";
import QualityMatrices from "./QualityMetrics"; 
import SizeMeasurementTable from "./SizeMeasurementTable";
import FactoryDefectTable from "./FactoryDefectTable";

const QCWashingDashboard = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [granularity, setGranularity] = useState("daily");
  const [defectLimit, setDefectLimit] = useState(5);
  const [dbData, setDbData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    buyer: null, 
    orderNo: null, 
    color: null, 
    reportType: null, 
    washType: null,
    factoryName: null
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters, 
        granularity, 
        defectLimit,
        buyer: filters.buyer?.value, 
        orderNo: filters.orderNo?.value,
        color: filters.color?.value, 
        reportType: filters.reportType?.value,
        washType: filters.washType?.value,
        factoryName: filters.factoryName?.value 
      };
      const res = await axios.get(`${API_BASE_URL}/api/qc-washing/dashboard`, { params });
      setDbData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, granularity, defectLimit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-gray-950 p-4 lg:p-8 font-sans transition-colors duration-300">
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-6">
          {/* <button onClick={onBack} className="p-3 bg-slate-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white rounded-2xl transition-all"><ArrowLeft size={20} /></button> */}
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white"><WashingMachine size={24}/></div>
              WASHING DASHBOARD
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select value={granularity} onChange={(e) => setGranularity(e.target.value)} className="bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm font-bold ring-1 ring-slate-200">
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
          <button onClick={fetchData} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="relative z-50">
        <DashboardFilters 
          filters={filters} 
          setFilters={setFilters} 
          filterOptions={dbData?.filterOptions} 
        />
      </div>

      {/* Main Content - Lower z-index */}
      <div className="relative z-10">
        <CardTiles reports={dbData?.reports || []} />

        <FactoryDefectTable data={dbData?.factoryDefectSummary || []} />
        
        <QualityInsights dbData={dbData} />
        
        <ProductionCharts dbData={dbData} summary={dbData?.summary || {}} />
        
        <AnalyticsTables dbData={dbData} defectLimit={defectLimit} setDefectLimit={setDefectLimit} />
        
        <SizeMeasurementTable data={dbData?.skuSizeMeasurementSummary || []} />
        
        <QualityMatrices dbData={dbData} />
      </div>
    </div>
  );
};

export default QCWashingDashboard;