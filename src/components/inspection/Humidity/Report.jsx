import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../../config';
import ExportPanel from './Export';
import Dashboard from './dashboard';
import ReitmansForm from './Reitmans';
import { useAuth } from '../../authentication/AuthContext';
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const FormPage = () => {
    const { user } = useAuth();
    const [errors, setErrors] = useState({});
    const [orderNoSearch, setOrderNoSearch] = useState('');
    const [orderNoSuggestions, setOrderNoSuggestions] = useState([]);
    const [showOrderNoDropdown, setShowOrderNoDropdown] = useState(false);
    const [isLoadingOrderData, setIsLoadingOrderData] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [availableColors, setAvailableColors] = useState([]);
    const [autoFilledFields, setAutoFilledFields] = useState({ buyerStyle: false, customer: false, fabrication: false });
    const [message, setMessage] = useState({ type: '', text: '' });
    const orderNoDropdownRef = useRef(null);
    const [humidityDocs, setHumidityDocs] = useState([]);
    const [fabricFiberMatches, setFabricFiberMatches] = useState([]);
    const [ribsAvailable, setRibsAvailable] = useState(false);

    const [checkHistory, setCheckHistory] = useState([]);
    const [firstCheckDate, setFirstCheckDate] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isStyleComplete, setIsStyleComplete] = useState(false);
    const [isAfterDryMode, setIsAfterDryMode] = useState(false);
    const [formData, setFormData] = useState({
        buyerStyle: '',
        factoryStyleNo: '',
        customer: '',
        fabrication: '',
        aquaboySpecBody: '',
        aquaboySpecRibs: '',
        colorName: '',
        beforeDryRoom: '',
        beforeDryRoomTime: '',
        afterDryRoom: '',
        afterDryRoomTime: '',
        date: '',
        inspectionType: 'Inline',
        inspectionRecords: [
            {
                top: { body: '', ribs: '', pass: false, fail: false },
                middle: { body: '', ribs: '', pass: false, fail: false },
                bottom: { body: '', ribs: '', pass: false, fail: false },
                additional: {
                    top: { body: '', ribs: '', pass: false, fail: false },
                    middle: { body: '', ribs: '', pass: false, fail: false },
                    bottom: { body: '', ribs: '', pass: false, fail: false }
                },
                images: []
            }
        ],
        generalRemark: '',
        inspectorSignature: '',
        qamSignature: ''
    });

    const [activeTab, setActiveTab] = useState('Inspection');
    const tabs = ['Inspection', 'Qc-daily-report', 'Dashboard'];
    const [calcSteps, setCalcSteps] = useState([]);
    const addCalcStep = (step) => {
        try {
            const ts = new Date().toLocaleTimeString();
            setCalcSteps(prev => [...prev, `${ts}: ${step}`]);
            console.log(`CALC STEP - ${ts}:`, step);
        } catch (e) {
            console.error('Error adding calc step', e);
        }
    };
    const setDefaultBeforeDryRoomTimeIfEmpty = () => {
        try {
            if (!formData.beforeDryRoomTime || formData.beforeDryRoomTime.toString().trim() === '') {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const timeStr = `${hh}:${mm}`;
                setFormData(prev => ({ ...prev, beforeDryRoomTime: timeStr }));
            }
        } catch (e) {
            console.error('Error setting default beforeDryRoomTime', e);
        }
    };

    const setDefaultAfterDryRoomTimeIfEmpty = () => {
        try {
            if (!formData.afterDryRoomTime || formData.afterDryRoomTime.toString().trim() === '') {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const timeStr = `${hh}:${mm}`;
                setFormData(prev => ({ ...prev, afterDryRoomTime: timeStr }));
            }
        } catch (e) {
            console.error('Error setting default afterDryRoomTime', e);
        }
    };

    const setDefaultDateIfEmpty = () => {
        try {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            setFormData(prev => ({ ...prev, date: prev.date && prev.date.toString().trim() !== '' ? prev.date : dateStr }));
        } catch (e) {
            console.error('Error setting default date', e);
        }
    };

    // set defaults on mount
    useEffect(() => {
        setDefaultDateIfEmpty();
    }, []);

    // Fetch order number suggestions (moNo) when typing in Factory Style No
    useEffect(() => {
        const fetchOrderNoSuggestions = async () => {
            if (!orderNoSearch || orderNoSearch.length < 1) {
                setOrderNoSuggestions([]);
                setShowOrderNoDropdown(false);
                return;
            }
            setIsLoadingOrderData(true);
            addCalcStep('Started fetchOrderNoSuggestions; preparing to fetch orders');
            try {
                const response = await fetch(`${API_BASE_URL || 'http://localhost:5001'}/api/yorksys-orders?limit=0`);
                const result = await response.json();
                const orders = result && result.data ? result.data : (Array.isArray(result) ? result : []);
                console.log('api/yorksys-orders response:', result);
                console.log('parsed orders array:', orders);
                addCalcStep(`Fetched orders: ${Array.isArray(orders) ? orders.length : 0}`);

                const filtered = (orders || []).filter(o => {
                    const mo = (o.moNo || '').toString().toLowerCase();
                    const style = (o.style || '').toString().toLowerCase();
                    const q = orderNoSearch.toLowerCase();
                    return mo.includes(q) || style.includes(q);
                });

                setOrderNoSuggestions(filtered || []);
                setShowOrderNoDropdown((filtered || []).length > 0);
                addCalcStep(`Filtered suggestions to ${((filtered || []).length)} items for query "${orderNoSearch}"`);

                // Also fetch humidity_data here so it's loaded together with order suggestions
                try {
                    const humRes = await fetch(`${API_BASE_URL || 'http://localhost:5001'}/api/humidity-data`);
                    const humJson = await humRes.json();
                    const humDocs = humJson && humJson.data ? humJson.data : [];
                    setHumidityDocs(humDocs);
                    console.log('humidity_data docs (fetched with yorksys-orders):', humDocs);
                    addCalcStep(`Fetched humidity_data docs: ${Array.isArray(humDocs) ? humDocs.length : 0}`);
                } catch (humErr) {
                    console.error('Error fetching humidity_data list:', humErr);
                    setHumidityDocs([]);
                    addCalcStep(`Error fetching humidity_data: ${humErr && humErr.message ? humErr.message : String(humErr)}`);
                }
            } catch (err) {
                console.error('Error fetching moNo suggestions:', err);
                setOrderNoSuggestions([]);
                setShowOrderNoDropdown(false);
                addCalcStep(`Error fetching yorksys-orders: ${err && err.message ? err.message : String(err)}`);
            } finally {
                setIsLoadingOrderData(false);
            }
        };

        const debounce = setTimeout(fetchOrderNoSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [orderNoSearch]);



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (orderNoDropdownRef.current && !orderNoDropdownRef.current.contains(event.target)) {
                setShowOrderNoDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOrderNoSelect = async (moNo) => {
        console.log('[DEBUG] Selecting Order:', moNo);
        // Set selected moNo into the factory style field and close dropdown
        setOrderNoSearch(moNo);

        // Reset ribsAvailable and afterDry mode before starting any fetching
        setRibsAvailable(false);
        setIsAfterDryMode(false);

        // Reset form data for the new style selection to prevent carrying over old inspection data
        setFormData(prev => {
            // Revoke object URLs for all images to prevent memory leaks
            (prev.inspectionRecords || []).forEach(record => {
                (record.images || []).forEach(img => {
                    if (img.preview) URL.revokeObjectURL(img.preview);
                });
            });

            return {
                ...prev,
                factoryStyleNo: moNo,
                colorName: '',
                beforeDryRoom: '',
                beforeDryRoomTime: '',
                afterDryRoom: '',
                afterDryRoomTime: '',
                generalRemark: '',
                inspectorSignature: '',
                qamSignature: '',
                aquaboySpecBody: '',
                aquaboySpecRibs: '',
                inspectionRecords: [
                    {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false },
                        additional: {
                            top: { body: '', ribs: '', pass: false, fail: false },
                            middle: { body: '', ribs: '', pass: false, fail: false },
                            bottom: { body: '', ribs: '', pass: false, fail: false }
                        },
                        images: []
                    }
                ]
            };
        });

        setShowOrderNoDropdown(false);
        await fetchCheckHistory(moNo);
        try {
            setIsLoadingOrderData(true);
            // reset previous calculation steps for clarity
            setCalcSteps([]);
            addCalcStep(`handleOrderNoSelect: selected moNo="${moNo}" - fetching order details`);
            // ensure humidity docs are available before mapping
            if (!humidityDocs || humidityDocs.length === 0) {
                try {
                    addCalcStep('Humidity docs empty — fetching humidity_data before mapping');
                    const hdRes = await fetch(`${API_BASE_URL || 'http://localhost:5001'}/api/humidity-data`);
                    const hdJson = await hdRes.json();
                    const hdDocs = hdJson && hdJson.data ? hdJson.data : [];
                    setHumidityDocs(hdDocs);
                    addCalcStep(`Fetched humidity_data (on-demand): ${Array.isArray(hdDocs) ? hdDocs.length : 0}`);
                } catch (hdErr) {
                    console.error('Error fetching humidity_data on-demand:', hdErr);
                    addCalcStep(`Error fetching humidity_data on-demand: ${hdErr && hdErr.message ? hdErr.message : String(hdErr)}`);
                    setHumidityDocs([]);
                }
            }
            const res = await fetch(`${API_BASE_URL}/api/yorksys-orders/${encodeURIComponent(moNo)}`);
            const json = await res.json();
            const order = json && json.data ? json.data : (json || null);
            console.log('order by moNo:', json);
            addCalcStep(`Fetched order details for "${moNo}"`);
            if (order) {
                let fabricationStr = '';
                if (Array.isArray(order.FabricContent) && order.FabricContent.length > 0) {
                    fabricationStr = order.FabricContent.map(f => {
                        const name = f.fabricName || f.fabric || f.name || '';
                        const pct = (f.percentageValue !== undefined && f.percentageValue !== null) ? `${f.percentageValue}%` : '';
                        return `${name}${pct ? ' ' + pct : ''}`.trim();
                    }).filter(Boolean).join(', ');
                }
                addCalcStep(`Derived fabrication string: "${fabricationStr}"`);

                const poLine = (Array.isArray(order.SKUData) && order.SKUData.length > 0) ? order.SKUData[0].POLine : '';

                setFormData(prev => ({
                    ...prev,
                    buyerStyle: order.style || prev.buyerStyle,
                    customer: order.buyer || prev.customer,
                    fabrication: fabricationStr || prev.fabrication,
                    // Auto-fill Reitmans specific fields
                    productName: order.style || prev.productName,
                    composition: fabricationStr || prev.composition,
                    poLine: poLine || prev.poLine || ''
                }));

                // mark which fields were auto-filled so they become read-only
                setAutoFilledFields({ buyerStyle: Boolean(order.style), customer: Boolean(order.buyer), fabrication: Boolean(fabricationStr) });
                addCalcStep(`Auto-filled fields: buyerStyle=${Boolean(order.style)}, customer=${Boolean(order.buyer)}, fabrication=${Boolean(fabricationStr)}`);

                const colors = [];
                if (Array.isArray(order.SKUData)) colors.push(...order.SKUData.map(s => s.Color).filter(Boolean));
                if (Array.isArray(order.OrderQtyByCountry)) {
                    order.OrderQtyByCountry.forEach(c => {
                        if (Array.isArray(c.ColorQty)) c.ColorQty.forEach(col => col.ColorName && colors.push(col.ColorName));
                    });
                }
                const uniqueColors = [...new Set(colors)];
                setAvailableColors(uniqueColors);
                if (uniqueColors.length === 1) {
                    const color = uniqueColors[0];
                    setFormData(prev => ({
                        ...prev,
                        colorName: color,
                        inspectionRecords: (prev.inspectionRecords || []).map(r => ({ ...r, colorName: color }))
                    }));
                }
                addCalcStep(`Available colors detected: ${uniqueColors.length}${uniqueColors.length === 1 ? ' (auto-selected)' : ''}`);
                try {
                    const detectRibsAvailable = (ord) => {
                        if (!ord) return false;
                        // Check for explicit flags (truthy check to handle string "true" or number 1)
                        if (ord.hasRibs === true || ord.hasRibs === 'true' || ord.hasRibs === 1) return true;
                        if (ord.ribsRequired === true || ord.ribsRequired === 'true' || ord.ribsRequired === 1) return true;

                        // Check explicit RibContent array from YorksysOrders
                        if (Array.isArray(ord.RibContent) && ord.RibContent.length > 0) {
                            if (ord.RibContent.some(rc => rc.fabricName || rc.percentageValue)) return true;
                        }

                        // Targeted string search in descriptive fields
                        const searchFields = [
                            ord.style,
                            ord.factoryStyleName,
                            ord.description,
                            ord.fabrication,
                            ...(Array.isArray(ord.FabricContent) ? ord.FabricContent.map(f => f.fabricName || f.fabric || '') : []),
                            ...(Array.isArray(ord.RibContent) ? ord.RibContent.map(f => f.fabricName || f.fabric || '') : []),
                            ...(Array.isArray(ord.SKUData) ? ord.SKUData.map(s => s.Color || '') : [])
                        ];

                        if (searchFields.some(field =>
                            field && String(field).toLowerCase().includes('rib')
                        )) return true;

                        // Check SKUData for actual Ribs measurements
                        if (Array.isArray(ord.SKUData) && ord.SKUData.some(s =>
                            s.Ribs !== undefined &&
                            s.Ribs !== null &&
                            String(s.Ribs).trim() !== '' &&
                            String(s.Ribs).trim().toLowerCase() !== 'n/a' &&
                            String(s.Ribs).trim() !== '0'
                        )) return true;

                        // Check FabricContent for ribs-specific metadata
                        if (Array.isArray(ord.FabricContent) && ord.FabricContent.some(fc =>
                            (fc.ribs !== undefined && fc.ribs !== null && String(fc.ribs).trim() !== '') ||
                            (fc.fabricName && String(fc.fabricName).toLowerCase().includes('rib'))
                        )) return true;

                        return false;
                    };
                    const ribsFlag = detectRibsAvailable(order);
                    setRibsAvailable(prev => prev || ribsFlag);
                    addCalcStep(`Ribs availability detection: ${ribsFlag ? 'ENABLED' : 'DISABLED'}`);
                    if (ribsFlag) {
                        const detectReason = (ord) => {
                            if (ord.hasRibs || ord.ribsRequired) return 'explicit flag';
                            if (Array.isArray(ord.RibContent) && ord.RibContent.length > 0) return 'RibContent array';
                            if (Array.isArray(ord.SKUData) && ord.SKUData.some(s => s.Ribs && s.Ribs !== '0')) return 'SKU measurement data';
                            if (Array.isArray(ord.FabricContent) && ord.FabricContent.some(fc => fc.ribs || (fc.fabricName && fc.fabricName.toLowerCase().includes('rib')))) return 'Fabric metadata';
                            return 'descriptive keyword match';
                        };
                        addCalcStep(`Ribs enabled because of: ${detectReason(order)}`);
                    }
                    if (!ribsFlag) {
                        // clear ribs values from existing inspection records to avoid stale data
                        setFormData(prev => ({
                            ...prev,
                            inspectionRecords: prev.inspectionRecords.map(rec => ({
                                ...rec,
                                top: { ...rec.top, ribs: '' },
                                middle: { ...rec.middle, ribs: '' },
                                bottom: { ...rec.bottom, ribs: '' }
                            }))
                        }));
                        addCalcStep('Cleared ribs fields because ribs not available for this order');
                    }
                } catch (rErr) {
                    console.error('Error detecting ribs availability:', rErr);
                    addCalcStep(`Error detecting ribs availability: ${rErr && rErr.message ? rErr.message : String(rErr)}`);
                }

                try {
                    addCalcStep('Starting FabricContent -> FiberName mapping');
                    const rawFabricContent = Array.isArray(order.FabricContent) ? order.FabricContent : [];
                    let fabricContentArray = [];
                    if (rawFabricContent.length === 1) {
                        const fc = rawFabricContent[0];
                        const name = (fc.fabricName || fc.fabric || fc.name || '').toString().trim();
                        const pctPresent = fc.percentageValue !== undefined && fc.percentageValue !== null && fc.percentageValue !== '';
                        if (name !== '' && pctPresent) {
                            fabricContentArray = [fc];
                        } else {
                            fabricContentArray = [];
                        }
                    } else {
                        fabricContentArray = rawFabricContent
                            .filter(fc => {
                                const name = (fc.fabricName || fc.fabric || fc.name || '').toString().trim();
                                const pctPresent = fc.percentageValue !== undefined && fc.percentageValue !== null && fc.percentageValue !== '';
                                return name !== '' && pctPresent;
                            });
                    }
                    addCalcStep(`Normalized FabricContent array length: ${fabricContentArray.length}`);
                    const buyerKey = (order.buyer || '').toString().toLowerCase();
                    const buyerEntry = (humidityDocs || []).find(d => (d.buyer || '').toString().toLowerCase() === buyerKey);
                    const fiberList = buyerEntry && Array.isArray(buyerEntry.FiberName) ? buyerEntry.FiberName : [];
                    addCalcStep(`Found buyer entry: ${buyerEntry ? 'yes' : 'no'}; fiberList length: ${fiberList.length}`);

                    const matches = fabricContentArray.map(f => {
                        const fabricName = (f.fabricName || f.fabric || '').toString();
                        const pctRaw = (f.percentageValue !== undefined && f.percentageValue !== null) ? f.percentageValue : null;
                        // normalize percentage (strip trailing % if present and convert to Number)
                        const pctNum = pctRaw !== null ? Number(String(pctRaw).replace('%', '')) : null;
                        const matchedFiberObj = fiberList.find(fn => (fn.fiber || '').toString().toLowerCase() === fabricName.toLowerCase());
                        const matchedLimitRaw = matchedFiberObj ? matchedFiberObj.limit : null;
                        const matchedLimitNum = matchedLimitRaw !== null && matchedLimitRaw !== undefined ? Number(matchedLimitRaw) : null;
                        const computedValue = (pctNum !== null && matchedLimitNum !== null && !isNaN(pctNum) && !isNaN(matchedLimitNum))
                            ? (pctNum * matchedLimitNum) / 100
                            : null;

                        addCalcStep(`Match: fabric="${fabricName}", pctRaw=${pctRaw}, pctNum=${pctNum}, matchedFiber=${matchedFiberObj ? matchedFiberObj.fiber : 'none'}, 
                            limitRaw=${matchedLimitRaw}, limitNum=${matchedLimitNum}, computed=${computedValue}`);
                        return {
                            fabricName,
                            percentageValue: pctRaw,
                            percentageNumber: pctNum,
                            matchedFiberName: matchedFiberObj ? matchedFiberObj.fiber : null,
                            matchedFiberLimit: matchedFiberObj ? matchedFiberObj.limit : null,
                            matchedFiberLimitNumber: matchedLimitNum,
                            buyerFound: Boolean(buyerEntry),
                            computedValue
                        };
                    });

                    setFabricFiberMatches(matches);
                    addCalcStep(`Mapping complete. Matches count: ${matches.length}`);
                    // Sum computedValue across matches and put into aquaboySpecBody
                    try {
                        const total = matches.reduce((acc, m) => {
                            const v = (m && m.computedValue !== null && m.computedValue !== undefined) ? Number(m.computedValue) : 0;
                            return acc + (isNaN(v) ? 0 : v);
                        }, 0);

                        let totalFormatted = '';
                        if (Number.isFinite(total)) {
                            totalFormatted = String(Math.round(total));
                        }
                        setFormData(prev => ({ ...prev, aquaboySpecBody: totalFormatted }));
                        console.log('FabricContent -> FiberName matches:', matches, { buyerEntry, aquaboySpecBody: totalFormatted });
                        addCalcStep(`Computed aquaboySpecBody total raw=${total} rounded="${totalFormatted}"`);
                    } catch (sumErr) {
                        console.error('Error computing total aquaboySpecBody:', sumErr);
                        addCalcStep(`Error computing aquaboySpecBody: ${sumErr && sumErr.message ? sumErr.message : String(sumErr)}`);
                    }
                } catch (mapErr) {
                    console.error('Error mapping FabricContent to FiberName:', mapErr);
                    setFabricFiberMatches([]);
                    addCalcStep(`Error mapping FabricContent: ${mapErr && mapErr.message ? mapErr.message : String(mapErr)}`);
                }
            }
        } catch (err) {
            console.error('Error fetching order by moNo:', err);
            addCalcStep(`Error fetching order by moNo: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setIsLoadingOrderData(false);
        }
    };

    // Fetch check history for a given factoryStyleNo
    const fetchCheckHistory = async (factoryStyleNo) => {
        if (!factoryStyleNo) {
            setCheckHistory([]);
            setFirstCheckDate(null);
            setIsStyleComplete(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL || 'http://localhost:5001'}/api/humidity-reports?factoryStyleNo=${encodeURIComponent(factoryStyleNo)}`);
            const result = await response.json();

            if (response.ok && result) {
                let reports = result.data || result || [];
                // Sort reports by creation date (oldest first for chronological history)
                reports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                const allHistoryEntries = [];
                let firstCreatedAt = null;
                let latestReport = null;

                reports.forEach(report => {
                    if (!firstCreatedAt) firstCreatedAt = report.createdAt || report.date;
                    latestReport = report;

                    const historyMap = report.history || {};

                    const determineStatus = (section) => {
                        if (!section) return 'fail';
                        const bodyVal = parseFloat(section.body);
                        const ribsVal = parseFloat(section.ribs);
                        const bodySpecVal = parseFloat(report.aquaboySpecBody);
                        const ribsSpecVal = parseFloat(report.aquaboySpecRibs);

                        const isBodyFail = !isNaN(bodyVal) && !isNaN(bodySpecVal) && bodyVal > bodySpecVal;
                        const isRibsFail = !isNaN(ribsVal) && !isNaN(ribsSpecVal) && ribsVal > ribsSpecVal;

                        if (isBodyFail || isRibsFail) return 'fail';

                        const isBodyPass = !isNaN(bodyVal) && !isNaN(bodySpecVal) && bodyVal <= bodySpecVal;
                        const isRibsPass = !isNaN(ribsVal) && !isNaN(ribsSpecVal) && ribsVal <= ribsSpecVal;

                        if (ribsAvailable) {
                            return (isBodyPass && isRibsPass) ? 'pass' : 'fail';
                        }
                        return isBodyPass ? 'pass' : 'fail';
                    };

                    // Process nested Map history
                    Object.keys(historyMap).forEach(itemKey => {
                        const checks = historyMap[itemKey] || {};
                        Object.keys(checks).forEach(checkKey => {
                            const historyEntry = checks[checkKey];
                            if (!historyEntry) return;

                            const topStatus = historyEntry.top?.status || determineStatus(historyEntry.top);
                            const middleStatus = historyEntry.middle?.status || determineStatus(historyEntry.middle);
                            const bottomStatus = historyEntry.bottom?.status || determineStatus(historyEntry.bottom);

                            allHistoryEntries.push({
                                date: historyEntry.date || historyEntry.saveTime || report.createdAt || report.date || '',
                                factoryStyleNo: report.factoryStyleNo || '',
                                item: itemKey,
                                check: checkKey,
                                top: topStatus,
                                middle: middleStatus,
                                bottom: bottomStatus,
                                topBodyReading: historyEntry.top?.body || '',
                                topRibsReading: historyEntry.top?.ribs || '',
                                middleBodyReading: historyEntry.middle?.body || '',
                                middleRibsReading: historyEntry.middle?.ribs || '',
                                bottomBodyReading: historyEntry.bottom?.body || '',
                                bottomRibsReading: historyEntry.bottom?.ribs || '',
                                beforeDryRoom: historyEntry.beforeDryRoom || historyEntry.beforeDryRoomTime || '',
                                afterDryRoom: historyEntry.afterDryRoom || historyEntry.afterDryRoomTime || '',
                                images: historyEntry.images || [],
                                aquaboySpecBody: report.aquaboySpecBody || report.aquaboySpec || '',
                                aquaboySpecRibs: report.aquaboySpecRibs || ''
                            });
                        });
                    });
                });

                // Assign check numbers based on chronological order
                const history = allHistoryEntries.map((entry, index) => ({
                    ...entry,
                    checkNumber: index + 1
                }));

                setCheckHistory(history);
                if (firstCreatedAt) setFirstCheckDate(firstCreatedAt);

                // Auto-detect ribs from history only if they have actual values
                const hasRibsInHistory = reports.some(r => {
                    if (r.ribsAvailable === true) return true;
                    if (r.aquaboySpecRibs && r.aquaboySpecRibs.toString().trim() !== '' && r.aquaboySpecRibs !== '0') return true;

                    if (r.history && typeof r.history === 'object') {
                        return Object.values(r.history).some(itemChecks => {
                            if (!itemChecks || typeof itemChecks !== 'object') return false;
                            return Object.values(itemChecks).some(h =>
                                (h.top?.ribs && h.top.ribs.toString().trim() !== '') ||
                                (h.middle?.ribs && h.middle.ribs.toString().trim() !== '') ||
                                (h.bottom?.ribs && h.bottom.ribs.toString().trim() !== '')
                            );
                        });
                    }
                    return false;
                });
                if (hasRibsInHistory) {
                    setRibsAvailable(true);
                }

                if (history.length > 0) {
                    const latestCheck = history[history.length - 1];
                    const isComplete = latestCheck.top === 'pass' &&
                        latestCheck.middle === 'pass' &&
                        latestCheck.bottom === 'pass';
                    setIsStyleComplete(isComplete);
                } else {
                    setIsStyleComplete(false);
                }
            }
        } catch (err) {
            console.error('Error fetching check history:', err);
            setCheckHistory([]);
            setFirstCheckDate(null);
            setIsStyleComplete(false);
        }
    };

    const addNewRecord = () => {
        setFormData(prev => {
            // compute default date to use for new record
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const dateStr = `${mm}-${dd}-${yyyy}`;
            return {
                ...prev,
                inspectionRecords: [...prev.inspectionRecords, {
                    date: prev.date && prev.date.toString().trim() !== '' ? prev.date : dateStr,
                    colorName: prev.colorName || '',
                    beforeDryRoom: '',
                    beforeDryRoomTime: '',
                    afterDryRoom: '',
                    afterDryRoomTime: '',
                    top: { body: '', ribs: '', pass: false, fail: false },
                    middle: { body: '', ribs: '', pass: false, fail: false },
                    bottom: { body: '', ribs: '', pass: false, fail: false },
                    additional: {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false }
                    },
                    images: [],
                    remark: ''
                }]
            };
        });
    };

    const updateRecord = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            inspectionRecords: prev.inspectionRecords.map((record, i) =>
                i === index ? { ...record, [field]: value } : record
            )
        }));
    };

    const updateSectionData = (index, section, field, value) => {
        setFormData(prev => {
            const bodySpecNum = Number(prev.aquaboySpecBody);
            const ribsSpecNum = Number(prev.aquaboySpecRibs);
            const inspectionRecords = prev.inspectionRecords.map((record, i) => {
                if (i !== index) return record;

                const updatedSection = { ...record[section], [field]: value };

                // Try to parse numeric readings from body and ribs (allow strings like "51")
                const parseNumber = (v) => {
                    if (v === undefined || v === null) return NaN;
                    const s = String(v).trim();
                    if (s === '') return NaN;
                    // remove any non-numeric characters except dot and minus
                    const cleaned = s.replace(/[^0-9.\-]/g, '');
                    if (cleaned.length === 0) return NaN;
                    const n = Number(cleaned);
                    return Number.isFinite(n) ? n : NaN;
                };

                const bodyVal = parseNumber(updatedSection.body);
                const ribsVal = parseNumber(updatedSection.ribs);

                // Body Status
                const bodyStr = String(updatedSection.body || '').trim();
                if (bodyStr.length >= 2 && !Number.isNaN(bodyVal) && !Number.isNaN(bodySpecNum)) {
                    updatedSection.bodyPass = bodyVal <= bodySpecNum;
                    updatedSection.bodyFail = bodyVal > bodySpecNum;
                    updatedSection.bodyStatus = bodyVal <= bodySpecNum ? 'pass' : 'fail';
                } else {
                    updatedSection.bodyPass = false;
                    updatedSection.bodyFail = false;
                    updatedSection.bodyStatus = '';
                }

                // Ribs Status
                const ribsStr = String(updatedSection.ribs || '').trim();
                if (ribsStr.length >= 2 && !Number.isNaN(ribsVal) && !Number.isNaN(ribsSpecNum)) {
                    updatedSection.ribsPass = ribsVal <= ribsSpecNum;
                    updatedSection.ribsFail = ribsVal > ribsSpecNum;
                    updatedSection.ribsStatus = ribsVal <= ribsSpecNum ? 'pass' : 'fail';
                } else {
                    updatedSection.ribsPass = false;
                    updatedSection.ribsFail = false;
                    updatedSection.ribsStatus = '';
                }

                // Overall Status (Synthesis)
                // We wait for all available inputs before showing a row-level verdict
                const isBodyMissing = Number.isNaN(bodyVal);
                const isRibsMissing = ribsAvailable && Number.isNaN(ribsVal);

                if (isBodyMissing || isRibsMissing) {
                    updatedSection.pass = false;
                    updatedSection.fail = false;
                    updatedSection.status = '';
                } else {
                    const hasFail = updatedSection.bodyFail || (ribsAvailable && updatedSection.ribsFail);
                    let hasPass = false;
                    if (ribsAvailable) {
                        hasPass = updatedSection.bodyPass && updatedSection.ribsPass;
                    } else {
                        hasPass = updatedSection.bodyPass;
                    }

                    if (hasFail) {
                        updatedSection.pass = false;
                        updatedSection.fail = true;
                        updatedSection.status = 'fail';
                    } else if (hasPass) {
                        updatedSection.pass = true;
                        updatedSection.fail = false;
                        updatedSection.status = 'pass';
                    } else {
                        updatedSection.pass = false;
                        updatedSection.fail = false;
                        updatedSection.status = '';
                    }
                }

                return { ...record, [section]: updatedSection };
            });

            return { ...prev, inspectionRecords };
        });
    };

    const updateAdditionalSectionData = (index, section, field, value) => {
        setFormData(prev => {
            const bodySpecNum = Number(prev.aquaboySpecBody);
            const ribsSpecNum = Number(prev.aquaboySpecRibs);
            const inspectionRecords = prev.inspectionRecords.map((record, i) => {
                if (i !== index) return record;

                const prevAdditional = record.additional || {};
                const sectionPrev = prevAdditional[section] || { body: '', ribs: '', pass: false, fail: false };
                const updatedSection = { ...sectionPrev, [field]: value };

                // parse numeric values
                const parseNumber = (v) => {
                    if (v === undefined || v === null) return NaN;
                    const s = String(v).trim();
                    if (s === '') return NaN;
                    const cleaned = s.replace(/[^0-9.\-]/g, '');
                    if (cleaned.length === 0) return NaN;
                    const n = Number(cleaned);
                    return Number.isFinite(n) ? n : NaN;
                };

                const bodyVal = parseNumber(updatedSection.body);
                const ribsVal = parseNumber(updatedSection.ribs);

                // Body Status
                const bodyStr = String(updatedSection.body || '').trim();
                if (bodyStr.length >= 2 && !Number.isNaN(bodyVal) && !Number.isNaN(bodySpecNum)) {
                    updatedSection.bodyPass = bodyVal <= bodySpecNum;
                    updatedSection.bodyFail = bodyVal > bodySpecNum;
                    updatedSection.bodyStatus = bodyVal <= bodySpecNum ? 'pass' : 'fail';
                } else {
                    updatedSection.bodyPass = false;
                    updatedSection.bodyFail = false;
                    updatedSection.bodyStatus = '';
                }

                // Ribs Status
                const ribsStr = String(updatedSection.ribs || '').trim();
                if (ribsStr.length >= 2 && !Number.isNaN(ribsVal) && !Number.isNaN(ribsSpecNum)) {
                    updatedSection.ribsPass = ribsVal <= ribsSpecNum;
                    updatedSection.ribsFail = ribsVal > ribsSpecNum;
                    updatedSection.ribsStatus = ribsVal <= ribsSpecNum ? 'pass' : 'fail';
                } else {
                    updatedSection.ribsPass = false;
                    updatedSection.ribsFail = false;
                    updatedSection.ribsStatus = '';
                }

                // Overall Status (Synthesis)
                const isBodyMissing = Number.isNaN(bodyVal);
                const isRibsMissing = ribsAvailable && Number.isNaN(ribsVal);

                if (isBodyMissing || isRibsMissing) {
                    updatedSection.pass = false;
                    updatedSection.fail = false;
                    updatedSection.status = '';
                } else {
                    const hasFail = updatedSection.bodyFail || (ribsAvailable && updatedSection.ribsFail);
                    let hasPass = false;
                    if (ribsAvailable) {
                        hasPass = updatedSection.bodyPass && updatedSection.ribsPass;
                    } else {
                        hasPass = updatedSection.bodyPass;
                    }

                    if (hasFail) {
                        updatedSection.pass = false;
                        updatedSection.fail = true;
                        updatedSection.status = 'fail';
                    } else if (hasPass) {
                        updatedSection.pass = true;
                        updatedSection.fail = false;
                        updatedSection.status = 'pass';
                    } else {
                        updatedSection.pass = false;
                        updatedSection.fail = false;
                        updatedSection.status = '';
                    }
                }

                return {
                    ...record,
                    additional: { ...prevAdditional, [section]: updatedSection }
                };
            });

            return { ...prev, inspectionRecords };
        });
    };

    const handleReadingInput = (index, section, field, value) => {
        updateSectionData(index, section, field, value);

        if (value.length >= 2) {
            let nextId = '';
            const sectionsList = ['top', 'middle', 'bottom'];
            const curIdx = sectionsList.indexOf(section);

            if (field === 'body' && ribsAvailable) {
                nextId = `body-${index}-${section}-ribs`;
            } else if (curIdx < 2) {
                nextId = `body-${index}-${sectionsList[curIdx + 1]}-body`;
            }

            if (nextId) {
                const el = document.getElementById(nextId);
                if (el) el.focus();
            }
        }
    };

    const handleAdditionalReadingInput = (index, section, field, value) => {
        updateAdditionalSectionData(index, section, field, value);

        if (value.length >= 2) {
            let nextId = '';
            const sectionsList = ['top', 'middle', 'bottom'];
            const curIdx = sectionsList.indexOf(section);

            if (field === 'body' && ribsAvailable) {
                nextId = `add-body-${index}-${section}-ribs`;
            } else if (curIdx < 2) {
                nextId = `add-body-${index}-${sectionsList[curIdx + 1]}-body`;
            }

            if (nextId) {
                const el = document.getElementById(nextId);
                if (el) el.focus();
            }
        }
    };

    const setPassFail = (index, section, isPass) => {
        setFormData(prev => ({
            ...prev,
            inspectionRecords: prev.inspectionRecords.map((record, i) =>
                i === index ? {
                    ...record,
                    [section]: {
                        ...record[section],
                        pass: isPass ? true : false,
                        fail: isPass ? false : true
                    }
                } : record
            )
        }));
    };

    const sectionStatusClass = (sectionState) => {
        if (sectionState.pass) return 'bg-green-50';
        if (sectionState.fail) return 'bg-red-50';
        return '';
    };

    const readingInputClass = (sectionState) => {
        const base = 'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2';
        if (sectionState.pass) return base + ' border-green-400 bg-green-50 focus:ring-green-500';
        if (sectionState.fail) return base + ' border-red-400 bg-red-50 focus:ring-red-500';
        return base + ' border-gray-200 focus:ring-blue-500';
    };

    const removeRecord = (index) => {
        if (formData.inspectionRecords.length > 1) {
            setFormData(prev => ({
                ...prev,
                inspectionRecords: prev.inspectionRecords.filter((_, i) => i !== index)
            }));
        }
    };

    // Image upload handlers
    const handleImageUpload = async (recordIndex, files) => {
        const validFiles = Array.from(files).filter(file => {
            const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
            return isValidType && isValidSize;
        });

        // Convert files to Base64 for database storage
        const imagePromises = validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        preview: reader.result, // Base64 string
                        name: file.name,
                        size: file.size
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        const newImages = await Promise.all(imagePromises);

        setFormData(prev => ({
            ...prev,
            inspectionRecords: prev.inspectionRecords.map((record, i) =>
                i === recordIndex
                    ? { ...record, images: [...(record.images || []), ...newImages] }
                    : record
            )
        }));
    };

    const removeImage = (recordIndex, imageId) => {
        setFormData(prev => ({
            ...prev,
            inspectionRecords: prev.inspectionRecords.map((record, i) => {
                if (i !== recordIndex) return record;

                // Find and revoke the object URL to prevent memory leaks
                const imageToRemove = (record.images || []).find(img => img.id === imageId);
                if (imageToRemove && imageToRemove.preview) {
                    URL.revokeObjectURL(imageToRemove.preview);
                }

                return {
                    ...record,
                    images: (record.images || []).filter(img => img.id !== imageId)
                };
            })
        }));
    };

    const removeAllImages = (recordIndex) => {
        setFormData(prev => ({
            ...prev,
            inspectionRecords: prev.inspectionRecords.map((record, i) => {
                if (i !== recordIndex) return record;

                // Revoke all object URLs
                (record.images || []).forEach(img => {
                    if (img.preview) URL.revokeObjectURL(img.preview);
                });

                return { ...record, images: [] };
            })
        }));
    };


    const validateForm = () => {
        const newErrors = {};
        const isReitmans = (formData.customer || '').toLowerCase() === 'reitmans' || formData.customer === 'Reitmans_Form';

        // if (!orderNoSearch.trim()) newErrors.orderNo = 'Order No / Style is required';
        if (!formData.buyerStyle.trim()) newErrors.buyerStyle = 'Buyer style is required';
        if (!formData.factoryStyleNo.trim()) newErrors.factoryStyleNo = 'Factory style number is required';
        if (!formData.customer.trim()) newErrors.customer = 'Customer is required';
        if (!formData.fabrication.trim()) newErrors.fabrication = 'Fabrication is required';
        if (!formData.colorName?.trim()) newErrors.colorName = 'Color Name is required';

        // Reitmans uses upperCentisimalIndex instead of aquaboySpecBody in its UI, 
        // though they are often mapped to each other
        if (!formData.aquaboySpecBody?.trim() && !isReitmans) {
            newErrors.aquaboySpecBody = 'Aquaboy spec is required';
        } else if (isReitmans && !formData.aquaboySpecBody?.trim() && !formData.upperCentisimalIndex?.trim()) {
            newErrors.aquaboySpecBody = 'Upper Centisimal index is required';
        }

        // Only require dry room times for non-Reitmans flows
        if (!isReitmans) {
            // In New mode (Before Dry Room)
            if (!isAfterDryMode) {
                if (!formData.beforeDryRoomTime || !formData.beforeDryRoomTime.toString().trim()) {
                    newErrors.beforeDryRoomTime = 'Before dry room time is required';
                }
            }
            // In Edit mode (After Dry Room) - only possible if history exists
            else if (checkHistory.length > 0) {
                if (!formData.afterDryRoomTime || !formData.afterDryRoomTime.toString().trim()) {
                    newErrors.afterDryRoomTime = 'After dry room time is required';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditCheck = (index) => {
        if (!checkHistory[index]) return;
        const check = checkHistory[index];
        setEditingCheckIndex(index);

        // Populate form with check data
        setFormData(prev => ({
            ...prev,
            beforeDryRoom: check.beforeDryRoom,
            beforeDryRoomTime: check.beforeDryRoom,
            afterDryRoom: check.afterDryRoom,
            afterDryRoomTime: check.afterDryRoom,
            aquaboySpecBody: check.aquaboySpecBody || check.aquaboySpec || prev.aquaboySpecBody || '',
            aquaboySpecRibs: check.aquaboySpecRibs || prev.aquaboySpecRibs || '',
            date: check.date ? check.date.split('T')[0] : prev.date,
            inspectionRecords: [
                {
                    top: {
                        body: check.topBodyReading,
                        ribs: check.topRibsReading,
                        pass: check.top === 'pass',
                        fail: check.top === 'fail'
                    },
                    middle: {
                        body: check.middleBodyReading,
                        ribs: check.middleRibsReading,
                        pass: check.middle === 'pass',
                        fail: check.middle === 'fail'
                    },
                    bottom: {
                        body: check.bottomBodyReading,
                        ribs: check.bottomRibsReading,
                        pass: check.bottom === 'pass',
                        fail: check.bottom === 'fail'
                    },
                    additional: {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false }
                    },
                    images: check.images || []
                }
            ]
        }));

        // Scroll to form top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingCheckIndex(null);
        setFormData(prev => ({
            ...prev,
            // Reset fields to empty or current default?
            // Ideally should reset to "new entry" state, preserving style info
            beforeDryRoom: '',
            beforeDryRoomTime: '',
            afterDryRoom: '',
            afterDryRoomTime: '',
            date: new Date().toISOString().split('T')[0],
            inspectionRecords: [
                {
                    top: { body: '', ribs: '', pass: false, fail: false },
                    middle: { body: '', ribs: '', pass: false, fail: false },
                    bottom: { body: '', ribs: '', pass: false, fail: false },
                    additional: {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false }
                    },
                    images: []
                }
            ]
        }));
        setIsAfterDryMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[DEBUG] handleSubmit triggered. Current formData:', JSON.stringify(formData, (key, value) => key === 'images' ? `[${value?.length || 0} images]` : value, 2));

        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setIsSaving(true);
        try {
            const isReitmans = (formData.customer || '').toLowerCase() === 'reitmans' || formData.customer === 'Reitmans_Form';

            const payload = {
                ...formData,
                createdBy: user ? { empId: user.emp_id, engName: user.eng_name || user.name || user.username } : null,
                ribsAvailable: ribsAvailable,
                beforeDryRoom: formData.beforeDryRoomTime || formData.beforeDryRoom || '',
                afterDryRoom: formData.afterDryRoomTime || formData.afterDryRoom || '',
                firstCheckDate: firstCheckDate || new Date().toISOString(),
                inspectionRecords: (formData.inspectionRecords || []).map(rec => ({
                    ...rec,
                    beforeDryRoom: rec.beforeDryRoomTime || rec.beforeDryRoom || '',
                    afterDryRoom: rec.afterDryRoomTime || rec.afterDryRoom || '',
                    images: rec.images || [], // Explicitly include images
                    // Add Reitmans fields if customer is Reitmans for history snapshots
                    ...(isReitmans && {
                        timeChecked: formData.timeChecked,
                        moistureRateBeforeDehumidify: formData.moistureRateBeforeDehumidify,
                        noPcChecked: formData.noPcChecked,
                        timeIn: formData.timeIn,
                        timeOut: formData.timeOut,
                        moistureRateAfter: formData.moistureRateAfter,
                        upperCentisimalIndex: formData.upperCentisimalIndex,
                        poLine: formData.poLine,
                        composition: formData.composition
                    })
                }))
            };

            console.log('[DEBUG] Final Payload being sent to /api/humidity-reports:', JSON.stringify(payload, (key, value) => key === 'images' ? `[${value?.length || 0} images]` : value, 2));

            console.log('Saving payload with images:', payload.inspectionRecords[0]?.images?.length || 0, 'images');

            const response = await fetch(`${API_BASE_URL || 'http://localhost:5001'}/api/humidity-reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok && result && result.success) {
                setMessage({ type: 'success', text: 'Report saved successfully!' });

                if (!firstCheckDate) {
                    setFirstCheckDate(new Date().toISOString());
                }
                await fetchCheckHistory(formData.factoryStyleNo);


                try {
                    let savedDoc = (result && (result.data || result.saved || result.doc)) || null;
                    if (!savedDoc) {
                        savedDoc = {
                            ...payload,
                            _id: `temp-${Date.now()}`,
                            createdAt: new Date().toISOString(),
                            date: payload.date || new Date().toISOString()
                        };
                    } else {
                        if (!savedDoc.createdAt) savedDoc.createdAt = savedDoc.date || new Date().toISOString();
                        if (!savedDoc.date) savedDoc.date = savedDoc.createdAt;
                    }
                    window.dispatchEvent(new CustomEvent('humidityReportsUpdated', { detail: savedDoc }));
                } catch (e) {
                    console.error('Error dispatching humidityReportsUpdated event', e);
                }

                setFormData({
                    buyerStyle: '',
                    factoryStyleNo: '',
                    customer: '',
                    fabrication: '',
                    aquaboySpecBody: '',
                    aquaboySpecRibs: '',
                    colorName: '',
                    beforeDryRoom: '',
                    beforeDryRoomTime: '',
                    afterDryRoom: '',
                    afterDryRoomTime: '',
                    date: '',
                    inspectionType: 'Inline',
                    inspectionRecords: [
                        {
                            top: { body: '', ribs: '', pass: false, fail: false },
                            middle: { body: '', ribs: '', pass: false, fail: false },
                            bottom: { body: '', ribs: '', pass: false, fail: false },
                            additional: {
                                top: { body: '', ribs: '', pass: false, fail: false },
                                middle: { body: '', ribs: '', pass: false, fail: false },
                                bottom: { body: '', ribs: '', pass: false, fail: false }
                            },
                            images: []
                        }
                    ],
                    generalRemark: '',
                    // Reitmans fields
                    composition: '',
                    poLine: '',
                    timeChecked: '',
                    moistureRateBeforeDehumidify: '',
                    noPcChecked: '',
                    timeIn: '',
                    timeOut: '',
                    moistureRateAfter: '',
                    upperCentisimalIndex: '',
                    inspectorSignature: '',
                    qamSignature: ''
                });
                setOrderNoSearch('');
                setAvailableColors([]);
                setFabricFiberMatches([]);
                setRibsAvailable(false);
                setIsAfterDryMode(false);
                setAutoFilledFields({ buyerStyle: false, customer: false, fabrication: false });

                // Reset edit state
                setEditingCheckIndex(null);
                setCurrentReportId(null);
            } else {
                const errMsg = (result && result.message) ? result.message : 'Failed to save report';
                setMessage({ type: 'error', text: errMsg });
            }
        } catch (err) {
            console.error('Error saving report:', err);
            setMessage({ type: 'success', text: 'Report saved successfully!' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const isReitmansCustomer = (formData.customer || '').toLowerCase() === 'reitmans';

    // Special case to show Reitmans form within standard layout if triggered from dashboard
    const isReitmansForm = formData.customer === 'Reitmans_Form';
    const displayCustomer = isReitmansForm ? 'Reitmans' : formData.customer;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 sm:p-4 md:p-6 ">
            <div className="max-w-[1500px] mx-auto bg-white rounded-xl shadow-lg">

                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <div className="inline-block font-bold text-gray-800 px-6 py-6 rounded-full text-3xl mb-1">
                            YORKMARS (CAMBODIA) GARMENTS MFG CO.,LTD
                        </div>
                        <h1 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-800 pt-4 md:pt-1 pb-3 md:pb-4 text-center border-b">
                            Humidity Inspection Record
                        </h1>
                        <div className="w-24 h-1 mx-auto rounded"></div>
                    </div>
                </div>

                {/* Tabs bar */}
                <div className="bg-white border-b">
                    <nav className="flex gap-6 px-6 py-3 items-center overflow-auto">
                        {tabs.map(tab => {
                            let icon = null;
                            if (tab === 'Inspection') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
                            } else if (tab === 'Results-size') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
                            } else if (tab === 'Qc-daily-report') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                            } else if (tab === 'Style-view') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                            } else if (tab === 'Buyer-report-size') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
                            } else if (tab === 'Buyer-style-view') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                            } else if (tab === 'Dashboard') {
                                icon = <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
                            }
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative text-sm py-2 px-2 rounded-md ${activeTab === tab ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'}`}
                                >
                                    <span className="inline-flex items-center">
                                        {icon}
                                        <span>{tab}</span>
                                    </span>
                                    {activeTab === tab && <span className="absolute left-2 right-2 -bottom-0.5 h-0.5 bg-blue-500 rounded" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {activeTab !== 'Dashboard' && activeTab !== 'Qc-daily-report' && (
                    isReitmansCustomer ? (
                        <ReitmansForm
                            formData={formData}
                            setFormData={setFormData}
                            updateSectionData={updateSectionData}
                            handleImageUpload={handleImageUpload}
                            removeImage={removeImage}
                            removeRecord={removeRecord}
                            addRecord={addNewRecord}
                            errors={errors}
                            checkHistory={checkHistory}
                            onBack={() => {
                                setFormData(prev => ({ ...prev, customer: '' }));
                                setAutoFilledFields(prev => ({ ...prev, customer: false }));
                            }}
                            onNewInspection={() => {
                                setFormData(prev => ({ ...prev, customer: 'Reitmans_Form' }));
                            }}
                            handleSubmit={handleSubmit}
                            orderNoSearch={orderNoSearch}
                            setOrderNoSearch={setOrderNoSearch}
                            orderNoSuggestions={orderNoSuggestions}
                            showOrderNoDropdown={showOrderNoDropdown}
                            setShowOrderNoDropdown={setShowOrderNoDropdown}
                            isLoadingOrderData={isLoadingOrderData}
                            handleOrderNoSelect={handleOrderNoSelect}
                            availableColors={availableColors}
                        />
                    ) : (<>

                        {/* Inspection Type */}
                        <div className="bg-white p-6 mb-1 border-b ">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Report Type</h2>
                            <div className="flex flex-wrap gap-6">
                                {['Inline'].map(type => (
                                    <label key={type} className="flex items-center cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="inspectionType"
                                            value={type}
                                            checked={formData.inspectionType === type}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, inspectionType: e.target.value }))
                                            }
                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-gray-700 group-hover:text-blue-600 transition-colors font-medium">
                                            {type}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="max-w-[1500px] mx-auto flex flex-col gap-6 ml-6 mr-6 mt-6">
                            <div className="w-full bg-white p-8 rounded-xl shadow-md border border-blue-200">
                                <h2 className="text-2xl font-bold text-blue-600 mb-4">
                                    General Information
                                </h2>

                                {fabricFiberMatches.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700 tracking-tight">Fabric → Fiber Calculations</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {fabricFiberMatches.map((m, idx) => (
                                                <div key={idx} className="p-3 border border-blue-200 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all text-sm">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="font-bold text-slate-700">Fabric:</span>
                                                            <span className="text-slate-600">{m.fabricName} {m.percentageValue !== null ? `(${m.percentageValue})` : ''}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-700">Limit:</span>
                                                            <span className="text-slate-600">{m.matchedFiberLimit ?? 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-3">
                                                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-700">Result:</span>
                                                            <span className="font-mono font-bold text-blue-600 text-base">
                                                                {m.computedValue !== null && m.computedValue !== undefined ? Number(m.computedValue) : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Show calculation formula when possible */}
                                                    {m.computedValue !== null && m.computedValue !== undefined && m.percentageNumber !== undefined && m.matchedFiberLimitNumber !== undefined ? (
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[13px] text-blue-600 font-mono">
                                                            <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span>({m.percentageNumber} × {m.matchedFiberLimitNumber}) ÷ 100 = {Number(m.computedValue)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-slate-400 italic">
                                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {m.matchedFiberName ? (
                                                                <span>Could not compute (missing numeric percentage or limit)</span>
                                                            ) : (
                                                                <span>No matched fiber limit found for this buyer</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-6 border-t border-blue-200 mt-6 pt-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Factory Style No
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative" ref={orderNoDropdownRef}>
                                            <input
                                                type="text"
                                                value={formData.factoryStyleNo || orderNoSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setOrderNoSearch(val);
                                                    setFormData(prev => ({ ...prev, factoryStyleNo: val }));
                                                }}
                                                onFocus={() => {
                                                    if (orderNoSuggestions.length > 0) setShowOrderNoDropdown(true);
                                                }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.factoryStyleNo ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder=""
                                                required
                                                aria-required="true" />

                                            {showOrderNoDropdown && (
                                                <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-auto bg-white border rounded shadow-lg">
                                                    {isLoadingOrderData ? (
                                                        <li className="px-3 py-2 text-sm text-gray-600">Loading...</li>
                                                    ) : orderNoSuggestions.length === 0 ? (
                                                        <li className="px-3 py-2 text-sm text-gray-600">No matches</li>
                                                    ) : (
                                                        orderNoSuggestions.map((ord, idx) => (
                                                            <li
                                                                key={ord._id || idx}
                                                                onClick={() => handleOrderNoSelect(ord.moNo || ord.style || '')}
                                                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                            >
                                                                <div className="font-semibold">{ord.moNo || ord.style}</div>
                                                                {ord.buyer && <div className="text-xs text-gray-500">{ord.buyer} — {ord.product}</div>}
                                                            </li>
                                                        ))
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                        {errors.factoryStyleNo && <p className="text-red-500 text-sm mt-1">{errors.factoryStyleNo}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Buyer Style #
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={formData.buyerStyle}
                                                readOnly={autoFilledFields.buyerStyle}
                                                disabled={!formData.factoryStyleNo}
                                                onChange={(e) => { setAutoFilledFields(prev => ({ ...prev, buyerStyle: false })); setFormData(prev => ({ ...prev, buyerStyle: e.target.value })); }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.buyerStyle ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder=""
                                                required
                                                aria-required="true"
                                            />

                                        </div>
                                        {errors.buyerStyle && <p className="text-red-500 text-sm mt-1">{errors.buyerStyle}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Customer
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={displayCustomer}
                                                readOnly={autoFilledFields.customer || isReitmansForm}
                                                disabled={!formData.factoryStyleNo}
                                                onChange={(e) => { setAutoFilledFields(prev => ({ ...prev, customer: false })); setFormData(prev => ({ ...prev, customer: e.target.value })); }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.customer ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder=""
                                                required
                                                aria-required="true"
                                            />
                                        </div>
                                        {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fabrication
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={formData.fabrication}
                                                readOnly={autoFilledFields.fabrication}
                                                disabled={!formData.factoryStyleNo}
                                                onChange={(e) => { setAutoFilledFields(prev => ({ ...prev, fabrication: false })); setFormData(prev => ({ ...prev, fabrication: e.target.value })); }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.fabrication ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder=""
                                                required
                                                aria-required="true"
                                            />
                                        </div>
                                        {errors.fabrication && <p className="text-red-500 text-sm mt-1">{errors.fabrication}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color Name
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        {availableColors.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={formData.colorName}
                                                    onChange={(e) => {
                                                        const color = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            colorName: color,
                                                            inspectionRecords: prev.inspectionRecords.map(record => ({
                                                                ...record,
                                                                colorName: color
                                                            }))
                                                        }));
                                                    }}
                                                    className={`w-full px-4 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none ${errors.colorName ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    required
                                                    aria-required="true"
                                                    disabled={!formData.factoryStyleNo}
                                                    style={{ backgroundPosition: 'right 0.75rem center' }}>
                                                    <option value="" disabled>Select Color</option>
                                                    {availableColors.map((color, idx) => (
                                                        <option key={idx} value={color}>{color}</option>
                                                    ))}
                                                </select>
                                                {/* Chevron-down icon absolute right, less forward/less protruding */}
                                                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pl-2">
                                                    <svg
                                                        className="w-4 h-4 text-gray-700"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </span>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.colorName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.colorName ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder=""
                                                required
                                                aria-required="true"
                                                disabled={!formData.factoryStyleNo}
                                            />
                                        )}
                                        {errors.colorName && <p className="text-red-500 text-sm mt-1">{errors.colorName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {ribsAvailable ? 'Aquaboy Reading Spec (Body)' : 'Aquaboy Reading Spec'}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <label className="sr-only">Aquaboy Reading Spec (Body)</label>
                                            <div className={`w-full rounded-lg p-1 border ${errors.aquaboySpecBody ? 'border-blue-300 bg-red-50' : 'border-blue-200 bg-gradient-to-r from-blue-50/60 to-white'} shadow-inner`}>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.aquaboySpecBody}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, aquaboySpecBody: e.target.value }))}
                                                        className={`w-full px-4 py-1 bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${errors.aquaboySpecBody ? 'text-blue-700' : 'text-blue-900'}`}
                                                        placeholder=""
                                                        required
                                                        aria-required="true"
                                                        disabled={true}
                                                    />
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 text-sm">% RH</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {errors.aquaboySpecBody && <p className="text-red-500 text-sm mt-1">{errors.aquaboySpecBody}</p>}
                                        </div>
                                    </div>

                                    {/* After Dry Mode Toggle (only if history exists) */}
                                    {/* {checkHistory.length > 0 && (formData.inspectionType === 'Inline' || ['Pre-Final', 'Final'].includes(formData.inspectionType)) && (
                                        <div className="flex items-center gap-2 mb-4 col-span-3">
                                            <label className="relative inline-flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isAfterDryMode}
                                                    onChange={(e) => setIsAfterDryMode(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <div className="ml-3 flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                        Edit Mode
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        Enable to input After Dry Room results
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    )} */}

                                    {/* Before Dry Room - Visible if not in After Dry mode */}
                                    {(checkHistory.length === 0 || !isAfterDryMode) && (formData.inspectionType === 'Inline' || ['Pre-Final', 'Final'].includes(formData.inspectionType)) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Before Dry Room
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div>
                                                <input
                                                    type="time"
                                                    value={formData.beforeDryRoomTime || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, beforeDryRoomTime: e.target.value }))}
                                                    onFocus={() => setDefaultBeforeDryRoomTimeIfEmpty()}
                                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.beforeDryRoomTime ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    required
                                                    aria-required="true"
                                                />
                                                {errors.beforeDryRoomTime && <p className="text-red-500 text-sm mt-1">{errors.beforeDryRoomTime}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* After Dry Room - Visible ONLY if Edit mode is on AND history exists */}
                                    {checkHistory.length > 0 && isAfterDryMode && (formData.inspectionType === 'Inline' || ['Pre-Final', 'Final'].includes(formData.inspectionType)) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                After Dry Room
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div>
                                                <input
                                                    type="time"
                                                    value={formData.afterDryRoomTime || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, afterDryRoomTime: e.target.value }))}
                                                    onFocus={() => setDefaultAfterDryRoomTimeIfEmpty()}
                                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.afterDryRoomTime ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    required={true}
                                                    aria-required={true}
                                                />
                                                {errors.afterDryRoomTime && <p className="text-red-500 text-sm mt-1">{errors.afterDryRoomTime}</p>}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date || (() => {
                                                const now = new Date();
                                                const yyyy = now.getFullYear();
                                                const mm = String(now.getMonth() + 1).padStart(2, '0');
                                                const dd = String(now.getDate()).padStart(2, '0');
                                                return `${yyyy}-${mm}-${dd}`;
                                            })()}
                                            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                        />
                                    </div>
                                    {ribsAvailable && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Aquaboy Reading Spec (Ribs)
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="relative">
                                                <label className="sr-only">Aquaboy Reading Spec (Ribs)</label>
                                                <div className={`w-full rounded-lg p-1 border ${errors.aquaboySpecRibs ? 'border-blue-300 bg-red-50' : 'border-blue-200 bg-gradient-to-r from-blue-50/60 to-white'} shadow-inner`}>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={formData.aquaboySpecRibs}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, aquaboySpecRibs: e.target.value }))}
                                                            className={`w-full px-4 py-1 bg-transparent rounded-md focus:ring-blue-300 transition-colors ${errors.aquaboySpecRibs ? 'text-blue-700' : 'text-blue-900'}`}
                                                            placeholder=""
                                                            required
                                                            aria-required="true"
                                                            disabled={!formData.factoryStyleNo}
                                                        />
                                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-400 text-sm">% RH</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {errors.aquaboySpecRibs && <p className="text-red-500 text-sm mt-1">{errors.aquaboySpecRibs}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full bg-blue-50 p-8 mb-6 mt-6 rounded-xl shadow-md border border-blue-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-blue-600 mb-1">Inspection Records</h2>
                                        </div>
                                        <button
                                            onClick={addNewRecord}
                                            disabled={!formData.factoryStyleNo}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow-md 
                                                ${formData.factoryStyleNo
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Add New Record
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        {formData.inspectionRecords.map((record, index) => (
                                            <div
                                                key={index}
                                                className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-100">
                                                <div className="flex justify-between items-center mb-4 w-full">
                                                    <h3 className="font-bold text-gray-700 text-xl text-center">
                                                        Aquaboy Reading
                                                    </h3>
                                                    {formData.inspectionRecords.length > 1 && (
                                                        <button
                                                            onClick={() => removeRecord(index)}
                                                            className="text-red-600 hover:text-red-900 ml-2 text-2xl"
                                                            title="Remove record">
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Sections: Top / Middle / Bottom */}
                                                {['top', 'middle', 'bottom'].map(section => (
                                                    <div
                                                        key={section}
                                                        className="rounded-lg bg-white p-3 w-full">
                                                        <h4 className="font-bold capitalize text-gray-700 text-base text-start mb-1">
                                                            {section}
                                                        </h4>

                                                        {/* Make each row a single column full width */}
                                                        <div className="flex flex-col md:flex-row gap-4 w-full items-center">
                                                            {/* Body Reading + Status */}
                                                            <div className="flex flex-1 items-center gap-2 w-full">
                                                                <div className="flex-1">
                                                                    <input
                                                                        id={`body-${index}-${section}-body`}
                                                                        type="number"
                                                                        value={record[section].body}
                                                                        onChange={(e) => handleReadingInput(index, section, 'body', e.target.value)}
                                                                        placeholder="Body"
                                                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                                                        disabled={!formData.factoryStyleNo}
                                                                    />
                                                                </div>
                                                                {record[section].bodyPass ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Pass
                                                                    </span>
                                                                ) : record[section].bodyFail ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        Fail
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs px-2 italic">N/A</span>
                                                                )}
                                                            </div>

                                                            {ribsAvailable ? (
                                                                <div className="flex flex-1 items-center gap-2 w-full">
                                                                    <div className="flex-1">
                                                                        <input
                                                                            id={`body-${index}-${section}-ribs`}
                                                                            type="number"
                                                                            value={record[section].ribs}
                                                                            onChange={(e) => handleReadingInput(index, section, 'ribs', e.target.value)}
                                                                            placeholder="Ribs"
                                                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                                                            disabled={!formData.factoryStyleNo}
                                                                        />
                                                                    </div>
                                                                    {record[section].ribsPass ? (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            Pass
                                                                        </span>
                                                                    ) : record[section].ribsFail ? (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                            Fail
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-xs px-2 italic">N/A</span>
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Image Upload Section */}
                                                <div className="w-full mt-6 border-t pt-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            Inspection Photos
                                                        </h4>

                                                        {record.images && record.images.length > 0 && (
                                                            <button
                                                                onClick={() => removeAllImages(index)}
                                                                className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-red-50 transition-all duration-200"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Clear All
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Upload Zone */}
                                                    <div
                                                        onDragOver={(e) => {
                                                            if (!formData.factoryStyleNo) return;
                                                            e.preventDefault();
                                                            e.currentTarget.classList.add('border-blue-500', 'bg-blue-50/50');
                                                        }}
                                                        onDragLeave={(e) => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                                        }}
                                                        onDrop={(e) => {
                                                            if (!formData.factoryStyleNo) return;
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                                            handleImageUpload(index, e.dataTransfer.files);
                                                        }}
                                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${formData.factoryStyleNo
                                                            ? 'border-slate-200 bg-slate-50/30 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer group shadow-sm'
                                                            : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                                                            }`}
                                                        onClick={() => {
                                                            if (formData.factoryStyleNo) {
                                                                document.getElementById(`image-upload-${index}`).click();
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            id={`image-upload-${index}`}
                                                            type="file"
                                                            multiple
                                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                                            onChange={(e) => handleImageUpload(index, e.target.files)}
                                                            className="hidden"
                                                            disabled={!formData.factoryStyleNo}
                                                        />
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className={`w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-all duration-500 ${formData.factoryStyleNo ? 'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:border-blue-100' : ''
                                                                }`}>
                                                                <svg className={`w-10 h-10 ${formData.factoryStyleNo ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {formData.factoryStyleNo ? (
                                                                    <>
                                                                        <p className="text-lg font-bold text-slate-800">
                                                                            Click or drag to upload
                                                                        </p>
                                                                        <p className="text-sm text-slate-500">
                                                                            High-res photos accepted (Max 5MB per file)
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-lg font-bold text-slate-400">
                                                                            Selection Required
                                                                        </p>
                                                                        <p className="text-sm text-slate-300">
                                                                            Choose Style No to enable upload
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Image Preview Grid */}
                                                    {record.images && record.images.length > 0 && (
                                                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                            {record.images.map((image) => (
                                                                <div
                                                                    key={image.id}
                                                                    className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 bg-white"
                                                                >
                                                                    <img
                                                                        src={image.preview}
                                                                        alt={image.name}
                                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                    />

                                                                    {/* Enhanced Overlay */}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                                                        <div className="flex justify-end">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeImage(index, image.id);
                                                                                }}
                                                                                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-red-500 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 border border-white/30"
                                                                                title="Remove image"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        window.open(image.preview, '_blank');
                                                                                    }}
                                                                                    className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-600 scale-90 hover:scale-100"
                                                                                >
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-[10px] text-white/90 font-medium truncate bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
                                                                                {image.name}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(formData.inspectionType === 'Pre-Final' || formData.inspectionType === 'Final') && (
                                        <div className="bg-white p-8 flex flex-col">
                                            {formData.inspectionRecords.map((record, recIdx) => (
                                                <div key={`additional-card-${recIdx}`} className="w-full border border-gray-200 rounded-2xl shadow-sm p-6 bg-white mb-6">
                                                    <div className="flex justify-between items-center mb-6 w-full">
                                                        <h3 className="font-bold text-gray-700 text-xl text-center">Additional Readings — Record {recIdx + 1}</h3>
                                                    </div>
                                                    <div className="space-y-6 ">
                                                        {['top', 'middle', 'bottom'].map(addSec => (
                                                            <div key={addSec} className="w-full">
                                                                <h4 className="font-bold capitalize text-gray-700 text-base text-start mb-1">{addSec}</h4>
                                                                <div className="flex flex-col md:flex-row gap-4 w-full items-center">
                                                                    {/* Body Reading + Status */}
                                                                    <div className="flex flex-1 items-center gap-2 w-full">
                                                                        <div className="flex-1">
                                                                            <input
                                                                                id={`add-body-${recIdx}-${addSec}-body`}
                                                                                type="number"
                                                                                value={record.additional?.[addSec]?.body || ''}
                                                                                onChange={(e) => handleAdditionalReadingInput(recIdx, addSec, 'body', e.target.value)}
                                                                                placeholder="Body"
                                                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                                                                disabled={!formData.factoryStyleNo}
                                                                            />
                                                                        </div>
                                                                        {record.additional?.[addSec]?.bodyPass ? (
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                                Pass
                                                                            </span>
                                                                        ) : record.additional?.[addSec]?.bodyFail ? (
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                                Fail
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400 text-xs px-2 italic">N/A</span>
                                                                        )}
                                                                    </div>

                                                                    {ribsAvailable ? (
                                                                        <div className="flex flex-1 items-center gap-2 w-full">
                                                                            <div className="flex-1">
                                                                                <input
                                                                                    id={`add-body-${recIdx}-${addSec}-ribs`}
                                                                                    type="number"
                                                                                    value={record.additional?.[addSec]?.ribs || ''}
                                                                                    onChange={(e) => handleAdditionalReadingInput(recIdx, addSec, 'ribs', e.target.value)}
                                                                                    placeholder="Ribs"
                                                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                                                                    disabled={!formData.factoryStyleNo}
                                                                                />
                                                                            </div>
                                                                            {record.additional?.[addSec]?.ribsPass ? (
                                                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs whitespace-nowrap">
                                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                    Pass
                                                                                </span>
                                                                            ) : record.additional?.[addSec]?.ribsFail ? (
                                                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-500 font-semibold text-xs whitespace-nowrap">
                                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                    </svg>
                                                                                    Fail
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-xs px-2 italic">N/A</span>
                                                                            )}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* General Remark */}
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                        <div className="w-2 h-1 rounded"></div>
                                        Remark
                                    </h2>
                                    <textarea
                                        value={formData.generalRemark}
                                        onChange={(e) => setFormData(prev => ({ ...prev, generalRemark: e.target.value }))}
                                        rows={4}
                                        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3"
                                        placeholder="Enter general remarks here..."
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="px-6 py-3 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-lg h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Submit
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>
                    </>))}

                {activeTab === 'Qc-daily-report' && (
                    <div className="p-6">
                        <ExportPanel />
                    </div>
                )}
                {activeTab === 'Dashboard' && (
                    <div className="p-6">
                        <Dashboard />
                    </div>
                )}
                {message.text && (
                    <div
                        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-5 ${message.type === "success"
                                ? "text-emerald-900 bg-white/95 border-emerald-100 ring-8 ring-emerald-500/5"
                                : "text-rose-900 bg-white/95 border-rose-100 ring-8 ring-rose-500/5"
                            }`}
                        role="alert"
                    >
                        <div className="relative">
                            {message.type === "success" ? (
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-bounce-slow">
                                    <CheckCircle2 size={24} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                    <AlertCircle size={24} strokeWidth={3} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col min-w-0 pr-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">
                                Notification
                            </span>
                            <div className="text-sm font-black tracking-tight leading-tight">
                                {message.text}
                            </div>
                        </div>

                        <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-colors shrink-0 ${message.type === "success"
                                    ? "text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                                    : "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                }`}
                            onClick={() => setMessage({ type: "", text: "" })}
                            aria-label="Close"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>

                        {/* Tiny Progress Bar */}
                        <div
                            className={`absolute bottom-0 left-0 h-1 rounded-full opacity-30 ${message.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                            style={{
                                width: "100%",
                                animation: "shrink-width 3s linear forwards",
                            }}
                        ></div>
                    </div>
                )}

                <style>{`
                    @keyframes shrink-width {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 2s infinite;
                    }
                    @keyframes bounce-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                `}</style>
            </div>
        </div>
    )
}

export default FormPage;