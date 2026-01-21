import React from "react";
import { Upload, Camera, X, Send, RotateCw, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";

/**
 * HT Testing (Heat-Transfer Washing Test) Form Component
 * 
 * This form is specifically designed for Heat-Transfer washing tests.
 * It includes fields specific to heat transfer testing like:
 * - Style numbers, fabric colors, HT colors
 * - Test parameters (time, pressure, temperature)
 * - Test method and washing details
 */
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
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Heat-Transfer Washing Test Report Form
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Style Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Style Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Style No. */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Style No.
                            </label>
                            <input
                                type="text"
                                value={formData.styleNo || ''}
                                onChange={(e) => handleInputChange("styleNo", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., PTCOC396"
                            />
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
                                placeholder="e.g., STCO6817"
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
                                placeholder="e.g., BLACK"
                            />
                        </div>

                        {/* HT. color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                HT. color
                            </label>
                            <input
                                type="text"
                                value={formData.htColor || ''}
                                onChange={(e) => handleInputChange("htColor", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="e.g., GREY"
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
                                placeholder="e.g., 12:21PM"
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
                                            value={formData.colorChangeFabric3 || ''}
                                            onChange={(e) => handleInputChange("colorChangeFabric3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric5 || ''}
                                            onChange={(e) => handleInputChange("colorChangeFabric5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric10 || ''}
                                            onChange={(e) => handleInputChange("colorChangeFabric10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorChangeFabric15 || ''}
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
                                            value={formData.colorStainingHT3 || ''}
                                            onChange={(e) => handleInputChange("colorStainingHT3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT5 || ''}
                                            onChange={(e) => handleInputChange("colorStainingHT5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT10 || ''}
                                            onChange={(e) => handleInputChange("colorStainingHT10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="4-5"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.colorStainingHT15 || ''}
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
                                            value={formData.appearanceAfterWashing3 || ''}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing5 || ''}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing10 || ''}
                                            onChange={(e) => handleInputChange("appearanceAfterWashing10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="Accepted"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.appearanceAfterWashing15 || ''}
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
                                            value={formData.peelOff3 || ''}
                                            onChange={(e) => handleInputChange("peelOff3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff5 || ''}
                                            onChange={(e) => handleInputChange("peelOff5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff10 || ''}
                                            onChange={(e) => handleInputChange("peelOff10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.peelOff15 || ''}
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
                                            value={formData.fading3 || ''}
                                            onChange={(e) => handleInputChange("fading3", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading5 || ''}
                                            onChange={(e) => handleInputChange("fading5", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading10 || ''}
                                            onChange={(e) => handleInputChange("fading10", e.target.value)}
                                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                            placeholder="OK"
                                        />
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        <input
                                            type="text"
                                            value={formData.fading15 || ''}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-blue-50/30 dark:bg-gray-700/30 p-5 rounded-2xl border border-blue-100/50 dark:border-gray-600">
                        {/* Final Results Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                Final Results
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("finalResults", "Accepted")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${formData.finalResults === "Accepted"
                                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none scale-[1.02]"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-200"
                                        }`}
                                >
                                    <CheckCircle2 className={`w-4 h-4 ${formData.finalResults === "Accepted" ? "text-white" : "text-gray-300"}`} />
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
                                    <XCircle className={`w-4 h-4 ${formData.finalResults === "Rejected" ? "text-white" : "text-gray-300"}`} />
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {/* Checked by */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Checked by
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={formData.checkedBy || ''}
                                    onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                                    className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition-all text-gray-800 dark:text-white placeholder:font-normal placeholder:text-gray-400"
                                    placeholder="e.g., A LONG"
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
                        <div className="mt-1 space-y-4">
                            {/* Image Preview Area */}
                            {formData.images && formData.images.length > 0 ? (
                                <div className="space-y-4">
                                    {formData.images.map((imageFile, index) => {
                                        const imageUrl = URL.createObjectURL(imageFile);
                                        return (
                                            <div
                                                key={index}
                                                className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 p-3"
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
