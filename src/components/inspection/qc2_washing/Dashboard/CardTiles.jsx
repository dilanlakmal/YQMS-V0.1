import React, { useMemo } from "react";
import { Target, Waves, Layers, ClipboardList, CheckCircle2, ShieldAlert, Award, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

// 1. Updated KpiCard to display the subtitle
const KpiCard = ({ title, value, icon: Icon, color, subtitle, isStatus = false, trend, percentage }) => {
  const colors = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      icon: "bg-blue-500 text-white shadow-blue-500/25",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800"
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      icon: "bg-green-500 text-white shadow-green-500/25",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800"
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      icon: "bg-orange-500 text-white shadow-orange-500/25",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      icon: "bg-purple-500 text-white shadow-purple-500/25",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800"
    },
    rose: {
      bg: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20",
      icon: "bg-rose-500 text-white shadow-rose-500/25",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-200 dark:border-rose-800"
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
      icon: "bg-emerald-500 text-white shadow-emerald-500/25",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800"
    }
  };

  const colorScheme = colors[color];
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp size={12} className="text-green-500" />;
    if (trend < 0) return <TrendingDown size={12} className="text-red-500" />;
    return <Minus size={12} className="text-gray-400" />;
  };

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-900 p-6 rounded-3xl border ${colorScheme.border} shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1`}>
      <div className={`absolute inset-0 ${colorScheme.bg} opacity-30`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 w-12 h-12 rounded-2xl ${colorScheme.icon} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
            <Icon size={24} />
          </div>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              trend < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {getTrendIcon()}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {title}
        </h3>

        <div className="mb-2">
          <div className={`text-3xl font-black mb-1 transition-colors duration-300 ${
            isStatus 
              ? (color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")
              : "text-gray-800 dark:text-white"
          }`}>
            {value}
          </div>
          
          {/* Renders the Defect Rate or other subtitle info */}
          {subtitle && (
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1">
               {subtitle}
            </div>
          )}
          
          {isStatus && percentage !== undefined && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  color === "emerald" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    </div>
  );
};
const DefectSummaryCard = ({ totalPcs = 0, defectRatio = 0, totalCount = 0, defectRate = 0 }) => {

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-900 p-5 rounded-3xl border border-rose-200 dark:border-rose-800 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 opacity-30"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg group-hover:rotate-3 transition-transform">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Defect Analysis</h3>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Column 1: Pieces & Ratio */}
          <div className="space-y-2">
            <div className="bg-rose-50/50 dark:bg-rose-900/10 p-2.5 rounded-2xl border border-rose-100 dark:border-rose-800/50">
              <span className="block text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase mb-0.5">Defect Pcs</span>
              <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
               {(totalPcs || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-orange-50/50 dark:bg-orange-900/10 p-2.5 rounded-2xl border border-orange-100 dark:border-orange-800/50">
              <span className="block text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase mb-0.5">Ratio %</span>
              <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
                {(defectRatio ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Column 2: Count & Rate */}
          <div className="space-y-2">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <span className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase mb-0.5">Defect Count</span>
              <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
                {(totalCount ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <span className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-0.5">Rate %</span>
              <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
               {(defectRate ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ... QualitySummaryCard remains the same ...
const QualitySummaryCard = ({ passReports, failReports, trend, colorScheme }) => {
    return (
      <div className={`relative overflow-hidden bg-white dark:bg-gray-900 p-6 rounded-3xl border ${colorScheme.border} shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1`}>
        <div className={`absolute inset-0 ${colorScheme.bg} opacity-30`}></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 w-12 h-12 rounded-2xl ${colorScheme.icon} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
              {failReports > 0 ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
            </div>
          </div>
  
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Quality Summary
          </h3>
  
          <div className="mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Pass</span>
                </div>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {passReports}
                </span>
              </div>
  
              <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Fail</span>
                </div>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {failReports}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

const CardTiles = ({ reports = [] }) => {
  const stats = useMemo(() => {
    const skuMap = new Map();
    let totalPcs = 0;
    let totalCount = 0;
    let totalWashQty = 0;
    let passReports = 0;
    let failReports = 0;
    // let totalDefects = 0;
    let totalRejectedDefects = 0;
    let totalSampleSize = 0;

    reports.forEach((report) => {

      if (report.defectDetails?.defectsByPc) {
        report.defectDetails.defectsByPc.forEach(pc => {
          pc.pcDefects?.forEach(defect => {
            // Pieces (Garments)
            totalPcs += defect.isMulti ? (Number(defect.pcCount) || 0) : 1;
            // Count (Occurrences)
            totalCount += defect.isMulti ? (Number(defect.pcCount) || 0) : (Number(defect.defectQty) || 0);
          });
        });
      }

      if (report.actualAQLValue?.length > 0) {
        totalSampleSize += report.actualAQLValue.reduce((s, i) => s + (Number(i.sampleSize) || 0), 0);
      } else {
        totalSampleSize += (Number(report.checkedQty) || 0);
      }

      if (!skuMap.has(report.orderNo)) {
        skuMap.set(report.orderNo, report.orderQty || 0);
      }

      const resolvedQty = report.actualWashQty ?? report.editedActualWashQty ?? report.washQty ?? 0;
      totalWashQty += resolvedQty;
      // totalDefects += (report.totalDefectCount || 0);
      totalRejectedDefects += (report.rejectedDefectPcs || 0);

       if (report.actualAQLValue && Array.isArray(report.actualAQLValue) && report.actualAQLValue.length > 0) {
        const aqlSum = report.actualAQLValue.reduce((sum, item) => sum + (item.sampleSize || 0), 0);
        totalSampleSize += aqlSum;
      } else {
        totalSampleSize += (report.checkedQty || 0);
      }

      if (report.overallFinalResult === "Pass") passReports++;
      else if (report.overallFinalResult === "Fail") failReports++;
    });

    const totalPlannedQty = Array.from(skuMap.values()).reduce((a, b) => a + b, 0);
    const totalReports = reports.length;
    
    const failRatePercent = totalReports > 0 ? (failReports / totalReports) * 100 : 0;
    const passRatePercent = totalReports > 0 ? (passReports / totalReports) * 100 : 0;
    const completionRate = totalPlannedQty > 0 ? (totalWashQty / totalPlannedQty) * 100 : 0;
    
    // 2. NEW CALCULATION: Defect Rate based on total washed pieces
    const defectRate = totalSampleSize > 0 ? (totalCount / totalSampleSize) * 100 : 0;
     const defectRatio = totalSampleSize > 0 ? (totalRejectedDefects / totalSampleSize) * 100 : 0;

    return {
      totalPlannedQty,
      totalWashQty,
      remainingQty: Math.max(0, totalPlannedQty - totalWashQty),
      numberOfWashings: totalReports,
      completionRate,
      passReports,
      failReports,
      passRatePercent,
      failRatePercent,
      totalDefects: totalPcs,
      totalSampleSize,
      totalDefectPcs: totalPcs,
      totalDefectCount: totalCount,
      // totalDefects,
      defectRatio,
      defectRate,
      // defectRatio: totalSampleSize > 0 ? (totalPcs / totalSampleSize) * 100 : 0
    };
  }, [reports]);

  const qualityColorScheme = stats.failReports > 0 ? {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20",
    icon: "bg-rose-500 text-white shadow-rose-500/25",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800"
  } : {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
    icon: "bg-emerald-500 text-white shadow-emerald-500/25",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800"
  };

  return (
    <section className="max-w-8xl mx-auto mb-12">
      <div className="flex items-center justify-between mb-8">
        <div></div>
        <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-800">
          <Activity size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {reports.length} Active Reports
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-6">
        <KpiCard 
          title="Order QTY" 
          value={stats.totalPlannedQty.toLocaleString()} 
          icon={Target} 
          color="blue" 
        />

        <KpiCard 
          title="Washed QTY" 
          value={stats.totalWashQty.toLocaleString()} 
          icon={Waves} 
          color="green" 
        />

        <KpiCard 
          title="Remaining Balance" 
          value={stats.remainingQty.toLocaleString()} 
          icon={Layers} 
          color="orange" 
        />

        <KpiCard 
          title="Sample Size" 
          value={stats.totalSampleSize.toLocaleString()} 
          icon={ClipboardList} 
          color="purple" 
        />

        <KpiCard 
          title="Total Inspections" 
          value={stats.numberOfWashings.toLocaleString()} 
          icon={ClipboardList} 
          color="purple" 
        />

        {/* 3. UPDATED CARD: Total Defects with Defect Rate subtitle */}
        {/* <KpiCard 
          title="Total Defects" 
          value={stats.totalDefects.toLocaleString()} 
          subtitle={`${stats.defectRate.toFixed(2)}% Defect Rate`}
          icon={AlertTriangle} 
          color="rose" 
        /> */}
         <DefectSummaryCard 
          totalPcs={stats.totalDefectPcs}
          defectRatio={stats.defectRatio}
          totalCount={stats.totalDefectCount}
          defectRate={stats.defectRate}
        />

        <QualitySummaryCard 
          passReports={stats.passReports}
          failReports={stats.failReports}
          colorScheme={qualityColorScheme}
        />

        <KpiCard 
          title="Final Fail Rate" 
          value={`${stats.failRatePercent.toFixed(1)}%`} 
          icon={stats.failRatePercent <= 5.0 ? Award : ShieldAlert}
          color={stats.failRatePercent <= 5.0 ? "emerald" : "rose"}
          isStatus={true}
          percentage={stats.failRatePercent}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... Footer Summary Cards ... */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Completed Wash Rate</p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{stats.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Overall Pass Rate</p>
              <p className="text-lg font-bold text-green-800 dark:text-blue-300">{stats.passRatePercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Active Reports</p>
              <p className="text-lg font-bold text-purple-800 dark:text-blue-300">{stats.numberOfWashings}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardTiles;