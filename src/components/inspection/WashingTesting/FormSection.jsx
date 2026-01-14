import React from "react";
import { Upload, Camera, X, Send, RotateCw, Calendar } from "lucide-react";
import Select from "react-select";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";

const FormSection = ({
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  // Order No suggestions
  orderNoSuggestions,
  showOrderNoSuggestions,
  setShowOrderNoSuggestions,
  isSearchingOrderNo,
  handleOrderNoSelect,
  searchOrderNo,
  fetchOrderColors,
  fetchYorksysOrderETD,
  // Colors
  availableColors,
  isLoadingColors,
  showColorDropdown,
  setShowColorDropdown,
  // PO
  availablePOs,
  showPODropdown,
  setShowPODropdown,
  // ETD
  availableETDs,
  showETDDropdown,
  setShowETDDropdown,
  // Factory
  factories,
  isLoadingFactories,
  // Images
  handleFileInputChange,
  handleCameraInputChange,
  triggerFileInput,
  triggerCameraInput,
  handleRemoveImage,
  fileInputRef,
  cameraInputRef,
  imageRotations,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Form Report
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* YM Style */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              YM Style
            </label>
            <input
              type="text"
              value={formData.ymStyle}
              onChange={(e) => handleInputChange("ymStyle", e.target.value)}
              onFocus={() => {
                if (formData.ymStyle.length >= 2) {
                  searchOrderNo(formData.ymStyle);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowOrderNoSuggestions(false);
                  // Note: Color fetching is now handled by debounced auto-fetch in handleInputChange
                  // This onBlur is kept only to hide suggestions, not to fetch colors
                  // This prevents duplicate API calls
                }, 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
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
            {showOrderNoSuggestions && orderNoSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {orderNoSuggestions.map((orderNo, index) => (
                  <div
                    key={index}
                    onClick={() => handleOrderNoSelect(orderNo)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                  >
                    {orderNo}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLOR - Multi-Select */}
          <div className="relative color-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              COLOR
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorDropdown(!showColorDropdown)}
                disabled={isLoadingColors || !formData.ymStyle || availableColors.length === 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {isLoadingColors
                    ? "Loading colors..."
                    : !formData.ymStyle
                      ? "Select Order_No first"
                      : availableColors.length === 0
                        ? "No colors available"
                        : formData.color.length === 0
                          ? "Select Color(s)"
                          : formData.color.length === availableColors.length
                            ? "All colors selected"
                            : `${formData.color.length} color(s) selected`}
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

              {showColorDropdown && availableColors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                      {availableColors.map((color, index) => (
                        <label
                          key={index}
                          className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.color.includes(color)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange("color", [...formData.color, color]);
                              } else {
                                handleInputChange("color", formData.color.filter((c) => c !== color));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {color}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {formData.ymStyle && availableColors.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {availableColors.length} color(s) available
              </p>
            )}
          </div>

          {/* Buyer Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buyer Style <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.buyerStyle}
              readOnly
              placeholder="Select YM Style first"
              className="w-full px-3 py-2 border border-gray-300  rounded-md  cursor-not-allowed"
            />
          </div>

          {/* PO - Multi-Select */}
          <div className="relative po-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PO <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPODropdown(!showPODropdown)}
                disabled={!formData.ymStyle}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {!formData.ymStyle
                    ? "Select YM Style first"
                    : availablePOs.length === 0
                      ? "No PO available (Optional)"
                      : formData.po.length === 0
                        ? "Select PO(s) (Optional)"
                        : formData.po.length === availablePOs.length
                          ? "All PO(s) selected"
                          : `${formData.po.length} PO(s) selected`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showPODropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPODropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availablePOs.length > 0 ? (
                    <>
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange("po", [...availablePOs]);
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange("po", []);
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Available PO(s):
                        </div>
                        <div className="space-y-1">
                          {availablePOs.map((po, index) => (
                            <label
                              key={index}
                              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.po.includes(po)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange("po", [...formData.po, po]);
                                  } else {
                                    handleInputChange("po", formData.po.filter((p) => p !== po));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {po}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No PO available. This field is optional.
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.ymStyle && availablePOs.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {availablePOs.length} PO(s) available
              </p>
            )}
          </div>

          {/* Ex Fty Date - Multi-Select */}
          <div className="relative etd-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ex Fty Date <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowETDDropdown(!showETDDropdown)}
                disabled={!formData.ymStyle}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {!formData.ymStyle
                    ? "Select YM Style first"
                    : availableETDs.length === 0
                      ? "No ETD dates available (Optional)"
                      : formData.exFtyDate.length === 0
                        ? "Select ETD Date(s) (Optional)"
                        : formData.exFtyDate.length === availableETDs.length
                          ? "All ETD dates selected"
                          : `${formData.exFtyDate.length} date(s) selected`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showETDDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showETDDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availableETDs.length > 0 ? (
                    <>
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange("exFtyDate", [...availableETDs]);
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange("exFtyDate", []);
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Available ETD Dates:
                        </div>
                        <div className="space-y-1">
                          {availableETDs.map((etd, index) => (
                            <label
                              key={index}
                              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.exFtyDate.includes(etd)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange("exFtyDate", [...formData.exFtyDate, etd]);
                                  } else {
                                    handleInputChange("exFtyDate", formData.exFtyDate.filter((d) => d !== etd));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {etd}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No ETD dates available. This field is optional.
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.ymStyle && availableETDs.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {availableETDs.length} ETD date(s) available
              </p>
            )}
          </div>

          {/* Factory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Factory
            </label>
            <Select
              value={formData.factory ? { value: formData.factory, label: formData.factory } : null}
              onChange={(selectedOption) => {
                handleInputChange("factory", selectedOption ? selectedOption.value : "");
              }}
              options={factories.map((factory) => ({
                value: factory.factory,
                label: factory.factory
              }))}
              placeholder="Select Factory"
              isSearchable={true}
              isClearable={true}
              isLoading={isLoadingFactories}
              isDisabled={isLoadingFactories}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                  boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                  minHeight: '42px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#3b82f6',
                  },
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  zIndex: 9999,
                }),
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  backgroundColor: state.isSelected
                    ? '#3b82f6'
                    : state.isFocused
                      ? '#eff6ff'
                      : '#ffffff',
                  color: state.isSelected ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                  },
                }),
                indicatorSeparator: () => ({
                  display: 'none',
                }),
                dropdownIndicator: (baseStyles) => ({
                  ...baseStyles,
                  cursor: 'pointer',
                }),
                clearIndicator: (baseStyles) => ({
                  ...baseStyles,
                  cursor: 'pointer',
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: '#3b82f6',
                  primary25: '#eff6ff',
                  primary50: '#dbeafe',
                  primary75: '#93c5fd',
                },
              })}
            />
            {isLoadingFactories && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Loading factories...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SEND To Home Washing Date
            </label>
            <div className="relative group ant-datepicker-container">
              <AntDatePicker
                value={formData.sendToHomeWashingDate ? dayjs(formData.sendToHomeWashingDate) : null}
                onChange={(date, dateString) => handleInputChange("sendToHomeWashingDate", dateString ? dayjs(date).format('YYYY-MM-DD') : '')}
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

          {/* Image Upload */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Images
              </label>
              <span className={`text-xs font-medium ${formData.images.length >= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.images.length}/5 images
              </span>
            </div>
            <div className="mt-1 space-y-4">
              {/* Image Preview Area */}
              {formData.images.length > 0 ? (
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
                  disabled={formData.images.length >= 5}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={18} className="mr-2" />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={formData.images.length >= 5}
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
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
              placeholder="Add any additional notes or comments about this report..."
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
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSection;

