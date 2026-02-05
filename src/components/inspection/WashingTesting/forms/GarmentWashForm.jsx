import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Upload, Camera, X, Send, RotateCw, Plus, Trash2, Calendar, CheckCircle2, XCircle, Check, Hash, Maximize2, Save, Edit } from "lucide-react";
import { DatePicker, Select } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../../../config";
import CareSymbolsSelector from "./CareSymbolsSelector";

/**
 * Garment Wash Report Form Component
 * 
 * Detailed form for Garment Wash Testing including:
 * - Style & Material Info
 * - Color Fastness (Change & Staining)
 * - Visual Assessment
 * - Flat Measurements (Shrinkage)
 */

const decimalToFractionString = (decimal) => {
    if (decimal === null || decimal === undefined || isNaN(decimal)) return " ";
    if (decimal === 0) return "0";

    const sign = decimal < 0 ? "-" : "+";
    const absDecimal = Math.abs(decimal);

    const fractions = [
        { v: 0.0625, f: "1/16" },
        { v: 0.125, f: "1/8" },
        { v: 0.1875, f: "3/16" },
        { v: 0.25, f: "1/4" },
        { v: 0.3125, f: "5/16" },
        { v: 0.375, f: "3/8" },
        { v: 0.4375, f: "7/16" },
        { v: 0.5, f: "1/2" },
        { v: 0.5625, f: "9/16" },
        { v: 0.625, f: "5/8" },
        { v: 0.6875, f: "11/16" },
        { v: 0.75, f: "3/4" },
        { v: 0.8125, f: "13/16" },
        { v: 0.875, f: "7/8" },
        { v: 0.9375, f: "15/16" }
    ];

    const tolerance = 0.01;
    const closest = fractions.find(
        (fr) => Math.abs(absDecimal - fr.v) < tolerance
    );

    if (closest) {
        return `${sign}${closest.f}`;
    }

    return `${sign}${absDecimal.toFixed(3)}`;
};

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
    availableSizes,
    fetchYorksysOrderETD,
    // ANF Specs
    anfSpecs,
    isLoadingSpecs,
    fetchAnfSpecs
}) => {

    const colorDropdownRef = useRef(null);
    const sizeDropdownRef = useRef(null);
    const styleFetchTimerRef = useRef(null);
    const careLabelFileInputRef = useRef(null);
    const careLabelCameraInputRef = useRef(null);
    const prevAvailableColorsRef = useRef([]);
    const prevSizeRef = useRef(formData.sampleSize);
    const [keypadOpen, setKeypadOpen] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const [keypadTarget, setKeypadTarget] = useState({ field: '', index: null, key: '' });
    const [tempValue, setTempValue] = useState('');
    const [showSizeComparisonModal, setShowSizeComparisonModal] = useState(false);

    // Added for Enhanced Header and specific page functionality
    const [showAll, setShowAll] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isShrinkageSaved, setIsShrinkageSaved] = useState(false);

    // Users State
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Measurement specs state (same as MeasurementDetailsSection)
    const [measurementSpecs, setMeasurementSpecs] = useState({
        beforeWash: [],
        afterWash: [],
        beforeWashGrouped: {},
        afterWashGrouped: {}
    });
    const [isLoadingMeasurementSpecs, setIsLoadingMeasurementSpecs] = useState(false);

    // Derived states for Locking Logic
    const hasBeforeWashSpecs = measurementSpecs.beforeWash && measurementSpecs.beforeWash.length > 0;
    const hasAfterWashSpecs = measurementSpecs.afterWash && measurementSpecs.afterWash.length > 0;
    const isWashTypeLocked = hasBeforeWashSpecs && hasAfterWashSpecs;

    // Derived values for the header
    const filterCriteria = {
        styleNo: formData.moNo || 'N/A',
        washType: 'Garment Wash'
    };
    const anfPoints = anfSpecs || [];

    const handleExportPDF = () => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 1000);
        console.log("Export PDF not implemented");
    };

    const handleExportExcel = () => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 1000);
        console.log("Export Excel not implemented");
    };

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

    // Click outside handler for Size Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSizeDropdown &&
                sizeDropdownRef.current &&
                !sizeDropdownRef.current.contains(event.target)) {
                setShowSizeDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSizeDropdown]);

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

        if (!formData.shrinkageRows || formData.shrinkageRows.length === 0) {
            handleInputChange('shrinkageRows', [
                { location: '', beforeWashSpec: '', afterWashSpec: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: '' }
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

        if (!formData.washType) {
            handleInputChange('washType', 'Before Wash');
        }
    }, [formData.reportType]);

    // Fetch Users for Dropdowns
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users`);
                if (response.data) {
                    setUsers(response.data);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // Fetch measurement specs from the same API as MeasurementDetailsSection
    const fetchMeasurementSpecs = async (orderNo) => {
        if (!orderNo || orderNo.trim().length < 3) {
            setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
            return;
        }

        setIsLoadingMeasurementSpecs(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/washing/measurement-specs/${orderNo}`);
            const data = await response.json();

            if (response.ok && data.success) {
                const beforeWashGrouped = data.beforeWashGrouped || {};
                const afterWashGrouped = data.afterWashGrouped || {};

                setMeasurementSpecs({
                    beforeWash: data.beforeWashSpecs || [],
                    afterWash: data.afterWashSpecs || [],
                    beforeWashGrouped: beforeWashGrouped,
                    afterWashGrouped: afterWashGrouped
                });
            } else {
                setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
            }
        } catch (error) {
            console.error('Error fetching measurement specs:', error);
            setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
        } finally {
            setIsLoadingMeasurementSpecs(false);
        }
    };

    // Helper function to get size-specific spec value
    const getSizeSpecValue = (spec, size) => {
        if (Array.isArray(spec.Specs)) {
            const sizeSpec = spec.Specs.find(s => s.size === size);
            return sizeSpec ? sizeSpec.fraction : (spec.Specs?.fraction || spec.Specs || '');
        }
        return spec.Specs?.fraction || spec.Specs || '';
    };

    // Helper function to get filtered available sizes based on actual measurement specs
    const getFilteredAvailableSizes = () => {
        const washType = formData.washType || 'Before Wash';
        const isBeforeWash = washType === 'Before Wash';
        const specsSource = isBeforeWash ? measurementSpecs.beforeWash : measurementSpecs.afterWash;
        const groupedSpecs = isBeforeWash ? measurementSpecs.beforeWashGrouped : measurementSpecs.afterWashGrouped;

        // Get the first available K-value or use flat array
        let specsToUse = [];
        if (Object.keys(groupedSpecs).length > 0) {
            const firstKValue = Object.keys(groupedSpecs)[0];
            specsToUse = groupedSpecs[firstKValue] || [];
        } else if (Array.isArray(specsSource) && specsSource.length > 0) {
            specsToUse = specsSource;
        }

        // Extract all available sizes from specs
        const sizesFromSpecs = new Set();
        specsToUse.forEach(spec => {
            if (Array.isArray(spec.Specs)) {
                spec.Specs.forEach(s => {
                    if (s.size) sizesFromSpecs.add(s.size);
                });
            }
        });

        // If we have sizes from specs, use only those. Otherwise fall back to availableSizes prop
        const sizesToUse = sizesFromSpecs.size > 0
            ? Array.from(sizesFromSpecs)
            : (availableSizes || []);

        // Sort sizes in a logical order
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL'];
        return sizesToUse.sort((a, b) => {
            const indexA = sizeOrder.indexOf(a);
            const indexB = sizeOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    };

    // Helper function to get all sizes with their specs for comparison
    const getAllSizeSpecs = () => {
        const washType = formData.washType || 'Before Wash';
        const isBeforeWash = washType === 'Before Wash';
        const specsSource = isBeforeWash ? measurementSpecs.beforeWash : measurementSpecs.afterWash;
        const groupedSpecs = isBeforeWash ? measurementSpecs.beforeWashGrouped : measurementSpecs.afterWashGrouped;

        // Get the first available K-value or use flat array
        let specsToUse = [];
        if (Object.keys(groupedSpecs).length > 0) {
            const firstKValue = Object.keys(groupedSpecs)[0];
            specsToUse = groupedSpecs[firstKValue] || [];
        } else if (Array.isArray(specsSource) && specsSource.length > 0) {
            specsToUse = specsSource;
        }

        // Extract all available sizes from specs
        const allSizes = new Set();
        specsToUse.forEach(spec => {
            if (Array.isArray(spec.Specs)) {
                spec.Specs.forEach(s => {
                    if (s.size) allSizes.add(s.size);
                });
            }
        });

        // Sort sizes in a logical order
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL'];
        const sortedSizes = Array.from(allSizes).sort((a, b) => {
            const indexA = sizeOrder.indexOf(a);
            const indexB = sizeOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        // Build comparison data
        const comparisonData = specsToUse.map(spec => {
            const row = {
                measurementPoint: spec.MeasurementPointEngName || spec.measurementPoint || 'UNKNOWN',
                sizes: {}
            };

            sortedSizes.forEach(size => {
                row.sizes[size] = getSizeSpecValue(spec, size);
            });

            return row;
        });

        return { sizes: sortedSizes, data: comparisonData };
    };

    // 1. Fetch measurement specs when orderNo (style) is available
    const lastFetchedOrderNoRef = useRef('');
    useEffect(() => {
        const orderNo = (formData.moNo || '').trim().toUpperCase();

        const timer = setTimeout(() => {
            if (orderNo && orderNo.length >= 3 && orderNo !== lastFetchedOrderNoRef.current) {
                lastFetchedOrderNoRef.current = orderNo;
                fetchMeasurementSpecs(orderNo);
                // Reset sampleSize and shrinkageRows to default when style changes
                handleInputChange('sampleSize', '');
                handleInputChange('shrinkageRows', []);
            } else if (!orderNo || orderNo.length < 3) {
                setMeasurementSpecs({ beforeWash: [], afterWash: [], beforeWashGrouped: {}, afterWashGrouped: {} });
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.moNo]);

    // 1.5. Auto-select wash type based on available specs
    useEffect(() => {
        if (isLoadingMeasurementSpecs) return;

        const hasBeforeWashSpecs = measurementSpecs.beforeWash && measurementSpecs.beforeWash.length > 0;
        const hasAfterWashSpecs = measurementSpecs.afterWash && measurementSpecs.afterWash.length > 0;

        // Smart wash type selection logic
        if (hasBeforeWashSpecs && hasAfterWashSpecs) {
            // Both specs available → Default to "BEFORE"
            handleInputChange('washType', 'Before Wash');
        } else if (hasBeforeWashSpecs && !hasAfterWashSpecs) {
            // Only SPEC (BEFORE) available → Set to "BEFORE"
            handleInputChange('washType', 'Before Wash');
        } else if (!hasBeforeWashSpecs && hasAfterWashSpecs) {
            // Only SPEC (AFTER) available → Set to "AFTER"
            handleInputChange('washType', 'After Wash');
        } else {
            // No specs available → Default to "BEFORE"
            handleInputChange('washType', 'Before Wash');
        }
    }, [measurementSpecs, isLoadingMeasurementSpecs]);

    // 2. Update shrinkageRows when measurement specs, size, or wash type change
    useEffect(() => {
        const size = formData.sampleSize;
        const washType = formData.washType || 'Before Wash';

        if (!size || isLoadingMeasurementSpecs) {
            return;
        }

        // Determine which specs to use based on wash type
        const isBeforeWash = washType === 'Before Wash';
        const specsSource = isBeforeWash ? measurementSpecs.beforeWash : measurementSpecs.afterWash;
        const groupedSpecs = isBeforeWash ? measurementSpecs.beforeWashGrouped : measurementSpecs.afterWashGrouped;

        // Get the first available K-value or use flat array
        let specsToUse = [];
        if (Object.keys(groupedSpecs).length > 0) {
            // Use the first K-value group
            const firstKValue = Object.keys(groupedSpecs)[0];
            specsToUse = groupedSpecs[firstKValue] || [];
        } else if (Array.isArray(specsSource) && specsSource.length > 0) {
            specsToUse = specsSource;
        }

        if (specsToUse.length > 0) {
            // Check if size changed to determine if we should preserve data
            // Ignore change if prevSizeRef is empty (initial load)
            const sizeChanged = prevSizeRef.current !== '' && prevSizeRef.current !== size;
            const currentRows = formData.shrinkageRows || [];

            // Get both before and after wash specs
            const beforeWashSpecs = measurementSpecs.beforeWash || [];
            const afterWashSpecs = measurementSpecs.afterWash || [];

            // Create maps for easy lookup
            const beforeWashSpecsMap = {};
            beforeWashSpecs.forEach(spec => {
                const pointName = spec.MeasurementPointEngName || spec.measurementPoint || '';
                if (pointName) {
                    beforeWashSpecsMap[pointName] = spec;
                }
            });

            const afterWashSpecsMap = {};
            afterWashSpecs.forEach(spec => {
                const pointName = spec.MeasurementPointEngName || spec.measurementPoint || '';
                if (pointName) {
                    afterWashSpecsMap[pointName] = spec;
                }
            });

            // Transform specs to shrinkageRows format, filtering by size
            const dynamicRows = specsToUse.map((spec, idx) => {
                const locationName = spec.MeasurementPointEngName || spec.measurementPoint || 'UNKNOWN';

                // Determine which spec values to use based on wash type
                let beforeWashSpecValue = '';
                let afterWashSpecValue = '';

                if (isBeforeWash) {
                    beforeWashSpecValue = getSizeSpecValue(spec, size);
                    const afterWashSpec = afterWashSpecsMap[locationName];
                    afterWashSpecValue = afterWashSpec ? getSizeSpecValue(afterWashSpec, size) : '';
                } else {
                    afterWashSpecValue = getSizeSpecValue(spec, size);
                    const beforeWashSpec = beforeWashSpecsMap[locationName];
                    beforeWashSpecValue = beforeWashSpec ? getSizeSpecValue(beforeWashSpec, size) : '';
                }

                // Only preserve existing measurements if size hasn't changed
                const existingRow = !sizeChanged ? currentRows.find(r => r.location === locationName) : null;
                const beforeWash = existingRow ? existingRow.beforeWash : '';
                const afterWash = existingRow ? existingRow.afterWash : '';

                // RECALCULATE Shrinkage for this row
                let shrinkage = '';
                let passFail = '';
                const beforeVal = parseFraction(beforeWash);
                const afterVal = parseFraction(afterWash);
                const beforeSpecVal = parseFraction(beforeWashSpecValue);
                const afterSpecVal = parseFraction(afterWashSpecValue);

                const targetSpec = isBeforeWash ? beforeSpecVal : afterSpecVal;
                const hasMeasurements = beforeWash !== '' && afterWash !== '';

                if (hasMeasurements && targetSpec !== 0) {
                    const shrinkagePercent = ((afterVal - beforeVal) / targetSpec) * 100;
                    shrinkage = (shrinkagePercent >= 0 ? '+' : '') + shrinkagePercent.toFixed(2) + '%';

                    let reqValue = 5;
                    const match = (existingRow?.requirement || '±5%').match(/(\d+)/);
                    if (match) reqValue = parseInt(match[1]);
                    passFail = Math.abs(shrinkagePercent) <= reqValue ? 'PASS' : 'FAIL';
                }

                return {
                    no: idx + 1,
                    location: locationName,
                    beforeWashSpec: beforeWashSpecValue || '',
                    afterWashSpec: afterWashSpecValue || '',
                    beforeWash: beforeWash,
                    afterWash: afterWash,
                    shrinkage: shrinkage,
                    requirement: existingRow ? existingRow.requirement : '±5%',
                    passFail: passFail,
                    isFromSpec: true,
                    selected: existingRow ? existingRow.selected : false,
                    id: existingRow ? existingRow.id : Math.random().toString(36).substr(2, 9)
                };
            });

            handleInputChange('shrinkageRows', dynamicRows);
        } else if (!isLoadingMeasurementSpecs && size) {
            // If fetch finished but no specs found, clear rows
            handleInputChange('shrinkageRows', []);
        }

        // Update ref
        prevSizeRef.current = size;

    }, [measurementSpecs, formData.sampleSize, formData.washType, isLoadingMeasurementSpecs]);

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

    // Auto-populate Colors when available (Only on new data)
    useEffect(() => {
        const isNewColors = JSON.stringify(availableColors) !== JSON.stringify(prevAvailableColorsRef.current);

        if (isNewColors && availableColors && availableColors.length > 0) {
            handleInputChange('color', [...availableColors]);
            prevAvailableColorsRef.current = availableColors;
        }
    }, [availableColors, handleInputChange]);

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

        // Auto-calculate Shrinkage % and Pass/Fail if updating measurement rows
        if (field === 'shrinkageRows') {
            const row = rows[index];
            const beforeVal = key === 'beforeWash' ? value : row.beforeWash;
            const afterVal = key === 'afterWash' ? value : row.afterWash;
            const beforeSpecVal = row.beforeWashSpec || '';
            const afterSpecVal = row.afterWashSpec || '';

            const before = parseFraction(beforeVal);
            const after = parseFraction(afterVal);
            const beforeSpec = parseFraction(beforeSpecVal);
            const afterSpec = parseFraction(afterSpecVal);

            // Determine Shrinkage Pass/Fail
            let isShrinkageOk = true;
            let hasCalculated = false;

            // Determine which spec to use as base for shrinkage calculation based on washType
            const isAfterWashMode = formData.washType === 'After Wash';
            const targetSpec = isAfterWashMode ? afterSpec : beforeSpec;
            const targetSpecVal = isAfterWashMode ? afterSpecVal : beforeSpecVal;

            // Calculate shrinkage based on available specs and measurements
            // Priority 1: Use ACTUAL measurements if available
            if (beforeVal !== '' && afterVal !== '' && targetSpec !== 0 && targetSpecVal !== '') {
                // Formula: ((G2 - G1) / TargetSpec) × 100
                const actualChange = after - before;
                const shrinkagePercent = (actualChange / targetSpec) * 100;
                rows[index].shrinkage = (shrinkagePercent >= 0 ? '+' : '') + shrinkagePercent.toFixed(2) + '%';

                // Get requirement threshold (default 5% if not specified)
                let reqValue = 5;
                const reqStr = row.requirement || '';
                const match = reqStr.match(/(\d+)/);
                if (match) reqValue = parseInt(match[1]);

                isShrinkageOk = Math.abs(shrinkagePercent) <= reqValue;
                hasCalculated = true;
            }

            // Priority 3: Fallback - Measurements Only (no specs available)
            else if (beforeVal !== '' && afterVal !== '' && before !== 0) {
                const actualShrinkage = ((after - before) / before) * 100;
                rows[index].shrinkage = (actualShrinkage >= 0 ? '+' : '') + actualShrinkage.toFixed(2) + '%';

                let reqValue = 5;
                const reqStr = row.requirement || '';
                const match = reqStr.match(/(\d+)/);
                if (match) reqValue = parseInt(match[1]);

                isShrinkageOk = Math.abs(actualShrinkage) <= reqValue;
                hasCalculated = true;
            } else if (key === 'beforeWash' || key === 'afterWash') {
                rows[index].shrinkage = '';
            }

            // Final Pass/Fail Status
            if (hasCalculated) {
                rows[index].passFail = isShrinkageOk ? 'PASS' : 'FAIL';
            } else {
                rows[index].passFail = '';
            }
        }

        handleInputChange(field, rows);
    };

    // Helper to add a new row to Color Fastness tables
    // Helper to add a new row to tables
    const addRow = (field) => {
        const rows = [...(formData[field] || [])];
        const headerColor = Array.isArray(formData.color) ? formData.color.join(', ') : (formData.color || '');

        let newRow = {};
        if (field === 'colorFastnessRows') {
            newRow = { fabricType: '', color: headerColor, colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' };
        } else if (field === 'colorStainingRows') {
            newRow = { fabricType: '', color: headerColor, colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' };
        } else if (field === 'shrinkageRows') {
            newRow = { location: '', beforeWashSpec: '', afterWashSpec: '', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: '', selected: false };
        }

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

    const toggleSelectAll = () => {
        const rows = formData.shrinkageRows || [];
        const allSelected = rows.length > 0 && rows.every(row => row.selected);
        const newRows = rows.map(row => ({ ...row, selected: !allSelected }));
        handleInputChange('shrinkageRows', newRows);
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
                                        const newVal = integerPart - 1;
                                        setIntegerPart(newVal);
                                        // Auto confirm with new integer part
                                        const sign = isNegative ? '-' : '';
                                        const intStr = newVal === 0 ? '' : `${newVal} `;
                                        const fracStr = fractionPart || '';
                                        onConfirm(`${sign}${intStr}${fracStr}`.trim() || '0');
                                    } else {
                                        setFractionPart(f);
                                        // Auto confirm with selected fraction
                                        const sign = isNegative ? '-' : '';
                                        const intStr = integerPart === 0 ? '' : `${integerPart} `;
                                        onConfirm(`${sign}${intStr}${f}`.trim());
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
        <div className="space-y-8">

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* STYLE Input - Matching HomeWashForm UI */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">STYLE :</label>
                        <input
                            type="text"
                            value={formData.moNo || ''}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                handleInputChange("moNo", newValue);
                            }}
                            onFocus={() => {
                                if (formData.moNo && formData.moNo.length >= 2 && searchOrderNo) {
                                    searchOrderNo(formData.moNo);
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
                                    const firstValidSuggestion = orderNoSuggestions.filter(on => on !== formData.moNo)[0];
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
                            orderNoSuggestions.filter(on => on !== formData.moNo).length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {orderNoSuggestions
                                        .filter(orderNo => orderNo !== formData.moNo)
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
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                        </label>
                        <input placeholder="Auto-filled Cust" type="text" value={formData.custStyle || ''} onChange={(e) => handleInputChange("custStyle", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white cursor-not-allowed" required readOnly />
                    </div>

                    {/* COLOR Dropdown - Matching HomeWashForm UI */}
                    <div className="relative color-dropdown-container" ref={colorDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">COLOR :
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColorDropdown && setShowColorDropdown(!showColorDropdown)}
                                disabled={isSearchingOrderNo || !formData.moNo || (availableColors && availableColors.length === 0)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="truncate">
                                    {isSearchingOrderNo
                                        ? "Loading colors..."
                                        : !formData.moNo
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
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
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
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
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

                        {/* Care Symbols Selector */}
                        <div className="md:col-span-2 mt-2">
                            <CareSymbolsSelector
                                value={formData.careSymbols || {}}
                                onChange={(newSymbols) => handleInputChange('careSymbols', newSymbols)}
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
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">Flat Measurements & Shrinkage</h3>
                                <p className="text-xs text-gray-400 font-medium">Enter standard measurements to calculate shrinkage</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {formData.sampleSize && (formData.shrinkageRows || []).length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsShrinkageSaved(!isShrinkageSaved)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 font-bold text-xs uppercase tracking-wider ${isShrinkageSaved ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                >
                                    {isShrinkageSaved ? <Edit size={16} /> : <Save size={16} />}
                                    {isShrinkageSaved ? "Edit Selection" : "Save"}
                                </button>
                            )}
                            {/* Wash Type Button Selector */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-50"></div>
                                <div className="relative flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em]">Wash Type</span>
                                    <div className="h-4 w-[1px] bg-gray-100 dark:bg-gray-700"></div>
                                    <div
                                        className={`flex p-1 rounded-lg border transition-all duration-300 ${isWashTypeLocked ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 opacity-80' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700'}`}
                                        title={isWashTypeLocked ? "Selection is locked because both Before & After specifications are available. The system automatically defaults to Before Wash as the baseline." : ""}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => !isWashTypeLocked && handleInputChange('washType', 'Before Wash')}
                                            disabled={isWashTypeLocked}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${formData.washType === 'Before Wash'
                                                ? (isWashTypeLocked ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white shadow-sm')
                                                : 'text-gray-400 hover:text-blue-500 hover:bg-white'
                                                } ${isWashTypeLocked ? 'cursor-not-allowed' : ''}`}
                                        >
                                            Before
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => !isWashTypeLocked && handleInputChange('washType', 'After Wash')}
                                            disabled={isWashTypeLocked}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${formData.washType === 'After Wash'
                                                ? (isWashTypeLocked ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white shadow-sm')
                                                : 'text-gray-400 hover:text-blue-500 hover:bg-white'
                                                } ${isWashTypeLocked ? 'cursor-not-allowed' : ''}`}
                                        >
                                            After
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-50"></div>
                                <div className="relative flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.1em]">Size</span>
                                    <div className="h-4 w-[1px] bg-gray-100 dark:bg-gray-700"></div>
                                    <div className="relative" ref={sizeDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                                            className="flex items-center gap-2 text-base font-black text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer min-w-[3rem] justify-center"
                                        >
                                            <span className="tabular-nums">{formData.sampleSize || '--'}</span>
                                            <svg className={`transition-transform duration-200 ${showSizeDropdown ? 'rotate-180' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showSizeDropdown && (() => {
                                            const filteredSizes = getFilteredAvailableSizes();
                                            return (
                                                <div className="absolute top-full right-0 mt-3 min-w-[140px] bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-4 ring-blue-50/50 dark:ring-blue-900/20">
                                                    <div className="max-h-64 overflow-y-auto p-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                                                        {filteredSizes.length === 0 ? (
                                                            <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium italic">No sizes available</div>
                                                        ) : (
                                                            filteredSizes.map((s) => {
                                                                // Count how many specs are available for this size
                                                                const washType = formData.washType || 'Before Wash';
                                                                const isBeforeWash = washType === 'Before Wash';
                                                                const specsSource = isBeforeWash ? measurementSpecs.beforeWash : measurementSpecs.afterWash;

                                                                let specCount = 0;
                                                                if (Array.isArray(specsSource)) {
                                                                    specCount = specsSource.filter(spec => {
                                                                        const specValue = getSizeSpecValue(spec, s);
                                                                        return specValue && specValue !== '';
                                                                    }).length;
                                                                }

                                                                return (
                                                                    <button
                                                                        key={s}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleInputChange('sampleSize', s);
                                                                            setShowSizeDropdown(false);
                                                                            setIsShrinkageSaved(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all mb-0.5 last:mb-0 flex items-center justify-between group
                                                                        ${formData.sampleSize === s
                                                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                                                                            }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            {s}
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black tabular-nums ${specCount > 0}`}>
                                                                                ( {specCount} )
                                                                            </span>
                                                                        </span>
                                                                        {formData.sampleSize === s && (
                                                                            <Check size={14} strokeWidth={3} className="opacity-100 transition-opacity" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* View All Sizes Button */}
                            {formData.sampleSize && (formData.shrinkageRows || []).length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowSizeComparisonModal(true)} title="View all sizes comparison">
                                    <Maximize2 size={16} className="" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="relative overflow-x-auto border rounded-xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                        {/* Loading Overlay */}
                        {(isLoadingSpecs || isLoadingMeasurementSpecs) && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold text-blue-600 animate-pulse">Fetching Specs...</span>
                                </div>
                            </div>
                        )}

                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-md text-gray-500 dark:text-gray-400 font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                                <tr>
                                    <th className={`p-4 border-b dark:border-gray-700 w-10 text-center first:rounded-tl-xl ${isShrinkageSaved ? 'hidden' : ''}`}>
                                        <div className="flex items-center justify-center">
                                            <label className="relative flex items-center justify-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={(formData.shrinkageRows || []).length > 0 && (formData.shrinkageRows || []).every(r => r.selected)}
                                                    onChange={toggleSelectAll}
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 ease-out shadow-sm group-hover:border-blue-400 dark:group-hover:border-blue-500"></div>
                                                <Check size={14} strokeWidth={3} className="absolute text-white opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all duration-200 ease-out" />
                                            </label>
                                        </div>
                                    </th>
                                    <th className="p-4 border-b dark:border-gray-700 w-14 text-center">NO</th>
                                    <th className="p-4 border-b dark:border-gray-700">MEASUREMENT POINT</th>
                                    <th className={`p-4 border-b dark:border-gray-700 w-24 text-center transition-all duration-300 ${formData.washType !== 'After Wash' ? 'bg-blue-50/80 dark:bg-blue-900/40 ring-inset ring-2 ring-blue-400/30' : 'opacity-40 grayscale-[0.5]'}`}>
                                        <div className="flex flex-col text-[10px] text-blue-600 dark:text-blue-400">
                                            <span className="font-extrabold text-xs">SPEC</span>
                                            <span className="font-extrabold text-xs">(BEFORE)</span>
                                            {formData.washType !== 'After Wash' && <span className="text-[8px] mt-0.5 bg-blue-600 text-white px-1 rounded-full uppercase">Active</span>}
                                        </div>
                                    </th>
                                    <th className={`p-4 border-b dark:border-gray-700 w-24 text-center transition-all duration-300 ${formData.washType === 'After Wash' ? 'bg-purple-50/80 dark:bg-purple-900/40 ring-inset ring-2 ring-purple-400/30' : 'opacity-40 grayscale-[0.5]'}`}>
                                        <div className="flex flex-col text-[10px] text-purple-600 dark:text-purple-400">
                                            <span className="font-extrabold text-xs">SPEC</span>
                                            <span className="font-extrabold text-xs">(AFTER)</span>
                                            {formData.washType === 'After Wash' && <span className="text-[8px] mt-0.5 bg-purple-600 text-white px-1 rounded-full uppercase">Active</span>}
                                        </div>
                                    </th>
                                    <th className="p-4 border-b dark:border-gray-700 w-32 text-center text-gray-700 dark:text-gray-300">
                                        Before Wash (G1)
                                    </th>
                                    <th className="p-4 border-b dark:border-gray-700 w-32 text-center text-gray-700 dark:text-gray-300">
                                        After Wash (G2)
                                    </th>
                                    <th className="p-4 border-b dark:border-gray-700 w-32 text-center">Shrinkage %</th>
                                    <th className="p-4 border-b dark:border-gray-700 w-24 text-center">Req.</th>
                                    <th className="p-4 border-b dark:border-gray-700 text-center w-20">PASS</th>
                                    <th className="p-4 border-b dark:border-gray-700 text-center w-20">FAIL</th>
                                    <th className="p-4 border-b dark:border-gray-700 w-12 last:rounded-tr-xl"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {(!formData.sampleSize) ? (
                                    <tr>
                                        <td colSpan={11} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <RotateCw size={40} className="mb-4 text-gray-400" />
                                                <p className="text-lg font-bold text-gray-500">Select a Test Size to Load Specifications</p>
                                                <p className="text-sm">Specifications will automatically load once a size is selected</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (formData.shrinkageRows || []).length === 0 && !isLoadingSpecs && !isLoadingMeasurementSpecs ? (
                                    <tr>
                                        <td colSpan={11} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <XCircle size={40} className="mb-4 text-red-400" />
                                                <p className="text-lg font-bold text-gray-500">No Specifications Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (formData.shrinkageRows || []).map((row, index) => (
                                    <tr key={row.id || index} className={`group dark:border-gray-700 border-b border-gray-50 last:border-none hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-colors duration-200 ${isShrinkageSaved && !row.selected ? 'hidden' : ''}`}>
                                        <td className={`p-3 text-center ${isShrinkageSaved ? 'hidden' : ''}`}>
                                            <div className="flex items-center justify-center">
                                                <label className="relative flex items-center justify-center cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={!!row.selected}
                                                        onChange={(e) => updateRow('shrinkageRows', index, 'selected', e.target.checked)}
                                                    />
                                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 ease-out shadow-sm group-hover:border-blue-400 dark:group-hover:border-blue-500"></div>
                                                    <Check size={14} strokeWidth={3} className="absolute text-white opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all duration-200 ease-out" />
                                                </label>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center text-gray-400 font-extrabold font-mono text-xs group-hover:text-blue-500 transition-colors">
                                            {row.no || (index + 1)}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {row.isFromSpec ? (
                                                <div className="px-1 text-gray-700 dark:text-gray-200 font-bold text-sm leading-tight flex items-center">
                                                    {row.location}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={row.location}
                                                    onChange={(e) => updateRow('shrinkageRows', index, 'location', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 p-1 font-bold text-gray-700 dark:text-gray-300 placeholder:italic transition-colors"
                                                    placeholder="Enter point name..."
                                                />
                                            )}
                                        </td>
                                        <td className={`p-3 border-l border-r border-blue-50 transition-all duration-300 ${formData.washType !== 'After Wash' ? 'bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02] z-10 shadow-sm' : 'opacity-40 dark:border-blue-900/30'}`}>
                                            <div className="flex flex-col items-center justify-center gap-0.5">
                                                {row.isFromSpec ? (
                                                    <div className="relative">
                                                        <span className={`font-black text-lg tracking-tight tabular-nums ${formData.washType !== 'After Wash' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                                            {row.beforeWashSpec}
                                                        </span>
                                                        <span className="absolute -top-1 -right-3 text-[9px] font-bold text-blue-300">IN</span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={row.beforeWashSpec}
                                                        onClick={() => openKeypad('shrinkageRows', index, 'beforeWashSpec', row.beforeWashSpec)}
                                                        readOnly
                                                        className={`w-full bg-white/50 dark:bg-gray-800/50 border border-blue-100 dark:border-blue-800 rounded px-1 text-center cursor-pointer hover:bg-white dark:hover:bg-gray-800 font-black text-lg ${formData.washType !== 'After Wash' ? 'text-blue-600' : 'text-gray-400'}`}
                                                        placeholder="-"
                                                    />
                                                )}
                                                {row.beforeWashSpec && (
                                                    <span className="text-[10px] text-gray-400 font-mono font-medium">
                                                        {parseFraction(row.beforeWashSpec).toFixed(3)}"
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`p-3 border-l border-r border-purple-50 transition-all duration-300 ${formData.washType === 'After Wash' ? 'bg-purple-50/50 dark:bg-purple-900/20 scale-[1.02] z-10 shadow-sm' : 'opacity-40 dark:border-purple-900/30'}`}>
                                            <div className="flex flex-col items-center justify-center gap-0.5">
                                                {row.isFromSpec ? (
                                                    <div className="relative">
                                                        <span className={`font-black text-lg tracking-tight tabular-nums ${formData.washType === 'After Wash' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                                                            {row.afterWashSpec}
                                                        </span>
                                                        <span className="absolute -top-1 -right-3 text-[9px] font-bold text-purple-300">IN</span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={row.afterWashSpec}
                                                        onClick={() => openKeypad('shrinkageRows', index, 'afterWashSpec', row.afterWashSpec)}
                                                        readOnly
                                                        className={`w-full bg-white/50 dark:bg-gray-800/50 border border-purple-100 dark:border-purple-800 rounded px-1 text-center cursor-pointer hover:bg-white dark:hover:bg-gray-800 font-black text-lg ${formData.washType === 'After Wash' ? 'text-purple-600' : 'text-gray-400'}`}
                                                        placeholder="-"
                                                    />
                                                )}
                                                {row.afterWashSpec && (
                                                    <span className="text-[10px] text-gray-400 font-mono font-medium">
                                                        {parseFraction(row.afterWashSpec).toFixed(3)}"
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 relative">
                                            <div
                                                onClick={() => openKeypad('shrinkageRows', index, 'beforeWash', row.beforeWash)}
                                                className={`cursor-pointer rounded-xl border transition-all duration-200 flex flex-col items-center justify-center h-14 w-full relative group/input
                                                    ${row.beforeWash ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 border-dashed hover:border-blue-300 hover:bg-white'}`}
                                            >
                                                {row.beforeWash ? (
                                                    <>
                                                        <span className="text-lg font-black tabular-nums text-gray-800 dark:text-white">{row.beforeWash}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">{parseFraction(row.beforeWash).toFixed(3)}"</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300 group-hover/input:text-blue-400 transition-colors">
                                                        <Hash size={16} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div
                                                onClick={() => openKeypad('shrinkageRows', index, 'afterWash', row.afterWash)}
                                                className={`cursor-pointer rounded-xl border transition-all duration-200 flex flex-col items-center justify-center h-14 w-full relative group/input
                                                    ${row.afterWash ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 border-dashed hover:border-blue-300 hover:bg-white'}`}
                                            >
                                                {row.afterWash ? (
                                                    <>
                                                        <span className="text-lg font-black tabular-nums text-gray-800 dark:text-white">{row.afterWash}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">{parseFraction(row.afterWash).toFixed(3)}"</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300 group-hover/input:text-blue-400 transition-colors">
                                                        <Hash size={16} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            {row.shrinkage ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 border transition-all duration-500 shadow-sm
                                                        ${row.passFail === 'FAIL'
                                                            ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 animate-pulse-soft'
                                                            : 'bg-green-50 border-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'}`}>
                                                        <span className="text-sm font-black tabular-nums">{row.shrinkage}</span>
                                                    </div>
                                                    {(() => {
                                                        const hasBeforeSpec = row.beforeWashSpec && row.beforeWashSpec !== '';
                                                        const hasAfterSpec = row.afterWashSpec && row.afterWashSpec !== '';
                                                        const hasG1 = row.beforeWash && row.beforeWash !== '';
                                                        const hasG2 = row.afterWash && row.afterWash !== '';

                                                        // Priority 1: SPEC (BEFORE) + Measurements
                                                        if (hasBeforeSpec && hasG1 && hasG2) {
                                                            return (
                                                                <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 font-normal leading-tight">
                                                                    (({parseFraction(row.afterWash).toFixed(3)} - {parseFraction(row.beforeWash).toFixed(3)}) / {parseFraction(row.beforeWashSpec).toFixed(3)}) × 100
                                                                </span>
                                                            );
                                                        }
                                                        // Priority 2: SPEC (AFTER) + Measurements (no SPEC BEFORE)
                                                        else if (hasAfterSpec && hasG1 && hasG2 && !hasBeforeSpec) {
                                                            return (
                                                                <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 font-normal leading-tight">
                                                                    (({parseFraction(row.afterWash).toFixed(3)} - {parseFraction(row.beforeWash).toFixed(3)}) / {parseFraction(row.afterWashSpec).toFixed(3)}) × 100
                                                                </span>
                                                            );
                                                        }

                                                        // Priority 4: Measurements Only (no specs) - Fallback
                                                        else if (hasG1 && hasG2 && !hasBeforeSpec && !hasAfterSpec) {
                                                            return (
                                                                <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 font-normal leading-tight">
                                                                    (({parseFraction(row.afterWash).toFixed(3)} - {parseFraction(row.beforeWash).toFixed(3)}) / {parseFraction(row.beforeWash).toFixed(3)}) × 100
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 font-bold text-xs uppercase tracking-wider">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-bold rounded-md text-[11px] border border-gray-200 dark:border-gray-600">
                                                    {row.requirement}
                                                </span>
                                                {row.shrinkage && row.requirement && (
                                                    <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 font-normal leading-tight">
                                                        {(() => {
                                                            const reqMatch = row.requirement.match(/(\d+)/);
                                                            const reqValue = reqMatch ? parseInt(reqMatch[1]) : 5;
                                                            const shrinkageValue = parseFloat(row.shrinkage.replace('%', ''));
                                                            const isPass = Math.abs(shrinkageValue) <= reqValue;
                                                            return `${shrinkageValue.toFixed(2)}% ${isPass ? '≤' : '>'} ${reqValue}%`;
                                                        })()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div
                                                className={`transition-all duration-300 mx-auto
                                                    ${row.passFail === 'PASS'
                                                        ? 'text-green-500 scale-125 drop-shadow-sm'
                                                        : 'text-gray-200'}`}
                                            >
                                                <Check size={28} strokeWidth={5} />
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div
                                                className={`transition-all duration-300 mx-auto
                                                    ${row.passFail === 'FAIL'
                                                        ? 'text-red-500 scale-125 drop-shadow-sm'
                                                        : 'text-gray-200'}`}
                                            >
                                                <X size={28} strokeWidth={5} />
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            {!row.isFromSpec && (
                                                <button type="button" onClick={() => removeRow('shrinkageRows', index)}
                                                    className="w-full h-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
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
                <div className="border-t pt-8 mt-8">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CHECKED BY:</label>
                            <Select
                                showSearch
                                value={formData.checkedBy || undefined}
                                placeholder="Select User"
                                optionFilterProp="label"
                                onChange={(value) => handleInputChange("checkedBy", value)}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={users.map(u => ({
                                    value: u.name,
                                    label: `(${u.emp_id}) ${u.name}`
                                }))}
                                className="w-full h-[42px]"
                            />
                        </div>

                        {/* Approved By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">APPROVED BY:</label>
                            <Select
                                showSearch
                                value={formData.approvedBy || undefined}
                                placeholder="Select User"
                                optionFilterProp="label"
                                onChange={(value) => handleInputChange("approvedBy", value)}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={users.map(u => ({
                                    value: u.name,
                                    label: `(${u.emp_id}) ${u.name}`
                                }))}
                                className="w-full h-[42px]"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                DATE :
                            </label>

                            <div className="relative group ant-datepicker-container">
                                <DatePicker
                                    value={formData.date ? dayjs(formData.date) : dayjs()} // ✅ today auto-set
                                    onChange={(date) =>
                                        handleInputChange(
                                            "date",
                                            date ? dayjs(date).format("YYYY-MM-DD") : ""
                                        )
                                    }
                                    format="MM/DD/YYYY"
                                    className="w-full h-[42px] border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>


                    </div>
                </div>

                {/* Images & Notes */}
                <div className="pt-8 mt-8 border-t">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wider text-sm">Images & Additional Notes</h3>

                    {/* Image Upload UI(Similar to other forms) */}
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
                        {isSubmitting ? "Submitting..." : isCompleting ? "Complete Report" : "Submit Report"}
                    </button>
                </div>
            </form>

            <FractionKeypad
                isOpen={keypadOpen}
                onClose={() => setKeypadOpen(false)}
                initialValue={tempValue}
                onConfirm={handleKeypadSubmit}
            />

            {/* Size Comparison Modal */}
            {showSizeComparisonModal && (() => {
                const comparisonData = getAllSizeSpecs();
                return createPortal(
                    <div className="fixed inset-0 z-[9999] h-screen w-screen flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {
                        e.stopPropagation();
                    }}>
                        <div className="absolute inset-0 z-[-1]" onClick={() => setShowSizeComparisonModal(false)}></div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">Size Comparison</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {formData.washType || 'Before Wash'} - {formData.style || 'N/A'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSizeComparisonModal(false)}
                                    className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <X size={24} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable Table */}
                            <div className="flex-1 overflow-auto p-6">
                                {comparisonData.sizes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <XCircle size={48} className="mb-4" />
                                        <p className="text-lg font-bold">No size data available</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="p-4 text-left font-black text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 min-w-[250px]">
                                                        MEASUREMENT POINT
                                                    </th>
                                                    {comparisonData.sizes.map(size => (
                                                        <th
                                                            key={size}
                                                            className={`p-4 text-center font-black border-b-2 border-gray-300 dark:border-gray-600 min-w-[120px] ${size === formData.sampleSize
                                                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                {size}
                                                                {size === formData.sampleSize && (
                                                                    <Check size={16} className="text-blue-600 dark:text-blue-400" />
                                                                )}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {comparisonData.data.map((row, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">
                                                            {row.measurementPoint}
                                                        </td>
                                                        {comparisonData.sizes.map(size => (
                                                            <td
                                                                key={size}
                                                                className={`p-4 text-center border-l border-gray-100 dark:border-gray-700 ${size === formData.sampleSize
                                                                    ? 'bg-blue-50/50 dark:bg-blue-900/20 font-black text-blue-700 dark:text-blue-300'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                    }`}
                                                            >
                                                                {row.sizes[size] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing {comparisonData.data.length} measurement points across {comparisonData.sizes.length} sizes
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSizeComparisonModal(false);
                                    }}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            })()}
        </div>
    );
};

export default GarmentWashForm;
