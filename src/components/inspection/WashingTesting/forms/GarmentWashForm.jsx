import React, { useState, useEffect, useRef } from "react";
import { Upload, Camera, X, Send, RotateCw, Plus, Trash2, Calendar, CheckCircle2, XCircle, Check } from "lucide-react";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";

/**
 * Garment Wash Report Form Component
 * 
 * Detailed form for Garment Wash Testing including:
 * - Style & Material Info
 * - Color Fastness (Change & Staining)
 * - Visual Assessment
 * - Flat Measurements (Shrinkage)
 */
const GarmentWashForm = ({
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    isCompleting,
    // Data Props
    season,
    styleDescription,
    // Images
    handleFileInputChange,
    handleCameraInputChange,
    triggerFileInput,
    triggerCameraInput,
    handleRemoveImage,
    fileInputRef,
    cameraInputRef,

    // Additional data props for auto-population
    searchOrderNo,
    handleOrderNoSelect,
    orderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    availableColors,
    showColorDropdown,
    setShowColorDropdown,
    fabrication,
    custStyle,
    fetchYorksysOrderETD
}) => {

    const colorDropdownRef = useRef(null);
    const styleFetchTimerRef = useRef(null);
    const careLabelFileInputRef = useRef(null);
    const careLabelCameraInputRef = useRef(null);
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [keypadTarget, setKeypadTarget] = useState({ field: '', index: null, key: '' });
    const [tempValue, setTempValue] = useState('');

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (styleFetchTimerRef.current) {
                clearTimeout(styleFetchTimerRef.current);
            }
        };
    }, []);

    // Click outside handler for Color Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showColorDropdown &&
                colorDropdownRef.current &&
                !colorDropdownRef.current.contains(event.target)) {

                if (setShowColorDropdown) {
                    setShowColorDropdown(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showColorDropdown, setShowColorDropdown]);

    // Initialize defaults if missing or empty strings
    useEffect(() => {
        if (!formData.colorFastnessRows || formData.colorFastnessRows.length === 0) {
            handleInputChange('colorFastnessRows', [
                { fabricType: 'JERSEY', color: '', colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' },
                { fabricType: 'RIB', color: '', colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' }
            ]);
        } else {
            // If rows exist but passFail is empty, fix it
            const updatedRows = formData.colorFastnessRows.map(row => ({
                ...row,
                passFail: row.passFail || 'PASS'
            }));
            if (JSON.stringify(updatedRows) !== JSON.stringify(formData.colorFastnessRows)) {
                handleInputChange('colorFastnessRows', updatedRows);
            }
        }

        if (!formData.colorStainingRows || formData.colorStainingRows.length === 0) {
            handleInputChange('colorStainingRows', [
                { fabricType: 'JERSEY', color: '', colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' },
                { fabricType: 'RIB', color: '', colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' }
            ]);
        } else {
            const updatedRows = formData.colorStainingRows.map(row => ({
                ...row,
                passFail: row.passFail || 'PASS'
            }));
            if (JSON.stringify(updatedRows) !== JSON.stringify(formData.colorStainingRows)) {
                handleInputChange('colorStainingRows', updatedRows);
            }
        }

        if (!formData.shrinkageRows) {
            handleInputChange('shrinkageRows', [
                { location: 'CHEST', original: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' },
                { location: 'BOTTOM', original: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' },
                { location: 'SLV LENGTH (L)', original: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' },
                { location: 'SLV LENGTH (R)', original: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' },
                { location: 'FRT BODY LENGTH', original: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' },
            ]);
        }

        if (!formData.visualAssessmentRows) {
            handleInputChange('visualAssessmentRows', [
                { item: 'General Outlook', accepted: true, rejected: false, comments: '' },
                { item: 'Seams', accepted: true, rejected: false, comments: '' },
                { item: 'Embroidery', accepted: true, rejected: false, comments: '' },
                { item: 'H.Transfer', accepted: true, rejected: false, comments: '' },
                { item: 'Printing', accepted: true, rejected: false, comments: '' },
                { item: 'Trimmings / Accessories', accepted: true, rejected: false, comments: '' },
                { item: 'Others / Care label', accepted: true, rejected: false, comments: '' },
            ]);
        }
    }, [formData.reportType]);

    // Synchronization effects for derived metadata
    // These ensure that data fetched by the hook correctly enters the form's local state
    useEffect(() => {
        if (season && season !== '' && (!formData.season || formData.season === '')) {
            handleInputChange('season', season);
        }
    }, [season, formData.season]);

    useEffect(() => {
        if (styleDescription && styleDescription !== '' && (!formData.styleDescription || formData.styleDescription === '')) {
            handleInputChange('styleDescription', styleDescription);
        }
    }, [styleDescription, formData.styleDescription]);

    useEffect(() => {
        if (fabrication && fabrication !== '' && (!formData.mainFabric || formData.mainFabric === '')) {
            handleInputChange('mainFabric', fabrication);
        }
    }, [fabrication, formData.mainFabric]);

    useEffect(() => {
        if (custStyle && custStyle !== '' && (!formData.custStyle || formData.custStyle === '')) {
            handleInputChange('custStyle', custStyle);
        }
    }, [custStyle, formData.custStyle]);

    // Auto-populate Colors when available
    useEffect(() => {
        if (availableColors && availableColors.length > 0 && (!formData.color || formData.color.length === 0)) {
            handleInputChange('color', [...availableColors]);
        }
    }, [availableColors, formData.color]);

    // Auto-update table rows color when header color changes
    useEffect(() => {
        const headerColor = Array.isArray(formData.color) ? formData.color.join(', ') : (formData.color || '');
        if (headerColor !== '') {
            // Update Color Fastness Rows if color is empty
            const updatedFastness = (formData.colorFastnessRows || []).map(row => ({
                ...row,
                color: row.color && row.color !== '' ? row.color : headerColor
            }));

            // Update Color Staining Rows if color is empty
            const updatedStaining = (formData.colorStainingRows || []).map(row => ({
                ...row,
                color: row.color && row.color !== '' ? row.color : headerColor
            }));

            if (JSON.stringify(updatedFastness) !== JSON.stringify(formData.colorFastnessRows)) {
                handleInputChange('colorFastnessRows', updatedFastness);
            }
            if (JSON.stringify(updatedStaining) !== JSON.stringify(formData.colorStainingRows)) {
                handleInputChange('colorStainingRows', updatedStaining);
            }
        }
    }, [formData.color]);

    const handleCareLabelImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const currentImages = Array.isArray(formData.careLabelImage) ? formData.careLabelImage : (formData.careLabelImage ? [formData.careLabelImage] : []);
            handleInputChange('careLabelImage', [...currentImages, ...files]);
        }
        // Reset input so it triggers again for the same file if needed
        e.target.value = "";
    };

    const handleRemoveCareLabelImage = (index) => {
        const currentImages = Array.isArray(formData.careLabelImage) ? [...formData.careLabelImage] : (formData.careLabelImage ? [formData.careLabelImage] : []);
        currentImages.splice(index, 1);
        handleInputChange('careLabelImage', currentImages);
    };

    // Parsing utility for fractions (e.g., "10 1/2" -> 10.5)
    const parseFraction = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;

        const stringVal = val.toString().trim();
        if (!stringVal) return 0;

        // Handle case like "42 1/2"
        const parts = stringVal.split(/\s+/);
        if (parts.length === 2) {
            const integer = parseFloat(parts[0]) || 0;
            const fractionParts = parts[1].split('/');
            if (fractionParts.length === 2) {
                return integer + (parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]));
            }
            return integer;
        }

        // Handle case like "1/2"
        if (stringVal.includes('/')) {
            const fractionParts = stringVal.split('/');
            if (fractionParts.length === 2) {
                return parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
            }
        }

        return parseFloat(stringVal) || 0;
    };

    // Helper to update a specific row in a table (array of objects)
    const updateRow = (field, index, key, value) => {
        const rows = [...(formData[field] || [])];
        if (!rows[index]) return; // Safety check
        rows[index] = { ...rows[index], [key]: value };

        // Auto-calculate Shrinkage % if updating measurement rows
        if (field === 'shrinkageRows' && (key === 'beforeWash' || key === 'afterWash')) {
            const beforeVal = key === 'beforeWash' ? value : rows[index].beforeWash;
            const afterVal = key === 'afterWash' ? value : rows[index].afterWash;

            const before = parseFraction(beforeVal);
            const after = parseFraction(afterVal);

            if (before !== 0 && beforeVal !== '' && afterVal !== '') {
                const shrinkage = ((after - before) / before) * 100;
                rows[index].shrinkage = shrinkage.toFixed(2) + '%';

                // Get requirement threshold (default 5% if not specified)
                let req = 5;
                const reqStr = rows[index].requirement || '';
                const match = reqStr.match(/(\d+)/);
                if (match) req = parseInt(match[1]);

                // Auto-update Pass/Fail status
                if (Math.abs(shrinkage) <= req) {
                    rows[index].passFail = 'PASS';
                } else {
                    rows[index].passFail = 'FAIL';
                }
            } else {
                rows[index].shrinkage = '';
                // Don't reset passFail if user manually toggled it, but if both blank, reset
                if (beforeVal === '' && afterVal === '') {
                    rows[index].passFail = 'PASS'; // Default to PASS as requested earlier
                }
            }
        }

        handleInputChange(field, rows);
    };

    // Helper to add a new row to Color Fastness tables
    const addRow = (field) => {
        const rows = [...(formData[field] || [])];
        const headerColor = Array.isArray(formData.color) ? formData.color.join(', ') : (formData.color || '');
        const newRow = field === 'colorFastnessRows'
            ? { fabricType: '', color: headerColor, colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' }
            : { fabricType: '', color: headerColor, colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' };

        handleInputChange(field, [...rows, newRow]);
    };

    // Helper to open keypad
    const openKeypad = (field, index, key, currentVal) => {
        setKeypadTarget({ field, index, key });
        setTempValue(currentVal?.toString() || '');
        setKeypadOpen(true);
    };

    const handleKeypadSubmit = (value) => {
        updateRow(keypadTarget.field, keypadTarget.index, keypadTarget.key, value);
        setKeypadOpen(false);
    };

    // Fraction Keypad Component
    const FractionKeypad = ({ isOpen, onClose, initialValue, onConfirm }) => {
        const [inputValue, setInputValue] = useState(initialValue || '');
        const [integerPart, setIntegerPart] = useState(0);
        const [fractionPart, setFractionPart] = useState('');
        const [isNegative, setIsNegative] = useState(false);

        const fractions = [
            '1/16', '1/8', '3/16', '1/4',
            '5/16', '3/8', '7/16', '1/2',
            '9/16', '5/8', '11/16', '3/4',
            '13/16', '7/8', '15/16', '-1'
        ];

        const getCurrentValue = () => {
            const sign = isNegative ? '-' : '';
            const intStr = integerPart === 0 ? '' : `${integerPart} `;
            const fracStr = fractionPart || '';
            const result = `${sign}${intStr}${fracStr}`.trim();
            return result || '0';
        };

        if (!isOpen) return null;

        const handleNumClick = (num) => {
            setInputValue(prev => {
                const parts = prev.split(' ');
                if (parts.length === 0 || parts[0] === '') return num.toString();
                if (!prev.includes('/') && !isNaN(parts[0])) return parts[0] + num.toString();
                return prev + num.toString();
            });
        };

        const handleFractionClick = (frac) => {
            if (frac === '0') {
                setInputValue('0');
                return;
            }
            setInputValue(prev => {
                const parts = prev.trim().split(/\s+/);
                // If there's an integer part, add fraction with space
                if (parts.length === 1 && !parts[0].includes('/') && parts[0] !== '') {
                    return `${parts[0]} ${frac}`;
                }
                return frac;
            });
        };

        const handleBackspace = () => {
            setInputValue(prev => prev.slice(0, -1).trim());
        };

        const toggleSign = () => {
            setInputValue(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header/Controls */}
                    <div className="p-4 border-b dark:border-gray-700 grid grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-700/50">
                        <button
                            onClick={() => setIsNegative(true)}
                            className={`h-10 rounded-lg font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all ${isNegative ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            <span className="text-2xl leading-none">−</span>
                        </button>
                        <button
                            onClick={() => setIsNegative(false)}
                            className={`h-10 rounded-lg font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all ${!isNegative ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                            <span className="text-2xl leading-none">+</span>
                        </button>
                        <div className="h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-700 group relative">
                            <span className="text-xs font-bold text-gray-400 mr-1">N:</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                {isNegative && integerPart !== 0 ? '-' : ''}{integerPart}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-10 rounded-lg bg-red-500 text-white font-bold flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Keypad Grid */}
                    <div className="p-4 grid grid-cols-4 gap-2">
                        {fractions.map(f => (
                            <button
                                key={f}
                                onClick={() => {
                                    if (f === '-1') {
                                        setIntegerPart(prev => prev - 1);
                                    } else {
                                        setFractionPart(f);
                                    }
                                }}
                                className="h-14 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium transition-all flex flex-col items-center justify-center dark:text-white shadow-sm active:scale-95"
                            >
                                {f.includes('/') ? (
                                    <>
                                        <span className="text-[14px] font-black leading-tight text-gray-800 dark:text-white">
                                            {isNegative ? '-' : ''}{f.split('/')[0]}
                                        </span>
                                        <div className="w-6 h-[2px] bg-gray-400 dark:bg-gray-500 my-0.5"></div>
                                        <span className="text-[14px] font-black leading-tight text-gray-800 dark:text-white">{f.split('/')[1]}</span>
                                    </>
                                ) : (
                                    <span className="text-lg font-black text-gray-800 dark:text-white">{f}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Result / Confirm Button */}
                    <div className="p-4 pt-0">
                        <button
                            onClick={() => onConfirm(getCurrentValue())}
                            className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-2xl shadow-lg shadow-green-200 dark:shadow-none transition-all transform active:scale-95"
                        >
                            {getCurrentValue()}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Helper to remove a row
    const removeRow = (field, index) => {
        const rows = [...(formData[field] || [])];
        rows.splice(index, 1);
        handleInputChange(field, rows);
    };

    // Helper for visual assessment toggle
    const toggleVisualAssessment = (index, type) => {
        const rows = [...(formData.visualAssessmentRows || [])];
        if (type === 'accepted') {
            rows[index].accepted = true;
            rows[index].rejected = false;
        } else {
            rows[index].rejected = true;
            rows[index].accepted = false;
        }
        handleInputChange('visualAssessmentRows', rows);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2">
                GARMENT WASH TEST REPORT
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* STYLE Input - Matching HomeWashForm UI */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">STYLE :</label>
                        <input
                            type="text"
                            value={formData.style || ''}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                handleInputChange("style", newValue);
                            }}
                            onFocus={() => {
                                if (formData.style && formData.style.length >= 2 && searchOrderNo) {
                                    searchOrderNo(formData.style);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    if (setShowOrderNoSuggestions) setShowOrderNoSuggestions(false);
                                }, 200);
                            }}
                            onKeyUp={(e) => {
                                if (e.target.value.length >= 2 && searchOrderNo) {
                                    searchOrderNo(e.target.value);
                                }
                            }}
                            onKeyDown={(e) => {
                                // Add Enter key support for quick selection of first suggestion
                                if (e.key === 'Enter' && showOrderNoSuggestions && orderNoSuggestions?.length > 0) {
                                    e.preventDefault();
                                    const firstValidSuggestion = orderNoSuggestions.filter(on => on !== formData.style)[0];
                                    if (firstValidSuggestion) {
                                        if (handleOrderNoSelect) handleOrderNoSelect(firstValidSuggestion);
                                    }
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                            placeholder="Search from Yorksys"
                        />
                        {/* Loading Indicator */}
                        {isSearchingOrderNo && (
                            <div className="absolute right-3 top-9 text-gray-400">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        {/* Suggestions Dropdown - Filtered to exclude exact matches */}
                        {showOrderNoSuggestions && orderNoSuggestions &&
                            orderNoSuggestions.filter(on => on !== formData.style).length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {orderNoSuggestions
                                        .filter(orderNo => orderNo !== formData.style)
                                        .map((orderNo, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (handleOrderNoSelect) handleOrderNoSelect(orderNo);
                                                }}
                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                            >
                                                {orderNo}
                                            </div>
                                        ))}
                                </div>
                            )}
                    </div>

                    {/* CUST. STYLE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CUST STYLE :
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                        </label>
                        <input placeholder="Auto-filled Cust" type="text" value={formData.custStyle || ''} onChange={(e) => handleInputChange("custStyle", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white cursor-not-allowed" required readOnly />
                    </div>

                    {/* COLOR Dropdown - Matching HomeWashForm UI */}
                    <div className="relative color-dropdown-container" ref={colorDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">COLOR :
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColorDropdown && setShowColorDropdown(!showColorDropdown)}
                                disabled={isSearchingOrderNo || !formData.style || (availableColors && availableColors.length === 0)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="truncate">
                                    {isSearchingOrderNo
                                        ? "Loading colors..."
                                        : !formData.style
                                            ? "Select Style first"
                                            : (!availableColors || availableColors.length === 0)
                                                ? "No colors available"
                                                : (!formData.color || formData.color.length === 0)
                                                    ? "Select Color(s)"
                                                    : (Array.isArray(formData.color) && formData.color.length === availableColors.length && availableColors.length > 1)
                                                        ? "All colors selected"
                                                        : (Array.isArray(formData.color) && formData.color.length === 1)
                                                            ? formData.color[0]
                                                            : Array.isArray(formData.color)
                                                                ? `${formData.color.length} color(s) selected`
                                                                : formData.color /* fallback if string */}
                                </span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showColorDropdown && availableColors && availableColors.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleInputChange("color", [...availableColors]);
                                            }}
                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleInputChange("color", []);
                                            }}
                                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="p-2">
                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Available Colors:
                                        </div>
                                        <div className="space-y-1">
                                            {availableColors.map((color, index) => {
                                                // Handle potential string vs array state. 
                                                // If formData.color is string (legacy), treat as single item array or safely check
                                                const isSelected = Array.isArray(formData.color)
                                                    ? formData.color.includes(color)
                                                    : formData.color === color;

                                                return (
                                                    <label
                                                        key={index}
                                                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                let newColors = Array.isArray(formData.color) ? [...formData.color] : (formData.color ? [formData.color] : []);

                                                                if (e.target.checked) {
                                                                    if (!newColors.includes(color)) {
                                                                        newColors.push(color);
                                                                    }
                                                                } else {
                                                                    newColors = newColors.filter((c) => c !== color);
                                                                }
                                                                handleInputChange("color", newColors);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                                            {color}
                                                        </span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* SEASON - Auto-filled from API */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SEASON :
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.season || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-md  dark:bg-blue-900/20 text-gray-800 dark:text-gray-200 cursor-not-allowed"
                            placeholder="Auto-filled Season"
                        />
                    </div>

                    {/* STYLE DESCRIPTION - Auto-filled from API */}
                    <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            STYLE DESCRIPTION :
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                        </label>
                        <textarea
                            value={formData.styleDescription || ''}
                            readOnly
                            rows={1}
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-md dark:bg-blue-900/20 text-gray-800 dark:text-gray-200 cursor-not-allowed resize-none"
                            placeholder="Auto-filled Style Description"
                        />
                    </div>
                </div>

                {/* 2. Material Info */}
                <div className="bg-yellow-50 dark:bg-gray-700/30 p-4 rounded-md border border-yellow-200 dark:border-gray-600">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-3">Material Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MAIN FABRIC :</label>
                            <input type="text" value={formData.mainFabric || ''} onChange={(e) => handleInputChange("mainFabric", e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LINING/INSERTS :</label>
                            <input type="text" value={formData.liningInserts || ''} onChange={(e) => handleInputChange("liningInserts", e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DETERGENT :</label>
                            <input type="text" value={formData.detergent || ''} onChange={(e) => handleInputChange("detergent", e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Washing Method :</label>
                            <textarea value={formData.washingMethod || ''} onChange={(e) => handleInputChange("washingMethod", e.target.value)}
                                rows={2} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-vertical" required />
                        </div>
                    </div>
                </div>

                {/* 2.5 Care Label Info */}
                <div className="bg-blue-50 dark:bg-gray-700/30 p-4 rounded-md border border-blue-200 dark:border-gray-600 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                            <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Care Label Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Care Label Image Upload */}
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-blue-100 dark:border-gray-600 shadow-sm">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                CARE LABEL PHOTO :
                            </label>

                            <div className="space-y-4">
                                {/* 1. Image Gallery area (Appears above buttons) */}
                                {(Array.isArray(formData.careLabelImage) && formData.careLabelImage.length > 0) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {formData.careLabelImage.map((img, index) => (
                                            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-blue-100 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900 transition-all hover:shadow-md hover:border-blue-300">
                                                <img
                                                    src={img instanceof File ? URL.createObjectURL(img) : img}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    alt={`Care Label ${index + 1}`}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 uppercase">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCareLabelImage(index)}
                                                        className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-110 flex items-center gap-1 text-[10px] font-bold px-3"
                                                        title="Remove Image"
                                                    >
                                                        <X size={14} /> Remove
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[10px] text-white font-medium">
                                                    LABEL {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 2. Action Area (Always stays at bottom) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => careLabelCameraInputRef.current?.click()}
                                        className="relative py-4 border-2 border-dashed border-blue-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center bg-blue-50/20 dark:bg-gray-800/40 hover:bg-blue-50/50 dark:hover:bg-gray-800/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all group overflow-hidden"
                                    >
                                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-full mb-1 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
                                            <Camera size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 tracking-tight">CAPTURE PHOTO</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => careLabelFileInputRef.current?.click()}
                                        className="relative py-4 border-2 border-dashed border-indigo-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center bg-indigo-50/20 dark:bg-gray-800/40 hover:bg-indigo-50/50 dark:hover:bg-gray-800/20 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group overflow-hidden"
                                    >
                                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-full mb-1 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
                                            <Upload size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 tracking-tight">UPLOAD FILES</span>
                                    </button>
                                </div>
                            </div>

                            <input
                                ref={careLabelFileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleCareLabelImageChange}
                            />
                            <input
                                ref={careLabelCameraInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleCareLabelImageChange}
                            />
                        </div>

                        {/* Care Label Notes */}
                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                CARE LABEL NOTES / INSTRUCTIONS :
                            </label>
                            <textarea
                                value={formData.careLabelNotes || ''}
                                onChange={(e) => handleInputChange("careLabelNotes", e.target.value)}
                                rows={8}
                                className="flex-1 w-full px-4 py-3 border border-blue-100 dark:border-gray-600 rounded-lg dark:bg-gray-800/50 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                                placeholder="Enter specific care instructions (e.g., Wash 30°C, Do not bleach, Tumble dry low, etc.)..."
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Color Fastness Table (Change) */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800 dark:text-white">Color Fastness to Washing (Color Change)</h3>
                        <button type="button" onClick={() => addRow('colorFastnessRows')} className="text-blue-600 text-sm flex items-center hover:underline"><Plus size={16} className="mr-1" /> Add Row</button>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
                                <tr>
                                    <th className="p-2 border">FABRIC (BODY/LINING)</th>
                                    <th className="p-2 border">COLOR</th>
                                    <th className="p-2 border">COLOR CHANGE</th>
                                    <th className="p-2 border">RATING AFTER</th>
                                    <th className="p-2 border">REQUIREMENT</th>
                                    <th className="p-2 border text-center w-16">PASS</th>
                                    <th className="p-2 border text-center w-16">FAIL</th>
                                    <th className="p-2 border w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.colorFastnessRows || []).map((row, index) => (
                                    <tr key={index} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-2 border"><input type="text" value={row.fabricType} onChange={(e) => updateRow('colorFastnessRows', index, 'fabricType', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0" /></td>
                                        <td className="p-2 border"><input type="text" value={row.color} onChange={(e) => updateRow('colorFastnessRows', index, 'color', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0" /></td>
                                        <td className="p-2 border"><input type="text" value={row.colorChange} onChange={(e) => updateRow('colorFastnessRows', index, 'colorChange', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border"><input type="text" value={row.ratingAfterWash} onChange={(e) => updateRow('colorFastnessRows', index, 'ratingAfterWash', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border"><input type="text" value={row.requirement} onChange={(e) => updateRow('colorFastnessRows', index, 'requirement', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('colorFastnessRows', index, 'passFail', 'PASS')}
                                                className={`transition-all duration-300 ${row.passFail === 'PASS' ? 'text-green-600 scale-125' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <Check size={20} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('colorFastnessRows', index, 'passFail', 'FAIL')}
                                                className={`transition-all duration-300 ${row.passFail === 'FAIL' ? 'text-red-600 scale-125' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <X size={20} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button type="button" onClick={() => removeRow('colorFastnessRows', index)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Color Staining Table */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800 dark:text-white">Color Fastness to Washing (Color Staining)</h3>
                        <button type="button" onClick={() => addRow('colorStainingRows')} className="text-blue-600 text-sm flex items-center hover:underline"><Plus size={16} className="mr-1" /> Add Row</button>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
                                <tr>
                                    <th className="p-2 border">FABRIC (BODY/LINING)</th>
                                    <th className="p-2 border">COLOR</th>
                                    <th className="p-2 border">COLOR STAINING</th>
                                    <th className="p-2 border">RATING AFTER</th>
                                    <th className="p-2 border">REQUIREMENT</th>
                                    <th className="p-2 border text-center w-16">PASS</th>
                                    <th className="p-2 border text-center w-16">FAIL</th>
                                    <th className="p-2 border w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.colorStainingRows || []).map((row, index) => (
                                    <tr key={index} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-2 border"><input type="text" value={row.fabricType} onChange={(e) => updateRow('colorStainingRows', index, 'fabricType', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0" /></td>
                                        <td className="p-2 border"><input type="text" value={row.color} onChange={(e) => updateRow('colorStainingRows', index, 'color', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0" /></td>
                                        <td className="p-2 border"><input type="text" value={row.colorStaining} onChange={(e) => updateRow('colorStainingRows', index, 'colorStaining', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border"><input type="text" value={row.ratingAfterWash} onChange={(e) => updateRow('colorStainingRows', index, 'ratingAfterWash', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border"><input type="text" value={row.requirement} onChange={(e) => updateRow('colorStainingRows', index, 'requirement', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-center" /></td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('colorStainingRows', index, 'passFail', 'PASS')}
                                                className={`transition-all duration-300 ${row.passFail === 'PASS' ? 'text-green-600 scale-125' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <Check size={20} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('colorStainingRows', index, 'passFail', 'FAIL')}
                                                className={`transition-all duration-300 ${row.passFail === 'FAIL' ? 'text-red-600 scale-125' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <X size={20} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button type="button" onClick={() => removeRow('colorStainingRows', index)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div >

                {/* 5. Visual Assessment */}
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">Visual Assessment of the garment after washing</h3>
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
                                <tr>
                                    <th className="p-2 border">Appearance After Washing</th>
                                    <th className="p-2 border w-24 text-center">Accepted</th>
                                    <th className="p-2 border w-24 text-center">Rejected</th>
                                    <th className="p-2 border">Comments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.visualAssessmentRows || []).map((row, index) => (
                                    <tr key={index} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-2 border font-medium">
                                            {row.item}
                                            {/* Allow editing item name if needed? For now static from initialData */}
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleVisualAssessment(index, 'accepted')}
                                                className={`transition-all duration-300 ${row.accepted ? 'text-green-600 scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <Check size={28} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleVisualAssessment(index, 'rejected')}
                                                className={`transition-all duration-300 ${row.rejected ? 'text-red-600 scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-gray-400'}`}
                                            >
                                                <X size={28} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border">
                                            <input type="text" value={row.comments} onChange={(e) => updateRow('visualAssessmentRows', index, 'comments', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0" placeholder="Comment..." />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 6. Flat Measurements (Shrinkage) */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-gray-800 dark:text-white">Flat Measurements & Shrinkage</h3>

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Test Size</span>
                                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                                <select
                                    value={formData.sampleSize || ''}
                                    onChange={(e) => handleInputChange('sampleSize', e.target.value)}
                                    className="bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer pr-1 min-w-[3rem]"
                                >
                                    <option value="">Select</option>
                                    {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'LT', 'XLT', '2XLT'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold">
                                <tr>
                                    <th className="p-2 border">Measurement Point</th>
                                    <th className="p-2 border w-24">Order</th>
                                    <th className="p-2 border w-24">Before</th>
                                    <th className="p-2 border w-24">After</th>
                                    <th className="p-2 border w-40 text-center">Shrinkage %</th>
                                    <th className="p-2 border w-24 text-center">Requirement</th>
                                    <th className="p-2 border text-center w-20">PASS</th>
                                    <th className="p-2 border text-center w-20">FAIL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.shrinkageRows || []).map((row, index) => (
                                    <tr key={index} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-2 border font-medium bg-gray-50/50 dark:bg-gray-800/20">
                                            {row.location}
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="text"
                                                value={row.original}
                                                onClick={() => openKeypad('shrinkageRows', index, 'original', row.original)}
                                                readOnly
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 placeholder-gray-300"
                                                placeholder="..."
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="text"
                                                value={row.beforeWash}
                                                onClick={() => openKeypad('shrinkageRows', index, 'beforeWash', row.beforeWash)}
                                                readOnly
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 placeholder-gray-300 font-bold"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="text"
                                                value={row.afterWash}
                                                onClick={() => openKeypad('shrinkageRows', index, 'afterWash', row.afterWash)}
                                                readOnly
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 placeholder-gray-300 font-bold"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="p-2 border text-center">
                                            {row.shrinkage ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.passFail === 'FAIL' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {row.shrinkage}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-%</span>
                                            )}
                                        </td>
                                        <td className="p-2 border text-center">
                                            <span className="text-gray-500 font-medium">{row.requirement}</span>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('shrinkageRows', index, 'passFail', 'PASS')}
                                                className={`transition-all duration-300 ${row.passFail === 'PASS' ? 'text-green-600 scale-125' : 'text-gray-100 hover:text-gray-200'}`}
                                            >
                                                <Check size={24} strokeWidth={4} />
                                            </button>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button
                                                type="button"
                                                onClick={() => updateRow('shrinkageRows', index, 'passFail', 'FAIL')}
                                                className={`transition-all duration-300 ${row.passFail === 'FAIL' ? 'text-red-600 scale-125' : 'text-gray-100 hover:text-gray-200'}`}
                                            >
                                                <X size={24} strokeWidth={4} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 7. Comments Sections */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 border-b pb-1">BEFORE WASH COMMENTS:</label>
                        <textarea value={formData.beforeWashComments || ''} onChange={(e) => handleInputChange("beforeWashComments", e.target.value)}
                            rows={2} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-vertical" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 border-b pb-1">AFTER WASH COMMENTS:</label>
                        <textarea value={formData.afterWashComments || ''} onChange={(e) => handleInputChange("afterWashComments", e.target.value)}
                            rows={3} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-vertical" />
                    </div>
                </div>

                {/* 8. Footer / Approval */}
                <div className="border-t pt-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">

                        {/* Final Result */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Final Results</label>
                            <div className="flex space-x-2">
                                <button type="button" onClick={() => handleInputChange('finalResult', 'Accepted')}
                                    className={`flex-1 py-2 px-3 rounded-md border flex items-center justify-center gap-2 font-bold ${formData.finalResult === 'Accepted' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <CheckCircle2 size={18} /> Accepted
                                </button>
                                <button type="button" onClick={() => handleInputChange('finalResult', 'Rejected')}
                                    className={`flex-1 py-2 px-3 rounded-md border flex items-center justify-center gap-2 font-bold ${formData.finalResult === 'Rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <XCircle size={18} /> Rejected
                                </button>
                            </div>
                        </div>

                        {/* Checked By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CHECKED BY :</label>
                            <input type="text" value={formData.checkedBy || ''} onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Name" />
                        </div>

                        {/* Approved By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">APPROVED BY :</label>
                            <input type="text" value={formData.approvedBy || ''} onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Name" />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DATE :</label>
                            <div className="relative group ant-datepicker-container">
                                <AntDatePicker
                                    value={formData.date ? dayjs(formData.date) : null}
                                    onChange={(date, dateString) => handleInputChange("date", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
                                    format="MM/DD/YYYY"
                                    className="w-full h-[42px] border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Images & Notes */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium mb-3">Images & Additional Notes</h3>

                    {/* Image Upload UI (Similar to other forms) */}
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <button type="button" onClick={triggerCameraInput} disabled={formData.images?.length >= 5} className="flex items-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50">
                                <Camera size={18} className="mr-2" /> Capture
                            </button>
                            <button type="button" onClick={triggerFileInput} disabled={formData.images?.length >= 5} className="flex items-center px-4 py-2 border rounded-md bg-white hover:bg-gray-50">
                                <Upload size={18} className="mr-2" /> Upload
                            </button>
                        </div>
                        {/* Hidden Inputs */}
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFileInputChange} />
                        <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleCameraInputChange} />

                        {/* Previews */}
                        <div className="mt-4 flex flex-wrap gap-4">
                            {(formData.images || []).map((file, idx) => (
                                <div key={idx} className="relative w-32 h-32 border rounded-md overflow-hidden group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Completion Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isCompleting ? "Completion Notes" : "Notes"}
                        </label>
                        <textarea
                            value={isCompleting ? (formData.completionNotes || "") : (formData.notes || "")}
                            onChange={(e) => handleInputChange(isCompleting ? "completionNotes" : "notes", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder={isCompleting ? "Add completion notes..." : "Add any additional notes..."}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isSubmitting ? "Submitting..." : isCompleting ? "Complete Garment Wash Report" : "Submit Garment Wash Report"}
                    </button>
                </div>
            </form>

            <FractionKeypad
                isOpen={keypadOpen}
                onClose={() => setKeypadOpen(false)}
                initialValue={tempValue}
                onConfirm={handleKeypadSubmit}
            />
        </div>
    );
};

export default GarmentWashForm;
