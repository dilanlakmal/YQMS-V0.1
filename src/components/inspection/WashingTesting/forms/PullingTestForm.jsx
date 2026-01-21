import React, { useState } from "react";
import { Upload, Camera, X, Send, RotateCw, Plus, Trash2, Calendar } from "lucide-react";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";

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
}) => {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
                PULLING TEST REPORT ( APPROVED )
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Basic Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PO# */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                PO# <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.poNumber || ''}
                                onChange={(e) => handleInputChange("poNumber", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="Enter PO Number"
                            />
                        </div>

                        {/* COLOR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                COLOR <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.color || ''}
                                onChange={(e) => handleInputChange("color", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                                placeholder="Enter Color"
                            />
                        </div>

                        {/* BUYER */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                BUYER <span className="text-red-500">*</span>
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
                                DATE <span className="text-red-500">*</span>
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

                        {/* TIME */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                TIME <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.testTime || ''}
                                onChange={(e) => handleInputChange("testTime", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., 10:30 AM"
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

                {/* Section 3: Prepared & Checked By */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                        Approval Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Prepare by */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Prepare by <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.preparedBy || ''}
                                onChange={(e) => handleInputChange("preparedBy", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., CHORIDY"
                            />
                        </div>

                        {/* Check by */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Check by <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.checkedBy || ''}
                                onChange={(e) => handleInputChange("checkedBy", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., ALONG"
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
