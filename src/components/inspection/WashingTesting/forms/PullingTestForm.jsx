import React, { useState, useEffect } from "react";
import { Upload, Camera, X, Send, RotateCw, Plus, Trash2, Calendar, Check } from "lucide-react";
import { DatePicker as AntDatePicker, TimePicker, Select } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/**
 * Pulling Test Form Component
 * 
 * This form is used for Pulling Test Reports (Approved).
 * 
 * It includes:
 * - Basic information (PO#, Buyer, Color, Date, Time)
 * - Dynamic test results table (Type, Pulling Force, Pulling Time, Visual Appearance, Results, Remark)
 * - Prepared by and Checked by fields
 */
const PullingTestForm = ({
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
    // Search props
    searchOrderNo,
    orderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    handleOrderNoSelect,
    // Color props
    availableColors = [],
    usedColors = [],
    isLoadingColors = false,
    showColorDropdown,
    setShowColorDropdown,
    // Assignment control props
    users: parentUsers = [],
    isLoadingUsers = false,
    assignHistory,
    causeAssignData,
    washingRoles = [], // NEW: roles from role_management
    // Order data for Fabric Color multi-select
    fabricContent = [],
}) => {
    const [showFabricDropdown, setShowFabricDropdown] = useState(false);

    // When fabricContent is used, treat fabricColor as array of selected labels; otherwise string (same as HT/EMB)
    const fabricOptions = Array.isArray(fabricContent) ? fabricContent.map((f) => `${f.percentageValue ?? ''}% ${f.fabricName ?? ''}`.trim() || `${f.fabricName ?? '—'} (${f.percentageValue ?? '—'}%)`) : [];
    const selectedFabricColors = Array.isArray(formData.fabricColor)
        ? formData.fabricColor
        : (formData.fabricColor ? String(formData.fabricColor).split(',').map((s) => s.trim()).filter(Boolean) : []);

    // Close fabric dropdown when clicking outside
    useEffect(() => {
        if (!showFabricDropdown) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest(".fabric-dropdown-container")) setShowFabricDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFabricDropdown]);

    // Filter colors that have already been reported
    // Filter colors that have already been reported, but ALWAYS include currently selected colors
    const filteredColors = Array.from(new Set([
        ...(availableColors || []),
        ...(Array.isArray(formData.color) ? formData.color : (formData.color ? [formData.color] : []))
    ])).filter(color => {
        const colorStr = String(color).trim().toUpperCase();
        const isAlreadySelected = Array.isArray(formData.color)
            ? formData.color.some(c => String(c).trim().toUpperCase() === colorStr)
            : String(formData.color).trim().toUpperCase() === colorStr;

        const isUsed = usedColors?.some(uc => String(uc).trim().toUpperCase() === colorStr);

        return isAlreadySelected || !isUsed;
    });

    // Use the passed users or fallback
    const users = parentUsers || [];

    // Get options from role_management
    const getFilteredOptions = (field) => {
        const roleMap = { preparedBy: "PreparedBy", checkedBy: "CheckedBy", approvedBy: "ApprovedBy" };
        const roleName = roleMap[field];
        if (!roleName) return [];

        const roleDoc = washingRoles.find(r => r.role === roleName);
        if (!roleDoc || !roleDoc.users || roleDoc.users.length === 0) return [];

        return roleDoc.users.map(u => ({
            value: u.emp_id,
            label: `(${u.emp_id}) ${u.name || u.eng_name || u.emp_id}`,
        }));
    };

    const preparedByOptions = getFilteredOptions('preparedBy');
    const checkedByOptions = getFilteredOptions('checkedBy');

    // Do not pre-fill PREPARED BY / CHECKED BY from assignment; keep default placeholder "Select User"

    // Validate and normalize legacy name to emp_id
    useEffect(() => {
        if (users.length === 0) return;
        if (formData.preparedBy) {
            if (preparedByOptions.some(o => o.value === formData.preparedBy)) return;
            const byName = users.find(u => u.name === formData.preparedBy || formData.preparedBy === `(${u.emp_id}) ${u.name}`);
            if (byName && preparedByOptions.some(o => o.value === byName.emp_id)) {
                handleInputChange('preparedBy', byName.emp_id);
            } else {
                handleInputChange('preparedBy', '');
            }
        }
        if (formData.checkedBy) {
            if (checkedByOptions.some(o => o.value === formData.checkedBy)) return;
            const byName = users.find(u => u.name === formData.checkedBy || formData.checkedBy === `(${u.emp_id}) ${u.name}`);
            if (byName && checkedByOptions.some(o => o.value === byName.emp_id)) {
                handleInputChange('checkedBy', byName.emp_id);
            } else {
                handleInputChange('checkedBy', '');
            }
        }
    }, [users.length, preparedByOptions, checkedByOptions, formData.preparedBy, formData.checkedBy]);

    // Default DATE to current date when empty
    useEffect(() => {
        if (!formData.testDate || formData.testDate === '') {
            handleInputChange('testDate', dayjs().format('YYYY-MM-DD'));
        }
    }, []);

    // Initialize test rows from formData or with one empty row
    const [testRows, setTestRows] = useState(
        formData.testRows && formData.testRows.length > 0
            ? formData.testRows
            : [{
                type: '',
                pullingForce: '',
                pullingTime: '',
                visualAppearance: '',
                results: '',
                remark: '',
            }]
    );

    // Add new test row
    const handleAddRow = () => {
        const newRow = {
            type: '',
            pullingForce: '',
            pullingTime: '',
            visualAppearance: '',
            results: '',
            remark: '',
        };
        const updatedRows = [...testRows, newRow];
        setTestRows(updatedRows);
        handleInputChange('testRows', updatedRows);
    };

    // Remove test row
    const handleRemoveRow = (index) => {
        if (testRows.length > 1) {
            const updatedRows = testRows.filter((_, i) => i !== index);
            setTestRows(updatedRows);
            handleInputChange('testRows', updatedRows);
        }
    };

    // Update test row field
    const handleRowChange = (index, field, value) => {
        const updatedRows = testRows.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        );
        setTestRows(updatedRows);
        handleInputChange('testRows', updatedRows);
    };

    return (
        <div className="space-y-8">

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Basic Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* YM Style */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                YM Style <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.ymStyle || ''}
                                onChange={(e) => handleInputChange("ymStyle", e.target.value)}
                                onFocus={() => {
                                    if (formData.ymStyle?.length >= 2) {
                                        searchOrderNo(formData.ymStyle);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setShowOrderNoSuggestions(false);
                                    }, 200);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && showOrderNoSuggestions && orderNoSuggestions?.length > 0) {
                                        e.preventDefault();
                                        const firstValidSuggestion = orderNoSuggestions.filter(on => on !== formData.ymStyle)[0];
                                        if (firstValidSuggestion) {
                                            if (handleOrderNoSelect) handleOrderNoSelect(firstValidSuggestion);
                                        }
                                    }
                                }}
                                disabled={isCompleting}
                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${isCompleting ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 opacity-60' : ''}`}
                                placeholder="Search from Yorksys"
                            />
                            {isSearchingOrderNo && (
                                <div className="absolute right-3 top-9 text-gray-400">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                            {showOrderNoSuggestions && orderNoSuggestions &&
                                orderNoSuggestions.filter(on => on !== formData.ymStyle).length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {orderNoSuggestions
                                            .filter(orderNo => orderNo !== formData.ymStyle)
                                            .map((orderNo, index) => (
                                                <div
                                                    key={index}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (handleOrderNoSelect) {
                                                            handleOrderNoSelect(orderNo);
                                                        }
                                                    }}
                                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                >
                                                    {orderNo}
                                                </div>
                                            ))}
                                    </div>
                                )}
                        </div>

                        {/* PO# */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                PO# <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.poNumber || ''}
                                onChange={(e) => handleInputChange("poNumber", e.target.value)}
                                disabled={isCompleting}
                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${isCompleting ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 opacity-60' : ''}`}
                                required
                                placeholder="Enter PO Number"
                            />
                        </div>

                        {/* COLOR */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                COLOR <span className="text-red-500 font-bold">*</span>
                            </label>
                            {isCompleting ? (
                                <div
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-700"
                                    title={Array.isArray(formData.color) && formData.color?.length > 0 ? formData.color.join(", ") : ""}
                                >
                                    <span className="truncate block">
                                        {formData.color?.length > 0
                                            ? `${formData.color.length} color(s) selected`
                                            : "No colors selected"}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                                        disabled={isLoadingColors || !formData.ymStyle || (filteredColors.length === 0 && usedColors?.length === 0)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="truncate">
                                            {isLoadingColors
                                                ? "Loading colors..."
                                                : !formData.ymStyle
                                                    ? "Select Style first"
                                                    : formData.color?.length > 0
                                                        ? (Array.isArray(formData.color) && formData.color.length === filteredColors.length && filteredColors.length === availableColors.length
                                                            ? "All colors selected"
                                                            : (Array.isArray(formData.color) && formData.color.length === filteredColors.length
                                                                ? "All available colors selected"
                                                                : `${formData.color.length} color(s) selected`))
                                                        : filteredColors.length === 0 && availableColors?.length > 0
                                                            ? "All colors already reported"
                                                            : filteredColors.length === 0
                                                                ? "No colors available"
                                                                : "Select Color(s)"}
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

                                    {showColorDropdown && (filteredColors.length > 0 || usedColors?.length > 0) && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto font-normal">
                                            {filteredColors.length > 0 && (
                                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange("color", [...filteredColors]);
                                                        }}
                                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange("color", []);
                                                        }}
                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            )}
                                            <div className="p-2">
                                                <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-2 px-1">
                                                    Available Colors:
                                                </div>
                                                <div className="space-y-0.5">
                                                    {filteredColors.map((color, index) => {
                                                        const isSelected = Array.isArray(formData.color)
                                                            ? formData.color.includes(color)
                                                            : formData.color === color;

                                                        return (
                                                            <label
                                                                key={index}
                                                                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected
                                                                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
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
                                                                    <span className="text-sm font-medium">
                                                                        {color}
                                                                    </span>
                                                                </div>
                                                                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                                {usedColors.filter(uc => {
                                                    const ucStr = String(uc).trim().toUpperCase();
                                                    return !formData.color?.some(c => String(c).trim().toUpperCase() === ucStr);
                                                }).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                            <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider px-1">
                                                                Already Reported:
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1 px-1">
                                                                {usedColors.filter(uc => {
                                                                    const ucStr = String(uc).trim().toUpperCase();
                                                                    return !formData.color?.some(c => String(c).trim().toUpperCase() === ucStr);
                                                                }).map((uc, i) => (
                                                                    <div key={i} className="flex items-center gap-1">
                                                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] rounded border border-gray-200 dark:border-gray-600 line-through">
                                                                            {uc}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentColors = Array.isArray(formData.color) ? [...formData.color] : (formData.color ? [formData.color] : []);
                                                                                const ucStr = String(uc).trim().toUpperCase();
                                                                                if (!currentColors.some(c => String(c).trim().toUpperCase() === ucStr)) {
                                                                                    handleInputChange("color", [...currentColors, uc]);
                                                                                }
                                                                            }}
                                                                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full transition-colors"
                                                                            title="Re-select this color"
                                                                        >
                                                                            <RotateCw className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Fabric Color - multi-select from order fabricContent (same as HT/EMB) or type manually */}
                        <div className="relative fabric-dropdown-container">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fabric Color
                                {fabricOptions.length > 0 && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                                )}
                            </label>
                            {fabricOptions.length > 0 ? (
                                <>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowFabricDropdown(!showFabricDropdown)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
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

                                        {showFabricDropdown && (
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
                                    onChange={(e) => handleInputChange("fabricColor", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g., PORT ROYALE"
                                />
                            )}
                        </div>

                        {/* BUYER */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                BUYER <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.buyer || ''}
                                onChange={(e) => handleInputChange("buyer", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="Enter Buyer Name"
                            />
                        </div>

                        {/* DATE */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                DATE <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="relative group ant-datepicker-container">
                                <AntDatePicker
                                    value={formData.testDate ? dayjs(formData.testDate) : null}
                                    onChange={(date, dateString) => handleInputChange("testDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
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

                        {/* TIME - 12-hour picker (Ant Design) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                TIME <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <TimePicker
                                value={formData.testTime ? (() => {
                                    const t = dayjs(formData.testTime, ['h:mm A', 'HH:mm', 'h:mm a']);
                                    return t.isValid() ? t : null;
                                })() : null}
                                onChange={(date, dateString) => handleInputChange("testTime", dateString || '')}
                                format="h:mm A"
                                use12Hours
                                placeholder="e.g., 10:30 AM"
                                className="w-full [&_.ant-picker-input>input]:text-left"
                                allowClear
                                inputReadOnly
                                minuteStep={1}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Test Results Table */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Test Results
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        TYPE
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        PULLING FORCE
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        PULLING TIME
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        VISUAL APPEARANCE AFTER TEST
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        RESULTS
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        REMARK
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {testRows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.type}
                                                onChange={(e) => handleRowChange(index, 'type', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="e.g., Button"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.pullingForce}
                                                onChange={(e) => handleRowChange(index, 'pullingForce', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="e.g., 10kg"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.pullingTime}
                                                onChange={(e) => handleRowChange(index, 'pullingTime', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="e.g., 10sec"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.visualAppearance}
                                                onChange={(e) => handleRowChange(index, 'visualAppearance', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="Describe appearance"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.results}
                                                onChange={(e) => handleRowChange(index, 'results', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="e.g., Pass"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <input
                                                type="text"
                                                value={row.remark}
                                                onChange={(e) => handleRowChange(index, 'remark', e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="Additional notes"
                                            />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(index)}
                                                disabled={testRows.length === 1}
                                                className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Remove row"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 3: Approval Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Approval Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Prepare by */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                PREPARED BY: <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <Select
                                showSearch
                                value={formData.preparedBy || undefined}
                                placeholder="Select User"
                                optionFilterProp="label"
                                onChange={(value) => handleInputChange("preparedBy", value)}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={preparedByOptions}
                                className="w-full h-[42px]"
                                loading={isLoadingUsers}
                            />
                        </div>

                        {/* Check by */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                CHECKED BY: <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <Select
                                showSearch
                                value={formData.checkedBy || undefined}
                                placeholder="Select User"
                                optionFilterProp="label"
                                onChange={(value) => handleInputChange("checkedBy", value)}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={checkedByOptions}
                                className="w-full h-[42px]"
                                loading={isLoadingUsers}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Images & Notes */}
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
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/30 dark:bg-gray-800/30 p-8">
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
                            {isCompleting ? "Completion Notes" : "General Notes"}
                        </label>
                        <textarea
                            value={isCompleting ? (formData.completionNotes || "") : (formData.notes || "")}
                            onChange={(e) => handleInputChange(isCompleting ? "completionNotes" : "notes", e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                            placeholder={isCompleting ? "Add completion notes..." : "Add any additional notes or comments about this pulling test report..."}
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
                        {isSubmitting ? "Submitting..." : "Submit Pulling Test Report"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PullingTestForm;
