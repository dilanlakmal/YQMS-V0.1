import React from "react";
import { Upload, Camera, X, Send, RotateCw, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";

/**
 * EMB/Printing Testing Form Component
 * 
 * This form is used for both Embroidery and Printing Washing Tests.
 * 
 * It includes fields specific to embroidery/printing tests like:
 * - EMB/Print colors and names
 * - Test results (color change, staining, cracking, fading)
 * - Detailed comments sections
 */
const EMBTestingForm = ({
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
}) => {
    // Sync fetched data to form
    React.useEffect(() => {
        if (season && season !== '' && (!formData.season || formData.season === '')) handleInputChange('season', season);
        if (styleDescription && styleDescription !== '' && (!formData.styleDescription || formData.styleDescription === '')) handleInputChange('styleDescription', styleDescription);
        if (custStyle && custStyle !== '' && (!formData.custStyle || formData.custStyle === '')) handleInputChange('custStyle', custStyle);
        if (fabrication && fabrication !== '' && (!formData.fabrication || formData.fabrication === '')) handleInputChange('fabrication', fabrication);
    }, [season, styleDescription, custStyle, fabrication]);

    return (
        <div className="space-y-8">

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Style Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Style Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Style No. with Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Style No.
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
                                placeholder="Search Style (e.g., PTCOC376)"
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
                                Cust.Style
                            </label>
                            <input
                                type="text"
                                value={formData.custStyle || ''}
                                onChange={(e) => handleInputChange("custStyle", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., SCL6042CC"
                            />
                        </div>

                        {/* Fabric Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fabric Color
                            </label>
                            <input
                                type="text"
                                value={formData.fabricColor || ''}
                                onChange={(e) => handleInputChange("fabricColor", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., PORT ROYALE"
                            />
                        </div>

                        {/* EMB/Print Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                EMB/Print. Color
                            </label>
                            <input
                                type="text"
                                value={formData.embColor || ''}
                                onChange={(e) => handleInputChange("embColor", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., PORT ROYALE"
                            />
                        </div>

                        {/* EMB/Print Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                EMB/Print. Name
                            </label>
                            <input
                                type="text"
                                value={formData.embName || ''}
                                onChange={(e) => handleInputChange("embName", e.target.value)}
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
                                placeholder="e.g., LADIES' T-SHIRT"
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
                                Report Date
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

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.time || ''}
                                onChange={(e) => handleInputChange("time", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., 9:42AM"
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
                                placeholder="e.g., FALL 2025"
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

                {/* Section 3: Placement & Fabrication */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Placement & Fabrication Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {/* EMB/Print Placement */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                EMB/Print. Placement <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.embPlacement || ''}
                                onChange={(e) => handleInputChange("embPlacement", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Placement location"
                            />
                        </div>

                        {/* Fabrication */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fabrication <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.fabrication || ''}
                                onChange={(e) => handleInputChange("fabrication", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="e.g., 92% COTTON 8% SPANDEX KNITTED FLEECE"
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

                {/* Section 5: Test Results */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        EMB/Print Wash Test Results
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Test Parameter
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        1 time washing
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
                                            value={formData.colorChange1 || ''}
                                            onChange={(e) => handleInputChange("colorChange1", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChange5 || ''}
                                            onChange={(e) => handleInputChange("colorChange5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChange10 || ''}
                                            onChange={(e) => handleInputChange("colorChange10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChange15 || ''}
                                            onChange={(e) => handleInputChange("colorChange15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
                                        />
                                    </td>
                                </tr>

                                {/* Colour staining of EMB/Print */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Colour staining of EMB/Print
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStaining1 || ''}
                                            onChange={(e) => handleInputChange("colorStaining1", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStaining5 || ''}
                                            onChange={(e) => handleInputChange("colorStaining5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStaining10 || ''}
                                            onChange={(e) => handleInputChange("colorStaining10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStaining15 || ''}
                                            onChange={(e) => handleInputChange("colorStaining15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5."
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
                                            value={formData.appearance1 || ''}
                                            onChange={(e) => handleInputChange("appearance1", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearance5 || ''}
                                            onChange={(e) => handleInputChange("appearance5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearance10 || ''}
                                            onChange={(e) => handleInputChange("appearance10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearance15 || ''}
                                            onChange={(e) => handleInputChange("appearance15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                </tr>

                                {/* Cracking */}
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cracking
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.cracking1 || ''}
                                            onChange={(e) => handleInputChange("cracking1", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.cracking5 || ''}
                                            onChange={(e) => handleInputChange("cracking5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.cracking10 || ''}
                                            onChange={(e) => handleInputChange("cracking10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.cracking15 || ''}
                                            onChange={(e) => handleInputChange("cracking15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="N/A"
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
                                            value={formData.fading1 || ''}
                                            onChange={(e) => handleInputChange("fading1", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading5 || ''}
                                            onChange={(e) => handleInputChange("fading5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading10 || ''}
                                            onChange={(e) => handleInputChange("fading10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading15 || ''}
                                            onChange={(e) => handleInputChange("fading15", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Comments row */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test Comments <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.testComments || ''}
                            onChange={(e) => handleInputChange("testComments", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                            placeholder="e.g., Slightly Puckering Along Edge After 15th Time Washed but Marginally Accepted"
                        />
                    </div>
                </div>

                {/* Section 6: Additional Comments */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Detailed Comments
                    </h3>
                    <div className="space-y-4">
                        {/* Before Washed */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                BEFORE WASHED:
                            </label>
                            <textarea
                                value={formData.beforeWashed || ''}
                                onChange={(e) => handleInputChange("beforeWashed", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="BULK COSTCO'S EMBROIDERY BEEN MARGINALLY ACCEPTED COMPARE WITH APPROVAL SAMPLE. MAKE SURE ALL BULK PRODUCTION AS SAME AS YOUR SAMPLE PROVIDED, AND ALWAY REFER TO APPROVAL SAMPLE FOR BETTER QUALITY."
                            />
                        </div>

                        {/* After Washed */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                AFTER WASHED:
                            </label>
                            <textarea
                                value={formData.afterWashed || ''}
                                onChange={(e) => handleInputChange("afterWashed", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="APPEARANCE AFTER WASHED ACCEPTED, NO ABVIOUS CHANGE. PLEASE MAKE IT SURE THAT IN YOUR PRODUCTION IS DOING GOOD QUALITY SO THE QC BUYER WILL NOT GIVE A COMMENT."
                            />
                        </div>

                        {/* Remark */}
                        <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                REMARK:
                            </label>
                            <textarea
                                value={formData.remark || ''}
                                onChange={(e) => handleInputChange("remark", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                                placeholder="PLS. ALWAY REFER TO APPROVAL SAMPLE FOR BETTER QUALITY."
                            />
                        </div>
                    </div>
                </div>

                {/* Section 7: Images & Notes */}
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
                        <div className="mt-1 space-y-4">
                            {/* Image Preview Area */}
                            {formData.images && formData.images.length > 0 ? (
                                <div className="space-y-4">
                                    {formData.images.map((imageFile, index) => {
                                        const imageUrl = URL.createObjectURL(imageFile);
                                        return (
                                            <div
                                                key={index}
                                                className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-gray-800/50 p-3"
                                            >
                                                <div className="relative w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Preview ${index + 1}`}
                                                        className="max-w-xs max-h-64 object-contain rounded-md"
                                                    />
                                                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                URL.revokeObjectURL(imageUrl);
                                                                handleRemoveImage(index);
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                                            aria-label="Remove image"
                                                            title="Remove"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>
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
                            placeholder={isCompleting ? "Add completion notes..." : "Add any additional notes or comments about this test report..."}
                        />
                    </div>
                </div>

                {/* Section 8: Approval & Final Results */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Approval & Final Results
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                        {/* Final Result Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                Final Results
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("finalResult", "Accepted")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${formData.finalResult === "Accepted"
                                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none scale-[1.02]"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-200"
                                        }`}
                                >
                                    <CheckCircle2 className={`w-4 h-4 ${formData.finalResult === "Accepted" ? "text-white" : "text-gray-300"}`} />
                                    Accepted
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("finalResult", "Rejected")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${formData.finalResult === "Rejected"
                                        ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none scale-[1.02]"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-200"
                                        }`}
                                >
                                    <XCircle className={`w-4 h-4 ${formData.finalResult === "Rejected" ? "text-white" : "text-gray-300"}`} />
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {/* Checked By */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Checked by
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={formData.checkedBy || ''}
                                    onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                                    className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 outline-none transition-all text-gray-800 dark:text-white placeholder:font-normal placeholder:text-gray-400"
                                    placeholder="e.g., LONG"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date
                            </label>
                            <div className="relative group ant-datepicker-container">
                                <AntDatePicker
                                    value={formData.checkedDate ? dayjs(formData.checkedDate) : null}
                                    onChange={(date, dateString) => handleInputChange("checkedDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
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
            </form>
        </div>

    );
};

export default EMBTestingForm;
