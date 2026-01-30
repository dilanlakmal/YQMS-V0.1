import React, { useMemo } from "react";
import { Target, Waves, Layers, ClipboardList, ArrowRight, CheckCircle2, ShieldAlert, Award, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      {/* Background Pattern */}
      <div className={`absolute inset-0 ${colorScheme.bg} opacity-30`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 w-12 h-12 rounded-2xl ${colorScheme.icon} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
            <Icon size={24} />
          </div>
          
          {/* Trend Indicator */}
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

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {title}
        </h3>

        {/* Value */}
        <div className="mb-4">
          <div className={`text-3xl font-black mb-1 transition-colors duration-300 ${
            isStatus 
              ? (color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")
              : "text-gray-800 dark:text-white"
          }`}>
            {value}
          </div>
          
          {/* Percentage Bar for Status Cards */}
          {isStatus && percentage !== undefined && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  color === "emerald" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {/* <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 ${colorScheme.bg} ${colorScheme.text} group-hover:scale-105`}>
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
          <span>{subtitle}</span>
        </div> */}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    </div>
  );
};

// Enhanced Quality Summary Card Component
const QualitySummaryCard = ({ passReports, failReports, trend, colorScheme }) => {
  const totalReports = passReports + failReports;
  const passRate = totalReports > 0 ? (passReports / totalReports) * 100 : 0;
  
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-900 p-6 rounded-3xl border ${colorScheme.border} shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1`}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 ${colorScheme.bg} opacity-30`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 w-12 h-12 rounded-2xl ${colorScheme.icon} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
            {failReports > 0 ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
          </div>
          
          {/* Trend Indicator */}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              trend < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Quality Summary
        </h3>

        {/* Pass/Fail Display */}
        <div className="mb-4 space-y-2">
          {/* Pass/Fail Stats in a Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Pass Section */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Pass</span>
              </div>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {passReports}
              </span>
            </div>

            {/* Fail Section */}
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

          {/* Progress Bar */}
          {/* <div className="mt-3">
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <span>Success Rate</span>
              <span>{passRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${passRate}%` }}
              ></div>
            </div>
          </div> */}
        </div>

        {/* Subtitle */}
        {/* <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 ${colorScheme.bg} ${colorScheme.text} group-hover:scale-105`}>
          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
          <span>Total: {totalReports} Reports</span>
        </div> */}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    </div>
  );
};

const CardTiles = ({ reports = [] }) => {
  const stats = useMemo(() => {
    const skuMap = new Map();
    let totalWashQty = 0;
    let passReports = 0;
    let failReports = 0;

    reports.forEach((report) => {
      // 1. Unique Planned Qty logic
      if (!skuMap.has(report.orderNo)) {
        skuMap.set(report.orderNo, report.orderQty || 0);
      }

      // 2. Resolved Wash Qty logic
      const resolvedQty = report.actualWashQty ?? report.editedActualWashQty ?? report.washQty ?? 0;
      totalWashQty += resolvedQty;

      // 3. Count Pass/Fail Reports
      if (report.overallFinalResult === "Pass") passReports++;
      else if (report.overallFinalResult === "Fail") failReports++;
    });

    const totalPlannedQty = Array.from(skuMap.values()).reduce((a, b) => a + b, 0);
    const totalReports = reports.length;
    
    // Final Status Calculation: (pass / total) * 100
    const passRatePercent = totalReports > 0 ? (passReports / totalReports) * 100 : 0;
    const completionRate = totalPlannedQty > 0 ? (totalWashQty / totalPlannedQty) * 100 : 0;

    return {
      totalPlannedQty,
      totalWashQty,
      remainingQty: Math.max(0, totalPlannedQty - totalWashQty),
      numberOfWashings: totalReports,
      completionRate,
      passReports,
      failReports,
      passRatePercent
    };
  }, [reports]);

  // Color schemes for the quality summary card
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
    <section className="max-w-[1600px] mx-auto mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {/* <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Production Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time overview of your production metrics and quality indicators
          </p> */}
        </div>
        
        {/* Summary Badge */}
        <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-800">
          <Activity size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {reports.length} Active Reports
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* 1. Production Target */}
        <KpiCard 
          title="Order QTY" 
          value={stats.totalPlannedQty.toLocaleString()} 
          icon={Target} 
          color="blue" 
          // subtitle="Total Target Quantity"
          // trend={5.2}
        />

        {/* 2. Production Progress */}
        <KpiCard 
          title="Washed QTY" 
          value={stats.totalWashQty.toLocaleString()} 
          icon={Waves} 
          color="green" 
          // subtitle={`${stats.completionRate.toFixed(1)}% Completed`}
          // trend={12.8}
        />

        {/* 3. Stock Balance */}
        <KpiCard 
          title="Remaining Balance" 
          value={stats.remainingQty.toLocaleString()} 
          icon={Layers} 
          color="orange" 
          // subtitle="Units Pending"
          // trend={-3.4}
        />

        {/* 4. Batch Count */}
        <KpiCard 
          title="Total Inspections" 
          value={stats.numberOfWashings.toLocaleString()} 
          icon={ClipboardList} 
          color="purple" 
          // subtitle="Reports Generated"
          // trend={8.1}
        />

        {/* 5. Enhanced Quality Summary */}
        <QualitySummaryCard 
          passReports={stats.passReports}
          failReports={stats.failReports}
          // trend={stats.failReports === 0 ? 2.1 : -1.5}
          colorScheme={qualityColorScheme}
        />

        {/* 6. Final Status Rate */}
        <KpiCard 
          title="Quality Rate" 
          value={`${stats.passRatePercent.toFixed(1)}%`} 
          icon={stats.passRatePercent >= 95.0 ? Award : Activity} 
          color={stats.passRatePercent >= 95.0 ? "emerald" : "rose"} 
          isStatus={true}
          // percentage={stats.passRatePercent}
          // subtitle={stats.passRatePercent >= 95.0 ? "Excellent Performance" : "Needs Improvement"}
          // trend={stats.passRatePercent >= 95.0 ? 1.2 : -2.8}
        />
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Production Efficiency</p>
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
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Quality Score</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-300">{stats.passRatePercent.toFixed(1)}%</p>
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
              <p className="text-lg font-bold text-purple-800 dark:text-purple-300">{stats.numberOfWashings}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardTiles;
