import React, { useState, useEffect } from "react";
import { Upload, Camera, X, Send, RotateCw, Calendar, CheckCircle2, XCircle, Check } from "lucide-react";
import { DatePicker as AntDatePicker, TimePicker, Select } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { PRINT_WASH_TEST_DEFAULTS } from "../constants/reportTypes.js";

dayjs.extend(customParseFormat);


const HTTestingForm = ({
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    isCompleting,
    // Images
    handleFileInputChange,
    handleCameraInputChange,
    triggerFileInput,
    triggerCameraInput,
    handleRemoveImage,
    fileInputRef,
    cameraInputRef,
    // Search & Data Props
    searchOrderNo,
    orderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    handleOrderNoSelect,
    season,
    styleDescription,
    custStyle,
    fabrication,
    fabricContent = [],
    availableColors = [],
    // Users & assignment (for Checked By dropdown)
    users: parentUsers = [],
    isLoadingUsers = false,
    assignHistory,
}) => {
    const [showFabricDropdown, setShowFabricDropdown] = useState(false);
    const users = parentUsers || [];

    // Filter users based on assignHistory (same pattern as GarmentWashForm)
    const getFilteredOptions = (field) => {
        if (!assignHistory || assignHistory.length === 0) return [];
        const sortedHistory = [...assignHistory].sort(
            (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
        );
        const userRolesMap = new Map();
        const extractId = (val) => {
            if (!val) return null;
            const match = String(val).match(/\((.*?)\)/);
            return match ? match[1] : val;
        };
        sortedHistory.forEach((item) => {
            const checkedId = extractId(item.checkedBy);
            const approvedId = extractId(item.approvedBy);
            if (checkedId) {
                const current = userRolesMap.get(checkedId) || { checkedBy: false, approvedBy: false };
                current.checkedBy = true;
                userRolesMap.set(checkedId, current);
            }
            if (approvedId) {
                const current = userRolesMap.get(approvedId) || { checkedBy: false, approvedBy: false };
                current.approvedBy = true;
                userRolesMap.set(approvedId, current);
            }
        });
        const allowedEmpIds = new Set();
        userRolesMap.forEach((roles, empId) => {
            if (roles[field]) allowedEmpIds.add(empId);
        });
        if (allowedEmpIds.size === 0) return [];
        const filteredUsers = users.filter((u) => allowedEmpIds.has(u.emp_id));
        return filteredUsers.map((u) => ({
            value: u.emp_id,
            label: `(${u.emp_id}) ${u.name}`,
        }));
    };
    const checkedByOptions = getFilteredOptions("checkedBy");

    // Close fabric dropdown when clicking outside
    useEffect(() => {
        if (!showFabricDropdown) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest(".fabric-dropdown-container")) setShowFabricDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFabricDropdown]);

    // When fabricContent is used, treat fabricColor as array of selected labels; otherwise string
    const fabricOptions = Array.isArray(fabricContent) ? fabricContent.map((f) => `${f.percentageValue ?? ''}% ${f.fabricName ?? ''}`.trim() || `${f.fabricName ?? '—'} (${f.percentageValue ?? '—'}%)`) : [];
    const selectedFabricColors = Array.isArray(formData.fabricColor)
        ? formData.fabricColor
        : (formData.fabricColor ? String(formData.fabricColor).split(',').map((s) => s.trim()).filter(Boolean) : []);

    // Sync fetched data to form (including color from Garment Wash form)
    React.useEffect(() => {
        // Sync Style No from other forms if available
        if ((!formData.styleNo || formData.styleNo === '')) {
            if (formData.moNo) handleInputChange('styleNo', formData.moNo);
            else if (formData.ymStyle) handleInputChange('styleNo', formData.ymStyle);
        }

        if (season && season !== '' && (!formData.season || formData.season === '')) handleInputChange('season', season);
        if (styleDescription && styleDescription !== '' && (!formData.styleDescription || formData.styleDescription === '')) handleInputChange('styleDescription', styleDescription);
        if (custStyle && custStyle !== '' && (!formData.custStyle || formData.custStyle === '')) handleInputChange('custStyle', custStyle);
        if (fabrication && fabrication !== '' && (!formData.fabrication || formData.fabrication === '')) handleInputChange('fabrication', fabrication);

        // Take color value from Garment Wash form (or order availableColors) and put into Fabric Color when empty (HT. color is read-only, no user input)
        const garmentColor = formData.color;
        let colorArr = Array.isArray(garmentColor) ? garmentColor : (garmentColor ? [String(garmentColor).trim()].filter(Boolean) : []);
        if (colorArr.length === 0 && Array.isArray(availableColors) && availableColors.length > 0) colorArr = [...availableColors];
        if (colorArr.length > 0) {
            const hasFabricColor = Array.isArray(formData.fabricColor) ? formData.fabricColor.length > 0 : (formData.fabricColor && String(formData.fabricColor).trim() !== '');
            if (!hasFabricColor) handleInputChange('fabricColor', fabricOptions.length > 0 ? colorArr : colorArr.join(', '));
        }
    }, [season, styleDescription, custStyle, fabrication, formData.moNo, formData.ymStyle, formData.styleNo, formData.color, fabricOptions.length, availableColors]);

    // Default final Date to current date when empty
    useEffect(() => {
        if (!formData.finalDate || formData.finalDate === '') {
            handleInputChange('finalDate', dayjs().format('YYYY-MM-DD'));
        }
    }, []);

    // Normalize checkedBy when options change (match GarmentWashForm behavior)
    useEffect(() => {
        if (users.length === 0 || !formData.checkedBy) return;
        if (checkedByOptions.some((o) => o.value === formData.checkedBy)) return;
        const byName = users.find((u) => u.name === formData.checkedBy || formData.checkedBy === `(${u.emp_id}) ${u.name}`);
        if (byName && checkedByOptions.some((o) => o.value === byName.emp_id)) {
            handleInputChange("checkedBy", byName.emp_id);
        } else {
            handleInputChange("checkedBy", "");
        }
    }, [users.length, checkedByOptions, formData.checkedBy]);

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Style Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Style Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Style No. with Search - Renamed to STYLE to match GarmentWashForm */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                STYLE <span className="text-red-500 font-bold">*</span> :
                            </label>
                            <input
                                type="text"
                                value={formData.styleNo || ''}
                                onChange={(e) => {
                                    handleInputChange("styleNo", e.target.value);
                                    if (e.target.value.length >= 2) {
                                        searchOrderNo(e.target.value);
                                    } else {
                                        setShowOrderNoSuggestions(false);
                                    }
                                }}
                                onFocus={() => {
                                    if (formData.styleNo && formData.styleNo.length >= 2) {
                                        searchOrderNo(formData.styleNo);
                                    }
                                }}
                                disabled={isCompleting}
                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${isCompleting ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 opacity-60' : ''}`}
                                required
                                placeholder="Search from Yorksys"
                                autoComplete="off"
                            />
                            {/* Suggestions Dropdown */}
                            {showOrderNoSuggestions && orderNoSuggestions.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {orderNoSuggestions.map((item, index) => (
                                        <li
                                            key={index}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (handleOrderNoSelect) {
                                                    handleOrderNoSelect(item);
                                                }
                                            }}
                                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {isSearchingOrderNo && (
                                <div className="absolute right-3 top-[38px] transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </div>

                        {/* Cust.Style */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                CUST STYLE <span className="text-red-500 font-bold">*</span> :
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.custStyle || ''}
                                onChange={(e) => handleInputChange("custStyle", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="Auto-filled Cust"
                            />
                        </div>

                        {/* Fabric Color - multi-select from order fabricContent (like COLOR dropdown) or type manually; disabled when form is completed */}
                        <div className="relative fabric-dropdown-container">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fabric Color <span className="text-red-500 font-bold">*</span>
                                {fabricOptions.length > 0 && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                                )}
                            </label>
                            {fabricOptions.length > 0 ? (
                                <>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            disabled={isCompleting}
                                            onClick={() => !isCompleting && setShowFabricDropdown(!showFabricDropdown)}
                                            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between ${isCompleting ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-600 opacity-90' : ''}`}
                                        >
                                            <span className="truncate">
                                                {selectedFabricColors.length === 0
                                                    ? "Select fabric(s)"
                                                    : selectedFabricColors.length === fabricOptions.length
                                                        ? "All fabrics selected"
                                                        : `${selectedFabricColors.length} fabric(s) selected`}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 transition-transform flex-shrink-0 ${showFabricDropdown ? "rotate-180" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {showFabricDropdown && !isCompleting && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("fabricColor", [...fabricOptions])}
                                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("fabricColor", [])}
                                                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="p-2">
                                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Available Fabrics:
                                                    </div>
                                                    <div className="space-y-1">
                                                        {fabricOptions.map((label, index) => {
                                                            const isSelected = selectedFabricColors.includes(label);
                                                            return (
                                                                <label
                                                                    key={index}
                                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors duration-200 ${isSelected
                                                                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                                                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    handleInputChange("fabricColor", [...selectedFabricColors, label]);
                                                                                } else {
                                                                                    handleInputChange("fabricColor", selectedFabricColors.filter((c) => c !== label));
                                                                                }
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                                                        />
                                                                        <span className="text-sm font-medium">{label}</span>
                                                                    </div>
                                                                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {selectedFabricColors.length === 0 && (
                                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Select at least one fabric</p>
                                    )}
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={typeof formData.fabricColor === 'string' ? formData.fabricColor : (Array.isArray(formData.fabricColor) ? formData.fabricColor.join(', ') : '')}
                                    onChange={(e) => !isCompleting && handleInputChange("fabricColor", e.target.value)}
                                    readOnly={isCompleting}
                                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${isCompleting ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-600' : ''}`}
                                    required
                                    placeholder="e.g., BLACK"
                                />
                            )}
                        </div>

                        {/* HT. color - read-only, no user input required */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                HT. color
                            </label>
                            <input
                                type="text"
                                value=""
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="—"
                            />
                        </div>

                        {/* HT. Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                HT. Name
                            </label>
                            <input
                                type="text"
                                value={formData.htName || ''}
                                onChange={(e) => handleInputChange("htName", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., LOGO"
                            />
                        </div>

                        {/* Style Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Style Description
                            </label>
                            <input
                                type="text"
                                value={formData.styleDescription || ''}
                                onChange={(e) => handleInputChange("styleDescription", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., LADIES' PANTS"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Report Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Report Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Report Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Report Date <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="relative group ant-datepicker-container">
                                <AntDatePicker
                                    value={formData.reportDate ? dayjs(formData.reportDate) : null}
                                    onChange={(date, dateString) => handleInputChange("reportDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
                                    format="MM/DD/YYYY"
                                    placeholder="mm/dd/yyyy"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-[42px]"
                                    suffixIcon={null}
                                    allowClear
                                    inputReadOnly={true}
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                            </div>
                        </div>

                        {/* Rec. Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rec. Date
                            </label>
                            <div className="relative group ant-datepicker-container">
                                <AntDatePicker
                                    value={formData.recDate ? dayjs(formData.recDate) : null}
                                    onChange={(date, dateString) => handleInputChange("recDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
                                    format="MM/DD/YYYY"
                                    placeholder="mm/dd/yyyy"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-[42px]"
                                    suffixIcon={null}
                                    allowClear
                                    inputReadOnly={true}
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                            </div>
                        </div>

                        {/* Time - 12-hour picker (Ant Design) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <TimePicker
                                value={formData.time ? (() => {
                                    const t = dayjs(formData.time, ['h:mm A', 'HH:mm', 'h:mm a']);
                                    return t.isValid() ? t : null;
                                })() : null}
                                onChange={(date, dateString) => handleInputChange("time", dateString || '')}
                                format="h:mm A"
                                use12Hours
                                placeholder="e.g., 12:21 PM"
                                className="w-full [&_.ant-picker-input>input]:text-left"
                                allowClear
                                inputReadOnly
                                minuteStep={1}
                            />
                        </div>

                        {/* Season */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Season <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.season || ''}
                                onChange={(e) => handleInputChange("season", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., SPRING 2026"
                            />
                        </div>

                        {/* Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Range <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.range || ''}
                                onChange={(e) => handleInputChange("range", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Range"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Fabric & Placement Details */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Fabric & Placement Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Print Placement */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Print Placement <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.printPlacement || ''}
                                onChange={(e) => handleInputChange("printPlacement", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Print placement location"
                            />
                        </div>

                        {/* Fabrication */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fabrication <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.fabrication || ''}
                                onChange={(e) => handleInputChange("fabrication", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., 86% NYLON SUPPLEX 14% LYCRA SPANDEX KNITTED, JERSEY"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Test Method & Equipment */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Test Method & Equipment
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Test Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Test Method <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.testMethod || ''}
                                onChange={(e) => handleInputChange("testMethod", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., 15 cycle washed at 30°c + tumble dry low heat after each cycle washed."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Detergents */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Detergents <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.detergents || ''}
                                    onChange={(e) => handleInputChange("detergents", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g., PERSIL"
                                />
                            </div>

                            {/* Washing Machine */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Washing Machine <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.washingMachine || ''}
                                    onChange={(e) => handleInputChange("washingMachine", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g., Electrolux Front Loading"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 5: Test Parameters */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Requested Parameters by Printer for HT prints
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* HEAT-TEMPERATURE */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                HEAT-TEMPERATURE <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.heatTemperature || ''}
                                onChange={(e) => handleInputChange("heatTemperature", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Temperature"
                            />
                        </div>

                        {/* Washing Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.washingTime || ''}
                                onChange={(e) => handleInputChange("washingTime", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., 15sec."
                            />
                        </div>

                        {/* Washing Pressure */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Pressure <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.washingPressure || ''}
                                onChange={(e) => handleInputChange("washingPressure", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., 3.5 kg"
                            />
                        </div>

                        {/* Washing Temperature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Temperature <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.washingTemperature || ''}
                                onChange={(e) => handleInputChange("washingTemperature", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., 155/165°c"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 6: Print Wash Test Results */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Print Wash Test
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-48">
                                        Test result
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        3 time washing
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        5 times washing
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        10 times washing
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        15 times washing
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Colour change of fabric */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Colour change of fabric
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric3 || PRINT_WASH_TEST_DEFAULTS.colorChangeFabric3}
                                            onChange={(e) => handleInputChange("colorChangeFabric3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric5 || PRINT_WASH_TEST_DEFAULTS.colorChangeFabric5}
                                            onChange={(e) => handleInputChange("colorChangeFabric5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric10 || PRINT_WASH_TEST_DEFAULTS.colorChangeFabric10}
                                            onChange={(e) => handleInputChange("colorChangeFabric10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric15 || PRINT_WASH_TEST_DEFAULTS.colorChangeFabric15}
                                            onChange={(e) => handleInputChange("colorChangeFabric15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                </tr>

                                {/* Colour staining of HT */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Colour staining of HT.
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT3 || PRINT_WASH_TEST_DEFAULTS.colorStainingHT3}
                                            onChange={(e) => handleInputChange("colorStainingHT3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT5 || PRINT_WASH_TEST_DEFAULTS.colorStainingHT5}
                                            onChange={(e) => handleInputChange("colorStainingHT5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT10 || PRINT_WASH_TEST_DEFAULTS.colorStainingHT10}
                                            onChange={(e) => handleInputChange("colorStainingHT10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT15 || PRINT_WASH_TEST_DEFAULTS.colorStainingHT15}
                                            onChange={(e) => handleInputChange("colorStainingHT15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                </tr>

                                {/* Appearance after washing */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Appearance after washing
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing3 || PRINT_WASH_TEST_DEFAULTS.appearanceAfterWashing3}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing5 || PRINT_WASH_TEST_DEFAULTS.appearanceAfterWashing5}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing10 || PRINT_WASH_TEST_DEFAULTS.appearanceAfterWashing10}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing15 || PRINT_WASH_TEST_DEFAULTS.appearanceAfterWashing15}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                </tr>

                                {/* Peel off */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Peel off
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff3 || PRINT_WASH_TEST_DEFAULTS.peelOff3}
                                            onChange={(e) => handleInputChange("peelOff3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff5 || PRINT_WASH_TEST_DEFAULTS.peelOff5}
                                            onChange={(e) => handleInputChange("peelOff5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff10 || PRINT_WASH_TEST_DEFAULTS.peelOff10}
                                            onChange={(e) => handleInputChange("peelOff10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff15 || PRINT_WASH_TEST_DEFAULTS.peelOff15}
                                            onChange={(e) => handleInputChange("peelOff15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                </tr>

                                {/* Fading */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Fading
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading3 || PRINT_WASH_TEST_DEFAULTS.fading3}
                                            onChange={(e) => handleInputChange("fading3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading5 || PRINT_WASH_TEST_DEFAULTS.fading5}
                                            onChange={(e) => handleInputChange("fading5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading10 || PRINT_WASH_TEST_DEFAULTS.fading10}
                                            onChange={(e) => handleInputChange("fading10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading15 || PRINT_WASH_TEST_DEFAULTS.fading15}
                                            onChange={(e) => handleInputChange("fading15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Comments */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Comments: <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.testComments || ''}
                            onChange={(e) => handleInputChange("testComments", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                            placeholder="e.g., Heat-transfer good quality after 15st cycle washed"
                        />
                    </div>
                </div>

                {/* Section 7: Detailed Comments */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Comments:
                    </h3>
                    <div className="space-y-4">
                        {/* BEFORE WASHED */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                BEFORE WASHED:
                            </label>
                            <textarea
                                value={formData.beforeWashed || ''}
                                onChange={(e) => handleInputChange("beforeWashed", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., Heat-transfer sample accepted."
                            />
                        </div>

                        {/* AFTER WASHED */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                AFTER WASHED:
                            </label>
                            <textarea
                                value={formData.afterWashed || ''}
                                onChange={(e) => handleInputChange("afterWashed", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., Heat-transfer was accepted after 15 cycle washed."
                            />
                        </div>

                        {/* WASHING RESULT */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                WASHING RESULT:
                            </label>
                            <textarea
                                value={formData.washingResult || ''}
                                onChange={(e) => handleInputChange("washingResult", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., WASHING TESTING RESULTS PASSED."
                            />
                        </div>
                    </div>
                </div>

                {/* Section 8: Final Results & Approval */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Approval & Final Results
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
                        {/* Final Results */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Final Results
                            </label>
                            <div className="flex items-center gap-3 min-h-[42px]">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("finalResults", "Accepted")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${formData.finalResults === "Accepted"
                                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none scale-[1.02]"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-200"
                                        }`}
                                >
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${formData.finalResults === "Accepted" ? "text-white" : "text-gray-300"}`} />
                                    Accepted
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("finalResults", "Rejected")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${formData.finalResults === "Rejected"
                                        ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none scale-[1.02]"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-200"
                                        }`}
                                >
                                    <XCircle className={`w-4 h-4 shrink-0 ${formData.finalResults === "Rejected" ? "text-white" : "text-gray-300"}`} />
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {/* Checked By */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Checked By
                            </label>
                            <Select
                                showSearch
                                value={formData.checkedBy || undefined}
                                placeholder="Select User"
                                optionFilterProp="label"
                                onChange={(value) => handleInputChange("checkedBy", value)}
                                filterOption={(input, option) =>
                                    (option?.label ?? "")
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                options={checkedByOptions}
                                className="w-full h-[42px]"
                                loading={isLoadingUsers}
                            />
                        </div>

                        {/* Date */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Date
                            </label>
                            <div className="relative group ant-datepicker-container min-h-[42px]">
                                <AntDatePicker
                                    value={formData.finalDate ? dayjs(formData.finalDate) : null}
                                    onChange={(date, dateString) => handleInputChange("finalDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
                                    format="MM/DD/YYYY"
                                    placeholder="mm/dd/yyyy"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-[42px]"
                                    suffixIcon={null}
                                    allowClear
                                    inputReadOnly={true}
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 9: Images & Notes */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Images & Additional Notes
                    </h3>

                    {/* Image Upload */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Images
                            </label>
                            <span className={`text-xs font-medium ${formData.images?.length >= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                {formData.images?.length || 0}/5 images
                            </span>
                        </div>
                        <div className="mt-1">
                            {/* Image Preview Area - compact flex thumbnails */}
                            {formData.images && formData.images.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {formData.images.map((imageFile, index) => {
                                        const imageUrl = URL.createObjectURL(imageFile);
                                        return (
                                            <div
                                                key={index}
                                                className="relative w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 group"
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        URL.revokeObjectURL(imageUrl);
                                                        handleRemoveImage(index);
                                                    }}
                                                    className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                    aria-label="Remove image"
                                                    title="Remove"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 p-8">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        <Upload size={40} className="mx-auto mb-2" />
                                        <p>No image selected</p>
                                    </div>
                                </div>
                            )}

                            {/* Capture and Upload Buttons */}
                            <div className="flex justify-center space-x-2">
                                <button
                                    type="button"
                                    onClick={triggerCameraInput}
                                    disabled={formData.images?.length >= 5}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera size={18} className="mr-2" />
                                    Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    disabled={formData.images?.length >= 5}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={18} className="mr-2" />
                                    Upload
                                </button>
                            </div>

                            {/* Hidden File Inputs */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                multiple
                                onChange={handleFileInputChange}
                            />
                            <input
                                ref={cameraInputRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                capture="environment"
                                onChange={handleCameraInputChange}
                            />
                        </div>
                    </div>

                    {/* Notes Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isCompleting ? "Completion Notes" : "Notes"}
                        </label>
                        <textarea
                            value={isCompleting ? (formData.completionNotes || "") : (formData.notes || "")}
                            onChange={(e) => handleInputChange(isCompleting ? "completionNotes" : "notes", e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                            placeholder={isCompleting ? "Add completion notes..." : "Add any additional notes or comments about this HT test report..."}
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
                        {isSubmitting ? "Submitting..." : isCompleting ? "Complete HT Test Report" : "Submit HT Test Report"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HTTestingForm;
