import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { 
  Waves, ClipboardList, TrendingUp, ArrowLeft, RefreshCw, 
  AlertTriangle, Ruler, Package, CheckCircle2, Target, 
  ChevronRight, ArrowRight, Layers, Percent
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const QCWashingDashboard = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [granularity, setGranularity] = useState("daily");
  const [defectLimit, setDefectLimit] = useState(5);
  const [dbData, setDbData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    buyer: null, orderNo: null, color: null, reportType: null, washType: null
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
        washType: filters.washType?.value
      };
      const res = await axios.get(`${API_BASE_URL}/api/qc-washing/dashboard`, { params });
      setDbData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, granularity, defectLimit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = dbData?.summary || {};
  const completionRate = summary.totalPlannedQty > 0 ? (summary.totalWashQty / summary.totalPlannedQty) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-gray-950 p-4 lg:p-8 font-sans transition-colors duration-300">
      {/* 1. TOP COMMAND BAR */}
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-slate-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white rounded-2xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white"><Waves size={24}/></div>
              WASHING COMMAND CENTER
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-tighter">Quality & Volume Intelligence Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-4">
             <span className="text-[10px] font-bold text-slate-400 uppercase">System Status</span>
             <span className="text-xs font-bold text-green-500 flex items-center gap-1.5">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"/> Live Operations
             </span>
          </div>
          <select 
            value={granularity} onChange={(e) => setGranularity(e.target.value)}
            className="bg-slate-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-gray-300 outline-none ring-1 ring-slate-200 dark:ring-gray-700"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button onClick={fetchData} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* 2. ADVANCED FILTERS */}
      <section className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white dark:border-gray-800 shadow-xl">
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Range</label>
          <div className="flex gap-1">
            <DatePicker selected={filters.startDate} onChange={d => setFilters(f => ({...f, startDate: d}))} className="w-full text-[11px] p-2.5 border border-slate-200 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 outline-none" />
            <DatePicker selected={filters.endDate} onChange={d => setFilters(f => ({...f, endDate: d}))} className="w-full text-[11px] p-2.5 border border-slate-200 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 outline-none" />
          </div>
        </div>
        <FilterBox label="Buyer" options={dbData?.filterOptions?.buyers} value={filters.buyer} onChange={(v) => setFilters(f => ({...f, buyer: v}))} />
        <FilterBox label="Order No" options={dbData?.filterOptions?.orders} value={filters.orderNo} onChange={(v) => setFilters(f => ({...f, orderNo: v}))} />
        <FilterBox label="Color" options={dbData?.filterOptions?.colors} value={filters.color} onChange={(v) => setFilters(f => ({...f, color: v}))} />
        <FilterBox label="Report Type" options={dbData?.filterOptions?.reportTypes} value={filters.reportType} onChange={(v) => setFilters(f => ({...f, reportType: v}))} />
        <FilterBox label="Wash Type" options={dbData?.filterOptions?.washTypes} value={filters.washType} onChange={(v) => setFilters(f => ({...f, washType: v}))} />
      </section>

      {/* 3. KPI PROGRESS TILES */}
      <section className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Planned Production" value={summary.totalPlannedQty} icon={Target} color="blue" subtitle="Total Unique Order Qty" />
        <KpiCard title="Washed Output" value={summary.totalWashQty} icon={Waves} color="green" subtitle={`${completionRate.toFixed(1)}% Completion`} />
        <KpiCard title="Remaining Balance" value={summary.remainingQty} icon={Layers} color="orange" subtitle="Pending wash operations" />
        <KpiCard title="Total Wash Batches" value={summary.numberOfWashings} icon={ClipboardList} color="purple" subtitle="Submitted QC positions" />
      </section>

      <section className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
  
  {/* Card: Pass Rate by Order No */}
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white">
        <Package size={20} className="text-blue-500" /> PASS RATE BY ORDER
      </h3>
      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-lg uppercase">Lowest 5</span>
    </div>
    <div className="space-y-4">
      {dbData?.passRateByOrder?.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-black text-slate-700 dark:text-gray-200">{item._id}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.totalBatches} Reports</p>
          </div>
          <div className={`text-lg font-black ${item.avgPassRate < 90 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {item.avgPassRate?.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Card: Pass Rate by Report Type */}
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
      <ClipboardList size={20} className="text-purple-500" /> BY REPORT TYPE
    </h3>
    <div className="grid grid-cols-2 gap-4">
      {dbData?.passRateByReportType?.map((item, idx) => (
        <div key={idx} className="p-4 border border-slate-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center mb-3">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-gray-800" />
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={175} strokeDashoffset={175 - (175 * item.avgPassRate) / 100} className={item.avgPassRate > 95 ? 'text-emerald-500' : 'text-rose-500'} strokeLinecap="round" />
            </svg>
            <span className="absolute text-xs font-black text-slate-700 dark:text-white">{Math.round(item.avgPassRate)}%</span>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">{item._id}</p>
        </div>
      ))}
    </div>
  </div>

  {/* Card: Pass Rate by Date (Recent Trends) */}
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
      <TrendingUp size={20} className="text-emerald-500" /> DAILY QUALITY
    </h3>
    <div className="space-y-3">
      {dbData?.passRateByDate?.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <div className="text-[11px] font-black text-slate-400 w-24">{item._id}</div>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${item.avgPassRate > 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${item.avgPassRate}%` }} 
            />
          </div>
          <div className="text-[11px] font-black text-slate-700 dark:text-gray-300 w-10 text-right">
            {Math.round(item.avgPassRate)}%
          </div>
        </div>
      ))}
    </div>
  </div>

</section>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 4. VOLUME TREND CHART */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white">
              <TrendingUp className="text-blue-600" /> PRODUCTION TREND
            </h3>
          </div>
          <div className="h-[400px]">
            {dbData && <Line 
              data={{
                labels: dbData.trendData.map(t => t._id),
                datasets: [{ 
                  label: 'Washed Output', 
                  data: dbData.trendData.map(t => t.washQty), 
                  borderColor: '#2563eb', 
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 6,
                  pointBackgroundColor: '#fff',
                  pointBorderWidth: 3
                }]
              }} 
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
            />}
          </div>
        </div>

        {/* 5. QUALITY YIELD CIRCLE */}
        <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Percent size={20}/> Measurement Quality </h3>
             <p className="text-blue-100 text-sm">Overall Pass Rate for selected period</p>
           </div>
           <div className="flex flex-col items-center py-8">
              <div className="text-7xl font-black mb-2">{summary.avgPassRate?.toFixed(1)}%</div>
              <div className="text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full uppercase tracking-widest">Global Accuracy</div>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                <span>TOTAL DEFECTS FOUND</span>
                <span className="text-amber-400">{summary.totalDefects?.toLocaleString()} PCS</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>INSPECTION COUNT</span>
                <span>{summary.numberOfWashings} Batches</span>
              </div>
           </div>
        </div>

        {/* 6. ADVANCED DEFECT ANALYTICS */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black flex items-center gap-2 text-rose-600 uppercase italic">
                <AlertTriangle size={24} /> Top Critical Defects
              </h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-gray-800 p-1.5 rounded-2xl ring-1 ring-slate-200 dark:ring-gray-700">
              {[5, 10].map((num) => (
                <button
                  key={num} onClick={() => setDefectLimit(num)}
                  className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${defectLimit === num ? "bg-white dark:bg-gray-700 text-rose-600 shadow-lg" : "text-slate-400"}`}
                >
                  TOP {num}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-[350px]">
              {dbData && <Bar 
                data={{
                  labels: dbData.defectSummary.map(d => d._id),
                  datasets: [{ 
                    label: 'Instances', 
                    data: dbData.defectSummary.map(d => d.totalDefectQty), 
                    backgroundColor: '#fb7185', borderRadius: 10, barThickness: 20
                  }]
                }}
                options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />}
            </div>
            <div className="overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                    <th className="pb-3 text-left">Defect Name</th>
                    <th className="pb-3 text-center">Pcs</th>
                    <th className="pb-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                  {dbData?.defectSummary.map((d, i) => (
                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 text-sm font-bold text-slate-700 dark:text-gray-300">{d._id}</td>
                      <td className="py-4 text-center"><span className="text-xs font-bold bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{d.affectedPieces}</span></td>
                      <td className="py-4 text-right text-sm font-black text-rose-600">{d.totalDefectQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 7. MEASUREMENT PRECISION TABLE */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white uppercase italic">
            <Ruler className="text-indigo-600" /> Size Precision Heatmap
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                  <th className="pb-4">Size</th>
                  <th className="pb-4 text-center">Checked</th>
                  <th className="pb-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                {dbData?.measurementSummary.map((m) => {
                  const accuracy = ((m.passPoints / m.totalPoints) * 100) || 0;
                  return (
                    <tr key={m._id} className="text-slate-700 dark:text-gray-300 group">
                      <td className="py-5 font-black group-hover:text-blue-600 transition-colors">{m._id}</td>
                      <td className="py-5 text-center font-bold text-xs">{m.pcsChecked} Pcs</td>
                      <td className="py-5">
                         <div className="flex flex-col items-end gap-1.5">
                           <div className="flex w-32 h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${accuracy > 95 ? 'bg-green-500' : accuracy > 85 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${accuracy}%` }} />
                           </div>
                           <span className="text-[10px] font-black">{accuracy.toFixed(1)}% Precision</span>
                         </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
  
      {/* Table: Style & Color Measurement Matrix */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase italic">
            <Ruler className="text-blue-600" /> Measurement Accuracy Matrix
          </h3>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Worst Performing SKUs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-4">Style / Order No</th>
                <th className="pb-4">Colorway</th>
                <th className="pb-4 text-center">Reports</th>
                <th className="pb-4 text-right">Precision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {dbData?.styleColorMeasurement?.map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 text-sm font-black text-slate-700 dark:text-gray-200">{row.style}</td>
                  <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.color}</td>
                  <td className="py-4 text-center">
                    <span className="bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-[10px] font-black">{row.reports}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-black ${row.accuracy < 90 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {row.accuracy.toFixed(1)}%
                      </span>
                      <div className="w-20 h-1 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${row.accuracy < 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${row.accuracy}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Style & Color Defect Matrix */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase italic">
            <AlertTriangle className="text-rose-600" /> Defect Severity Matrix
          </h3>
          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase tracking-widest">Highest Reject Rates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th className="pb-4">Style / Order No</th>
                <th className="pb-4">Colorway</th>
                <th className="pb-4 text-center">Total Def</th>
                <th className="pb-4 text-right">Defect Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {dbData?.styleColorDefects?.map((row, i) => (
                <tr key={i} className="group hover:bg-rose-50/10 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 text-sm font-black text-slate-700 dark:text-gray-200">{row.style}</td>
                  <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.color}</td>
                  <td className="py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 dark:text-gray-300">{row.defectQty}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">In {row.washQty} Pcs</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs ${row.defectRate > 5 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      <TrendingUp size={12} /> {row.defectRate.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
    
  );
};

// SUB-COMPONENTS
const KpiCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600 shadow-blue-100/50",
    green: "bg-green-100 text-green-600 shadow-green-100/50",
    orange: "bg-orange-100 text-orange-600 shadow-orange-100/50",
    purple: "bg-purple-100 text-purple-600 shadow-purple-100/50",
  };
  return (
    <div className="bg-white dark:bg-gray-900 p-7 rounded-[2.5rem] border border-slate-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
      <div className={`p-4 w-14 h-14 rounded-2xl ${colors[color]} mb-6 flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon size={28} />
      </div>
      <p className="text-sm font-bold text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-800 dark:text-white mb-2">{(value || 0).toLocaleString()}</p>
      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl w-fit">
        <ArrowRight size={12}/> {subtitle}
      </div>
    </div>
  );
};

const FilterBox = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <Select
      isClearable options={options?.map(o => ({ value: o, label: o }))}
      value={value} onChange={onChange}
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{ 
        control: (b) => ({ ...b, borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: 'none', padding: '3px', fontSize: '12px' }),
        menu: (b) => ({ ...b, borderRadius: '14px', zIndex: 100 })
      }}
    />
  </div>
);

export default QCWashingDashboard;