import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../../config';

export default function UpdateModel({ open, onCancel, report, onUpdate }) {
    const [formData, setFormData] = useState({
        buyerStyle: '',
        factoryStyleNo: '',
        customer: '',
        fabrication: '',
        aquaboySpec: '',
        colorName: '',
        beforeDryRoom: '',
        beforeDryRoomTime: '',
        afterDryRoom: '',
        afterDryRoomTime: '',
        date: '',
        inspectionType: 'Inline',
        inspectionRecords: [],
        generalRemark: '',
        inspectorSignature: '',
        qamSignature: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [expandedRecordIndex, setExpandedRecordIndex] = useState(0);
    const [availableColors, setAvailableColors] = useState([]);

    const ribsAvailable = true; // Assume true for edit or derive from data

    useEffect(() => {
        if (open && report) {
            const sourceRecords = (report.inspectionRecords && report.inspectionRecords.length > 0)
                ? report.inspectionRecords
                : (report.history && report.history.length > 0 ? report.history : []);

            const safeRecords = sourceRecords.map(rec => {
                const processSection = (sec) => ({
                    body: sec?.body || '',
                    ribs: sec?.ribs || '',
                    pass: sec?.pass === true || sec?.status === 'pass',
                    fail: sec?.fail === true || sec?.status === 'fail'
                });

                return {
                    ...rec,
                    top: processSection(rec.top),
                    middle: processSection(rec.middle),
                    bottom: processSection(rec.bottom),
                    additional: rec.additional ? {
                        top: processSection(rec.additional.top),
                        middle: processSection(rec.additional.middle),
                        bottom: processSection(rec.additional.bottom)
                    } : {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false }
                    },
                    images: rec.images || []
                };
            });

            if (safeRecords.length === 0) {
                safeRecords.push({
                    top: { body: '', ribs: '', pass: false, fail: false },
                    middle: { body: '', ribs: '', pass: false, fail: false },
                    bottom: { body: '', ribs: '', pass: false, fail: false },
                    additional: {
                        top: { body: '', ribs: '', pass: false, fail: false },
                        middle: { body: '', ribs: '', pass: false, fail: false },
                        bottom: { body: '', ribs: '', pass: false, fail: false }
                    },
                    images: []
                });
            }

            // Format beforeDryRoomTime from createdAt if available
            let initialBeforeTime = '';
            if (report.createdAt) {
                const date = new Date(report.createdAt);
                initialBeforeTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            }

            // Format date from createdAt if available
            let initialDate = '';
            if (report.createdAt) {
                const dateObj = new Date(report.createdAt);
                initialDate = dateObj.toISOString().split('T')[0];
            }

            setFormData({
                buyerStyle: report.buyerStyle || '',
                factoryStyleNo: report.factoryStyleNo || '',
                customer: report.customer || '',
                fabrication: report.fabrication || '',
                aquaboySpec: report.aquaboySpec || '',
                colorName: report.colorName || '',
                beforeDryRoom: report.beforeDryRoom || '',
                beforeDryRoomTime: initialBeforeTime,
                afterDryRoom: report.afterDryRoom || '',
                afterDryRoomTime: '', // Always start empty as requested
                date: initialDate,
                inspectionType: report.inspectionType || 'Inline',
                inspectionRecords: safeRecords,
                generalRemark: report.generalRemark || '',
                inspectorSignature: report.inspectorSignature || '',
                qamSignature: report.qamSignature || ''
            });
            setExpandedRecordIndex(safeRecords.length > 0 ? safeRecords.length - 1 : 0);
        }
    }, [open, report]);

    // Fetch available colors when factoryStyleNo changes or on load
    useEffect(() => {
        const fetchColors = async () => {
            if (open && formData.factoryStyleNo) {
                try {
                    const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : 'http://localhost:5001';
                    const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
                    const res = await fetch(`${prefix}/api/yorksys-orders/${encodeURIComponent(formData.factoryStyleNo)}`);
                    const json = await res.json();
                    const order = json && json.data ? json.data : (json || null);

                    if (order) {
                        const colors = [];
                        if (Array.isArray(order.SKUData)) colors.push(...order.SKUData.map(s => s.Color).filter(Boolean));
                        if (Array.isArray(order.OrderQtyByCountry)) {
                            order.OrderQtyByCountry.forEach(c => {
                                if (Array.isArray(c.ColorQty)) c.ColorQty.forEach(col => col.ColorName && colors.push(col.ColorName));
                            });
                        }
                        const uniqueColors = [...new Set(colors)];
                        setAvailableColors(uniqueColors);
                    }
                } catch (err) {
                    console.error('Error fetching colors:', err);
                }
            }
        };
        fetchColors();
    }, [open, formData.factoryStyleNo]);

    const updateSectionData = (recordIndex, section, field, value) => {
        setFormData(prev => {
            const newRecords = [...prev.inspectionRecords];
            if (!newRecords[recordIndex]) return prev;

            const updatedRecord = { ...newRecords[recordIndex] };
            updatedRecord[section] = {
                ...updatedRecord[section],
                [field]: value
            };

            // Auto-grading logic
            const specNum = Number(prev.aquaboySpec);

            // Try to parse numeric readings from body and ribs (allow strings like "51")
            const parseNumber = (v) => {
                if (v === undefined || v === null) return NaN;
                const s = String(v).trim();
                if (s === '') return NaN;
                const cleaned = s.replace(/[^0-9.\-]/g, '');
                if (cleaned.length < 1) return NaN;
                const n = Number(cleaned);
                return Number.isFinite(n) ? n : NaN;
            };

            const bodyStr = String(updatedRecord[section].body || '').trim();
            const ribsStr = String(updatedRecord[section].ribs || '').trim();

            const bodyVal = parseNumber(bodyStr);
            const ribsVal = parseNumber(ribsStr);

            let reading = NaN;
            if (!Number.isNaN(bodyVal) && bodyStr.length >= 2) reading = bodyVal;
            if (!Number.isNaN(ribsVal) && ribsStr.length >= 2) {
                reading = Number.isNaN(reading) ? ribsVal : Math.max(reading, ribsVal);
            }

            if (!Number.isNaN(reading) && !Number.isNaN(specNum)) {
                if (reading <= specNum) {
                    updatedRecord[section].pass = true;
                    updatedRecord[section].fail = false;
                } else {
                    updatedRecord[section].pass = false;
                    updatedRecord[section].fail = true;
                }
            } else {
                updatedRecord[section].pass = false;
                updatedRecord[section].fail = false;
            }

            newRecords[recordIndex] = updatedRecord;
            return { ...prev, inspectionRecords: newRecords };
        });
    };

    const setPassFail = (recordIndex, section, isPass) => {
        setFormData(prev => {
            const newRecords = [...prev.inspectionRecords];
            newRecords[recordIndex][section].pass = isPass;
            newRecords[recordIndex][section].fail = !isPass;
            return { ...prev, inspectionRecords: newRecords };
        });
    };

    const updateAdditionalSectionData = (recordIndex, section, field, value) => {
        setFormData(prev => {
            const newRecords = [...prev.inspectionRecords];
            if (!newRecords[recordIndex].additional) {
                newRecords[recordIndex].additional = {
                    top: { body: '', ribs: '', pass: false, fail: false },
                    middle: { body: '', ribs: '', pass: false, fail: false },
                    bottom: { body: '', ribs: '', pass: false, fail: false }
                };
            }
            newRecords[recordIndex].additional[section] = {
                ...newRecords[recordIndex].additional[section],
                [field]: value
            };

            // Auto-grading logic for additional readings
            const specNum = Number(prev.aquaboySpec);

            const parseNumber = (v) => {
                if (v === undefined || v === null) return NaN;
                const s = String(v).trim();
                if (s === '') return NaN;
                const cleaned = s.replace(/[^0-9.\-]/g, '');
                if (cleaned.length < 1) return NaN;
                const n = Number(cleaned);
                return Number.isFinite(n) ? n : NaN;
            };

            const bodyStr = String(newRecords[recordIndex].additional[section].body || '').trim();
            const ribsStr = String(newRecords[recordIndex].additional[section].ribs || '').trim();

            const bodyVal = parseNumber(bodyStr);
            const ribsVal = parseNumber(ribsStr);

            let reading = NaN;
            if (!Number.isNaN(bodyVal) && bodyStr.length >= 2) reading = bodyVal;
            if (!Number.isNaN(ribsVal) && ribsStr.length >= 2) {
                reading = Number.isNaN(reading) ? ribsVal : Math.max(reading, ribsVal);
            }

            if (!Number.isNaN(reading) && !Number.isNaN(specNum)) {
                if (reading <= specNum) {
                    newRecords[recordIndex].additional[section].pass = true;
                    newRecords[recordIndex].additional[section].fail = false;
                } else {
                    newRecords[recordIndex].additional[section].pass = false;
                    newRecords[recordIndex].additional[section].fail = true;
                }
            } else {
                newRecords[recordIndex].additional[section].pass = false;
                newRecords[recordIndex].additional[section].fail = false;
            }

            return { ...prev, inspectionRecords: newRecords };
        });
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

        setFormData(prev => {
            const newRecords = [...prev.inspectionRecords];
            if (!newRecords[recordIndex]) return prev;

            const currentImages = newRecords[recordIndex].images || [];
            newRecords[recordIndex] = {
                ...newRecords[recordIndex],
                images: [...currentImages, ...newImages]
            };
            return { ...prev, inspectionRecords: newRecords };
        });
    };

    const removeImage = (recordIndex, imageId) => {
        setFormData(prev => {
            const newRecords = [...prev.inspectionRecords];
            if (!newRecords[recordIndex]) return prev;

            const currentImages = newRecords[recordIndex].images || [];
            newRecords[recordIndex] = {
                ...newRecords[recordIndex],
                images: currentImages.filter(img => img.id !== imageId)
            };
            return { ...prev, inspectionRecords: newRecords };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const base = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : 'http://localhost:5001';
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

            // Form validation
            if (!formData.afterDryRoomTime) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'After Dry Room Time is required.'
                });
                setIsSaving(false);
                return;
            }

            // Map inspectionRecords to history format for the backend
            const currentEditRecords = formData.inspectionRecords.map(rec => ({
                top: {
                    body: rec.top.body,
                    ribs: rec.top.ribs,
                    status: rec.top.pass ? 'pass' : (rec.top.fail ? 'fail' : '')
                },
                middle: {
                    body: rec.middle.body,
                    ribs: rec.middle.ribs,
                    status: rec.middle.pass ? 'pass' : (rec.middle.fail ? 'fail' : '')
                },
                bottom: {
                    body: rec.bottom.body,
                    ribs: rec.bottom.ribs,
                    status: rec.bottom.pass ? 'pass' : (rec.bottom.fail ? 'fail' : '')
                },
                additional: rec.additional ? {
                    top: {
                        body: rec.additional.top?.body || '',
                        ribs: rec.additional.top?.ribs || '',
                        status: rec.additional.top?.pass ? 'pass' : (rec.additional.top?.fail ? 'fail' : '')
                    },
                    middle: {
                        body: rec.additional.middle?.body || '',
                        ribs: rec.additional.middle?.ribs || '',
                        status: rec.additional.middle?.pass ? 'pass' : (rec.additional.middle?.fail ? 'fail' : '')
                    },
                    bottom: {
                        body: rec.additional.bottom?.body || '',
                        ribs: rec.additional.bottom?.ribs || '',
                        status: rec.additional.bottom?.pass ? 'pass' : (rec.additional.bottom?.fail ? 'fail' : '')
                    }
                } : undefined,
                images: rec.images || [],
                date: formData.date || rec.date,
                beforeDryRoom: formData.beforeDryRoomTime || formData.beforeDryRoom || rec.beforeDryRoomTime || rec.beforeDryRoom || '',
                afterDryRoom: formData.afterDryRoomTime || formData.afterDryRoom || rec.afterDryRoomTime || rec.afterDryRoom || '',
                generalRemark: formData.generalRemark || rec.remark || ''
            }));

            const previousHistory = report.history || [];
            const lastEditedRecord = currentEditRecords[currentEditRecords.length - 1];
            const newHistory = [...previousHistory, lastEditedRecord];

            const payload = {
                ...formData,
                history: newHistory,
                inspectionRecords: [lastEditedRecord]
            };

            const response = await fetch(`${prefix}/api/humidity-reports/${report._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Report updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
                onUpdate();
                onCancel();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to update report'
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error updating report'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 transition-opacity">
            <style>{`
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden"
                style={{ animation: 'modalPop 0.3s ease-out' }}
            >
                <div className="p-6 border-b flex justify-between items-center bg-white z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-blue-500">Edit Inspection Record</h2>
                    </div>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="update-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Meta Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Factory Style No</label>
                                <input
                                    type="text"
                                    value={formData.factoryStyleNo}
                                    onChange={e => setFormData({ ...formData, factoryStyleNo: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Buyer Style</label>
                                <input
                                    type="text"
                                    value={formData.buyerStyle}
                                    onChange={e => setFormData({ ...formData, buyerStyle: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Customer</label>
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={e => setFormData({ ...formData, customer: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fabrication</label>
                                <input
                                    type="text"
                                    value={formData.fabrication}
                                    onChange={e => setFormData({ ...formData, fabrication: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Color Name</label>
                                {availableColors.length > 0 ? (
                                    <select
                                        value={formData.colorName}
                                        onChange={e => setFormData({ ...formData, colorName: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                                    >
                                        <option value="">Select Color</option>
                                        {availableColors.map((color, idx) => (
                                            <option key={idx} value={color}>{color}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.colorName}
                                        onChange={e => setFormData({ ...formData, colorName: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        placeholder="Enter color name"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Aquaboy Reading Spec</label>
                                <input
                                    type="text"
                                    value={formData.aquaboySpec}
                                    onChange={e => setFormData({ ...formData, aquaboySpec: e.target.value })}
                                    readOnly
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Before Dry Room Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    value={formData.beforeDryRoomTime}
                                    onChange={e => setFormData({ ...formData, beforeDryRoomTime: e.target.value })}
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">After Dry Room Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    value={formData.afterDryRoomTime}
                                    onChange={e => setFormData({ ...formData, afterDryRoomTime: e.target.value })}
                                    onClick={() => {
                                        if (!formData.afterDryRoomTime) {
                                            const now = new Date();
                                            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                            setFormData(prev => ({ ...prev, afterDryRoomTime: timeString }));
                                        }
                                    }}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    disabled
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Inspection Records */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Readings</h3>
                            <div className="space-y-4">
                                {formData.inspectionRecords.map((record, index) => {
                                    if (index !== formData.inspectionRecords.length - 1) return null;
                                    const isExpanded = index === expandedRecordIndex;
                                    const isPassed = record.top.pass && record.middle.pass && record.bottom.pass;

                                    return (
                                        <div key={index} className={`border rounded-lg p-4 ${isPassed ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                            <div
                                                className="flex justify-between items-center cursor-pointer mb-2"
                                                onClick={() => setExpandedRecordIndex(index)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-700">Record #{index + 1}</h4>
                                                </div>
                                                <span className="text-sm text-gray-500">{isExpanded ? 'Collapse' : 'Expand'}</span>
                                            </div>

                                            {isExpanded && (
                                                <div className="space-y-4">
                                                    {['top', 'middle', 'bottom'].map(section => (
                                                        <div key={section} className="flex flex-col md:flex-row gap-4 items-center p-3 rounded shadow-sm bg-white">
                                                            <div className="w-20 font-semibold capitalize">{section}</div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Body"
                                                                    value={record[section].body}
                                                                    onChange={e => updateSectionData(index, section, 'body', e.target.value)}
                                                                    className="px-3 w-full border rounded p-1"
                                                                />
                                                            </div>
                                                            {ribsAvailable && (
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Ribs"
                                                                        value={record[section].ribs}
                                                                        onChange={e => updateSectionData(index, section, 'ribs', e.target.value)}
                                                                        className="px-3 w-full border rounded p-1"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                {!record[section].fail && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPassFail(index, section, true)}
                                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold transition-colors ${record[section].pass
                                                                            ? 'bg-green-100 text-green-600'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                            }`}
                                                                    >
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Pass
                                                                    </button>
                                                                )}
                                                                {!record[section].pass && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPassFail(index, section, false)}
                                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold transition-colors ${record[section].fail
                                                                            ? 'bg-red-100 text-red-500'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                            }`}
                                                                    >
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        Fail
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Image Upload for this record */}
                                            <div className="mt-4 border-t pt-4">
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Inspection Photos</h5>
                                                <div className="space-y-3">
                                                    <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none hover:bg-gray-50">
                                                        <span className="flex items-center space-x-2">
                                                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="font-medium text-gray-600">
                                                                Click to upload images
                                                            </span>
                                                        </span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            multiple
                                                            accept="image/png,image/jpeg,image/webp"
                                                            onChange={(e) => handleImageUpload(index, e.target.files)}
                                                        />
                                                    </label>

                                                    {record.images && record.images.length > 0 && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                                            {record.images.map((img, imgIdx) => (
                                                                <div key={img.id || imgIdx} className="relative group aspect-square">
                                                                    <img
                                                                        src={img.preview}
                                                                        alt={img.name}
                                                                        className="h-full w-full object-cover rounded-lg shadow-sm border border-gray-200"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeImage(index, img.id)}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                                        title="Remove image"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Additional Readings if applicable */}
                        {(formData.inspectionType === 'Pre-Final' || formData.inspectionType === 'Final') && (
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Readings</h3>
                                {formData.inspectionRecords.map((record, index) => {
                                    if (index !== formData.inspectionRecords.length - 1) return null;
                                    const isPassed = record.top.pass && record.middle.pass && record.bottom.pass;
                                    return (
                                        <div key={`add-${index}`} className={`mb-4 p-4 rounded border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold">Record #{index + 1} Additional</h4>
                                            </div>
                                            {['top', 'middle', 'bottom'].map(section => (
                                                <div key={section} className="flex gap-4 mb-2 items-center">
                                                    <span className="w-16 capitalize text-sm font-medium">{section}</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Body"
                                                        value={record.additional?.[section]?.body || ''}
                                                        onChange={e => updateAdditionalSectionData(index, section, 'body', e.target.value)}
                                                        className="border rounded p-1 w-24"
                                                    />
                                                    {ribsAvailable && (
                                                        <input
                                                            type="number"
                                                            placeholder="Ribs"
                                                            value={record.additional?.[section]?.ribs || ''}
                                                            onChange={e => updateAdditionalSectionData(index, section, 'ribs', e.target.value)}
                                                            className="border rounded p-1 w-24"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* General Remark */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">General Remark</label>
                            <textarea
                                value={formData.generalRemark}
                                onChange={e => setFormData({ ...formData, generalRemark: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm border p-3 min-h-[100px] focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter any general remarks here..."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 z-10 shrink-0">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="update-form"
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Update Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}
