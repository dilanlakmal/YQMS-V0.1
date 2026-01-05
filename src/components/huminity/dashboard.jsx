import React, { useEffect, useState, useMemo, useRef } from 'react';
import { API_BASE_URL } from '../../../config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Enhanced KPI card with gradient and icons
const KpiCard = ({ title, value, subtitle, icon, gradient, trend, percent, cornerIcon, cornerBg }) => {
  const graphUp = (trend !== null && trend !== undefined)
    ? (Number(trend) > 0)
    : (percent !== null && percent !== undefined ? Number(percent) >= 50 : true);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg ${gradient} text-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
      <div className="absolute top-0 right-0 opacity-10">
        <div className="w-32 h-32 transform translate-x-8 -translate-y-8">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium opacity-90">{title}</div>
          {trend !== null && trend !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-white/20' : 'bg-white/10'}`}>
              <svg className={`w-3 h-3 ${trend > 0 ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="text-4xl font-bold mb-1">{value}</div>
        {subtitle && <div className="text-xs opacity-80">{subtitle}</div>}
      </div>
      {cornerIcon && (
        <div className="absolute top-0 right-0 z-0 pointer-events-none">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${cornerBg || 'bg-white/10'} opacity-20 transform translate-x-6 -translate-y-6`}>
            <div className="w-6 h-6 opacity-60 stroke-current">
              {cornerIcon}
            </div>
          </div>
        </div>
      )}
      {percent !== null && percent !== undefined && (
        <div className="absolute top-4 right-6 z-20">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${percent >= 50 ? '' : ''} shadow-sm`}>
            <div className="flex items-center gap-1">
              <svg className={`w-3 h-3 transform ${graphUp ? 'rotate-0' : 'rotate-180'} ${percent >= 50 ? 'text-gray-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3 17 8 12 12 16 21 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <polyline points="17 7 21 7 21 11" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span className={`${percent >= 50 ? 'text-gray-600' : 'text-gray-600'} text-xs font-semibold`}>{percent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats card for smaller metrics
const StatsCard = ({ label, value, icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`${colors[color]} border-2 rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md`}>
      <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-xs opacity-75 font-medium">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bodyCountsByCustomer, setBodyCountsByCustomer] = useState({});
  const [ribsCountsByCustomer, setRibsCountsByCustomer] = useState({});
  const [totalRibsPass, setTotalRibsPass] = useState(0);
  const [totalRibsFail, setTotalRibsFail] = useState(0);
  const [totalBodyPass, setTotalBodyPass] = useState(0);
  const [totalBodyFail, setTotalBodyFail] = useState(0);
  const [docsRaw, setDocsRaw] = useState([]);
  const [ordersRaw, setOrdersRaw] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [factoryStyleFilter, setFactoryStyleFilter] = useState('');
  const [buyerStyleFilter, setBuyerStyleFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const buyerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = API_BASE_URL && API_BASE_URL !== '' ? API_BASE_URL.replace(/\/$/, '') : '';
        const url = `${base}/api/humidity-reports?limit=0`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const json = await res.json();
        const docs = json?.data || [];
        if (mounted) setDocsRaw(docs);
        try {
          const ordersUrl = `${base}/api/yorksys-orders?limit=0`;
          const ordRes = await fetch(ordersUrl);
          if (ordRes.ok) {
            const ordJson = await ordRes.json();
            const orders = ordJson && ordJson.data ? ordJson.data : (Array.isArray(ordJson) ? ordJson : []);
            if (mounted) setOrdersRaw(orders);
          }
        } catch (ordErr) {
          console.warn('Could not fetch yorksys-orders:', ordErr);
        }
      } catch (e) {
        console.error('Dashboard load error', e);
        if (mounted) setError(e.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    const onUpdated = (e) => {
      try {
        const saved = e && e.detail ? e.detail : null;
        if (saved) {
          setDocsRaw(prev => {
            try {
              const id = saved && (saved._id || saved.id);
              if (id && prev.some(p => (p._id || p.id) === id)) return prev;
            } catch (er) { /* ignore */ }
            return [saved, ...prev];
          });
        } else {
          fetchData();
        }
      } catch (err) {
        fetchData();
      }
    };
    window.addEventListener('humidityReportsUpdated', onUpdated);
    return () => {
      mounted = false;
      window.removeEventListener('humidityReportsUpdated', onUpdated);
    };
  }, []);

  // filtered docs based on current filters
  const filteredDocs = useMemo(() => {
    const docs = Array.isArray(docsRaw) ? docsRaw : [];
    return docs.filter(d => {
      const dtStr = d.date || d.createdAt || d.created || d._createdAt || null;
      if (startDate || endDate) {
        if (!dtStr) return false;
        const dt = new Date(dtStr);
        if (isNaN(dt)) return false;
        if (startDate) {
          const s = new Date(startDate);
          if (dt < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          if (dt > e) return false;
        }
      }
      if (factoryStyleFilter) {
        const fs = (d.factoryStyleNo || d.factoryStyle || d.style || d.moNo || '').toString();
        if (!fs.toLowerCase().includes(factoryStyleFilter.toLowerCase())) return false;
      }
      if (buyerStyleFilter) {
        const bs = (d.buyerStyle || d.buyerStyleName || d.style || d.factoryStyle || '').toString();
        if (!bs.toLowerCase().includes(buyerStyleFilter.toLowerCase())) return false;
      }
      if (customerFilter) {
        const cu = (d.customer || d.buyer || d.customerName || d.buyerName || '').toString();
        if (!cu.toLowerCase().includes(customerFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [docsRaw, startDate, endDate, factoryStyleFilter, buyerStyleFilter, customerFilter]);

  // recompute aggregates when filtered docs change
  useEffect(() => {
    try {
      const filtered = filteredDocs;
      const bodyCounts = {};
      const ribsCounts = {};
      let totalRPass = 0;
      let totalRFail = 0;
      let totalBPass = 0;
      let totalBFail = 0;

      filtered.forEach(d => {
        const cust = (d.customer || d.buyer || 'Unknown').toString();
        if (!bodyCounts[cust]) bodyCounts[cust] = 0;
        if (!ribsCounts[cust]) ribsCounts[cust] = 0;

        // Process history array instead of inspectionRecords
        const history = Array.isArray(d.history) ? d.history : [];
        history.forEach(check => {
          ['top', 'middle', 'bottom'].forEach(sec => {
            const s = check[sec] || {};
            if (s.body !== undefined && s.body !== null && String(s.body).trim() !== '') {
              const bodyStr = String(s.body).trim();
              const bodyNum = parseFloat(bodyStr) || 1;
              bodyCounts[cust] += bodyNum;
              if (s.status === 'pass') totalBPass += bodyNum;
              else if (s.status === 'fail') totalBFail += bodyNum;
            }
            if (s.ribs !== undefined && s.ribs !== null && String(s.ribs).trim() !== '') {
              const ribsStr = String(s.ribs).trim();
              const ribsNum = parseFloat(ribsStr) || 1;
              ribsCounts[cust] += ribsNum;
              if (s.status === 'pass') totalRPass += ribsNum;
              else if (s.status === 'fail') totalRFail += ribsNum;
            }
          });
        });
      });

      setBodyCountsByCustomer(bodyCounts);
      setRibsCountsByCustomer(ribsCounts);
      setTotalRibsPass(totalRPass);
      setTotalRibsFail(totalRFail);
      setTotalBodyPass(totalBPass);
      setTotalBodyFail(totalBFail);
    } catch (e) {
      console.error('Error computing aggregates for dashboard filters', e);
    }
  }, [filteredDocs]);

  // derive buyer style options from humidity reports and yorksys orders
  const buyerOptions = useMemo(() => {
    try {
      const s = new Set();
      (docsRaw || []).forEach(d => {
        const v = d && (d.buyerStyle || d.buyerStyleName || d.style || '');
        if (v !== undefined && v !== null) {
          const str = String(v).trim();
          if (str) s.add(str);
        }
      });
      (ordersRaw || []).forEach(o => {
        const v = o && (o.style || o.buyerStyle || o.buyerStyleName || '');
        if (v !== undefined && v !== null) {
          const str = String(v).trim();
          if (str) s.add(str);
        }
      });
      return Array.from(s).sort();
    } catch (e) {
      return [];
    }
  }, [docsRaw, ordersRaw]);

  const customerOptions = useMemo(() => {
    try {
      const s = new Set();
      (docsRaw || []).forEach(d => {
        const v = d && (d.customer || d.buyer || d.customerName || d.buyerName || '');
        if (v !== undefined && v !== null) {
          const str = String(v).trim();
          if (str) s.add(str);
        }
      });
      (ordersRaw || []).forEach(o => {
        const v = o && (o.buyer || o.customer || o.buyerName || o.customerName || '');
        if (v !== undefined && v !== null) {
          const str = String(v).trim();
          if (str) s.add(str);
        }
      });
      return Array.from(s).sort();
    } catch (e) {
      return [];
    }
  }, [docsRaw, ordersRaw]);

  // filtered options when a factory style is selected
  const buyerOptionsFiltered = useMemo(() => {
    try {
      if (!factoryStyleFilter) return buyerOptions;
      const f = factoryStyleFilter.toString().trim().toLowerCase();
      const s = new Set();
      (docsRaw || []).forEach(d => {
        const fs = ((d.factoryStyleNo || d.factoryStyle || d.style || d.moNo || '') || '').toString().trim().toLowerCase();
        if (!fs.includes(f)) return;
        const v = d && (d.buyerStyle || d.buyerStyleName || d.style || '');
        if (v) s.add(String(v).trim());
      });
      (ordersRaw || []).forEach(o => {
        const fs = ((o.moNo || o.style || '') || '').toString().trim().toLowerCase();
        if (!fs.includes(f)) return;
        const v = o && (o.style || o.buyerStyle || o.buyerStyleName || '');
        if (v) s.add(String(v).trim());
      });
      return Array.from(s).length ? Array.from(s).sort() : buyerOptions;
    } catch (e) {
      return buyerOptions;
    }
  }, [factoryStyleFilter, docsRaw, ordersRaw, buyerOptions]);

  const customerOptionsFiltered = useMemo(() => {
    try {
      if (!factoryStyleFilter) return customerOptions;
      const f = factoryStyleFilter.toString().trim().toLowerCase();
      const s = new Set();
      (docsRaw || []).forEach(d => {
        const fs = ((d.factoryStyleNo || d.factoryStyle || d.style || d.moNo || '') || '').toString().trim().toLowerCase();
        if (!fs.includes(f)) return;
        const v = d && (d.customer || d.buyer || d.customerName || d.buyerName || '');
        if (v) s.add(String(v).trim());
      });
      (ordersRaw || []).forEach(o => {
        const fs = ((o.moNo || o.style || '') || '').toString().trim().toLowerCase();
        if (!fs.includes(f)) return;
        const v = o && (o.buyer || o.customer || o.buyerName || o.customerName || '');
        if (v) s.add(String(v).trim());
      });
      return Array.from(s).length ? Array.from(s).sort() : customerOptions;
    } catch (e) {
      return customerOptions;
    }
  }, [factoryStyleFilter, docsRaw, ordersRaw, customerOptions]);

  // when factory selection changes, reset buyer/customer
  useEffect(() => {
    try {
      if (factoryStyleFilter && factoryStyleFilter.toString().trim() !== '') {
        if (buyerOptionsFiltered && buyerOptionsFiltered.length === 1) {
          setBuyerStyleFilter(buyerOptionsFiltered[0]);
        } else {
          setBuyerStyleFilter('');
        }
        if (customerOptionsFiltered && customerOptionsFiltered.length === 1) {
          setCustomerFilter(customerOptionsFiltered[0]);
        } else {
          setCustomerFilter('');
        }
      } else {
        setBuyerStyleFilter('');
        setCustomerFilter('');
      }
    } catch (e) {
      setBuyerStyleFilter('');
      setCustomerFilter('');
    }
  }, [factoryStyleFilter, buyerOptionsFiltered, customerOptionsFiltered]);

  const total = totalRibsPass + totalRibsFail;
  const passPct = total ? Math.round((totalRibsPass / total) * 100) : 0;
  const failPct = total ? Math.round((totalRibsFail / total) * 100) : 0;
  const totalBody = totalBodyPass + totalBodyFail;
  const passPctBody = totalBody ? Math.round((totalBodyPass / totalBody) * 100) : 0;
  const failPctBody = totalBody ? Math.round((totalBodyFail / totalBody) * 100) : 0;

  // Compute total inspections and styles
  const totalInspections = filteredDocs.reduce((sum, doc) => {
    const history = Array.isArray(doc.history) ? doc.history : [];
    return sum + history.length;
  }, 0);

  const uniqueStyles = new Set(filteredDocs.map(d => d.factoryStyleNo || d.factoryStyle).filter(Boolean));
  const totalStyles = uniqueStyles.size;

  const uniqueCustomers = new Set(filteredDocs.map(d => d.customer || d.buyer).filter(Boolean));
  const totalCustomers = uniqueCustomers.size;

  // Recent activity (last 5 reports)
  const recentActivity = useMemo(() => {
    return filteredDocs
      .slice(0, 5)
      .map(doc => ({
        factoryStyleNo: doc.factoryStyleNo || 'N/A',
        customer: doc.customer || 'N/A',
        date: doc.updatedAt || doc.createdAt,
        checksCount: Array.isArray(doc.history) ? doc.history.length : 0,
        latestStatus: (() => {
          const history = Array.isArray(doc.history) ? doc.history : [];
          if (history.length === 0) return 'pending';
          const latest = history[history.length - 1];
          const allPass = latest.top?.status === 'pass' && latest.middle?.status === 'pass' && latest.bottom?.status === 'pass';
          return allPass ? 'pass' : 'fail';
        })()
      }));
  }, [filteredDocs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Error Loading Dashboard</span>
          </div>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3.5c-3.5 4.5-6 7.5-6 10.5a6 6 0 0012 0c0-3-2.5-6-6-10.5zm0 14.5a3 3 0 01-3-3c0-1.5 1.5-3.5 3-5.5 1.5 2 3 4 3 5.5a3 3 0 01-3 3z" />
              </svg>
              <h1 className="text-3xl text-red-400 font-bold">Humidity Inspection Dashboard</h1>
            </div>
            <p className="text-gray-600 ml-12">Real-time <span className="text-red-400 font-semibold">quality control</span> analytics and insights</p>
          </div>
          <div className="hidden md:block">
            <svg className="w-20 h-20 opacity-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Factory Style No</label>
            <div className="relative">
              <select
                value={factoryStyleFilter}
                onChange={e => setFactoryStyleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Styles</option>
                {[...new Set([
                  ...(Array.isArray(ordersRaw) ? ordersRaw.map(o => (o.moNo || o.style || '').toString()).filter(Boolean) : []),
                  ...(Array.isArray(docsRaw) ? docsRaw.map(d => (d.factoryStyleNo || d.factoryStyle || d.moNo || d.style || '').toString()).filter(Boolean) : [])
                ])].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
          <div ref={buyerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Style</label>
            <input
              type="text"
              value={factoryStyleFilter ? (buyerStyleFilter || (buyerOptionsFiltered && buyerOptionsFiltered[0]) || '') : ''}
              readOnly
              disabled={!factoryStyleFilter}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 disabled:opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <input
              value={factoryStyleFilter ? (customerFilter || (customerOptionsFiltered && customerOptionsFiltered[0]) || '') : ''}
              readOnly
              disabled={!factoryStyleFilter}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 disabled:opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          label="Total Inspections"
          value={totalInspections}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />
        <StatsCard
          label="Unique Styles"
          value={totalStyles}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          color="purple"
        />
        <StatsCard
          label="Customers"
          value={totalCustomers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="orange"
        />
        <StatsCard
          label="Pass Rate"
          value={`${passPctBody}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color={passPctBody >= 80 ? 'green' : passPctBody >= 50 ? 'green' : 'green'}
        />
        <StatsCard
          label="Fail Rate"
          value={`${failPctBody}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color={failPctBody <= 20 ? 'red' : failPctBody <= 50 ? 'red' : 'red'}
        />
      </div>

      {/* Main KPI Cards - Body Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Body Readings"
          value={totalBody}
          subtitle={`${passPctBody}% pass rate`}
          gradient="bg-gray-50 border-2 border-blue-300"
          icon={
            <svg className="w-full h-full text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <KpiCard
          title="Body Pass"
          value={totalBodyPass}
          subtitle="Passed inspection"
          gradient="bg-gray-50 border-2 border-green-300"
          trend={passPctBody > 50 ? passPctBody : null}
          percent={passPctBody}
          cornerBg="bg-green-50"
          cornerIcon={
            <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 14h3v6H4zM10 10h3v10h-3zM16 6h3v14h-3z" fill="currentColor" />
              <path d="M16 6l4-4M20 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          icon={
            <svg className="w-full h-full text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Body Fail"
          value={totalBodyFail}
          subtitle="Requires attention"
          gradient="bg-gray-50 border-2 border-red-300"
          trend={failPctBody < 50 ? -failPctBody : null}
          percent={failPctBody}
          cornerBg="bg-red-50"
          cornerIcon={
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 14h3v6H4zM10 10h3v10h-3zM16 6h3v14h-3z" fill="currentColor" />
              <path d="M16 6l4-4M20 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          icon={
            <svg className="w-full h-full text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Ribs KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Ribs Readings"
          value={total}
          subtitle={`${passPct}% pass rate`}
          gradient="bg-gray-50 border-2 border-purple-300"
          icon={
            <svg className="w-full h-full text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          }
        />
        <KpiCard
          title="Ribs Pass"
          value={totalRibsPass}
          subtitle="Passed inspection"
          gradient="bg-gray-50 border-2 border-teal-300"
          trend={passPct > 50 ? passPct : null}
          percent={passPct}
          cornerBg="bg-green-50"
          cornerIcon={
            <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 14h3v6H4zM10 10h3v10h-3zM16 6h3v14h-3z" fill="currentColor" />
              <path d="M16 6l4-4M20 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          icon={
            <svg className="w-full h-full text-teal-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <KpiCard
          title="Ribs Fail"
          value={totalRibsFail}
          subtitle="Requires attention"
          gradient="bg-gray-50 border-2 border-orange-300"
          trend={failPct < 50 ? -failPct : null}
          percent={failPct}
          cornerBg="bg-red-50"
          cornerIcon={
            <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 14h3v6H4zM10 10h3v10h-3zM16 6h3v14h-3z" fill="currentColor" />
              <path d="M16 6l4-4M20 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          icon={
            <svg className="w-full h-full text-orange-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Body Performance</h3>
          </div>
          {totalBodyPass === 0 && totalBodyFail === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium text-gray-700">No Body Data Available</p>
              <p className="text-sm mt-1 text-center">Enter body readings in your inspection reports to see this chart</p>
            </div>
          ) : (
            <div className="flex items-center justify-center mt-10 pb-4" style={{ height: 200 }}>
              <div className="w-full md:w-2/5">
                <Doughnut
                  data={{
                    labels: ['Pass', 'Fail'],
                    datasets: [{
                      data: [totalBodyPass, totalBodyFail],
                      backgroundColor: [
                        'rgba(173, 216, 230, 0.8)',
                        'rgba(255, 192, 203, 0.8)',
                      ],
                      borderColor: [
                        'rgba(173, 216, 230, 1)',
                        'rgba(255, 192, 203, 1)',
                      ],
                      borderWidth: 2,
                      hoverOffset: 8
                    }]
                  }}
                  options={{
                    cutout: '65%',
                    plugins: {
                      datalabels: {
                        display: false
                      },
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          boxWidth: 10,
                          boxHeight: 10,
                          padding: 24,
                          font: { size: 13, weight: 500 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const percentage = Math.round((value / total) * 100) + '%';
                            return `${label}: ${value} (${percentage})`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ribs Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Ribs Performance</h3>
          </div>
          {totalRibsPass === 0 && totalRibsFail === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium text-gray-700">No Ribs Data Available</p>
              <p className="text-sm mt-1 text-center">Enter ribs readings in your inspection reports to see this chart</p>
            </div>
          ) : (
            <div className="flex items-center justify-center mt-10 pb-4" style={{ height: 200 }}>
              <div className="w-full md:w-2/5">
                <Doughnut
                  data={{
                    labels: ['Pass', 'Fail'],
                    datasets: [{
                      data: [totalRibsPass, totalRibsFail],
                      backgroundColor: [
                        '#B5EAD7', // Pastel Mint (Pass)
                        '#FF9AA2', // Pastel Salmon (Fail)
                      ],
                      borderColor: [
                        '#B5EAD7',
                        '#FF9AA2',
                      ],
                      borderWidth: 2,
                      hoverOffset: 8
                    }]
                  }}
                  options={{
                    cutout: '65%',
                    plugins: {
                      datalabels: {
                        display: false
                      },
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          boxWidth: 10,
                          boxHeight: 10,
                          padding: 24,
                          font: { size: 13, weight: 500 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const percentage = Math.round((value / total) * 100) + '%';
                            return `${label}: ${value} (${percentage})`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="font-medium">No recent activity</p>
            <p className="text-sm mt-1">Start by creating humidity inspection reports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.latestStatus === 'pass' ? 'bg-green-100 text-green-600' :
                    activity.latestStatus === 'fail' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {activity.latestStatus === 'pass' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : activity.latestStatus === 'fail' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{activity.factoryStyleNo}</div>
                    <div className="text-sm text-gray-600">{activity.customer}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{activity.checksCount} {activity.checksCount === 1 ? 'check' : 'checks'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
