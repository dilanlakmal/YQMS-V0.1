import React from "react";
import Select from "react-select";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";

const EditReportModal = ({
  isOpen,
  editingReport,
  editFormData,
  setEditFormData,
  editAvailableColors,
  editAvailablePOs,
  editAvailableETDs,
  showEditColorDropdown,
  setShowEditColorDropdown,
  showEditPODropdown,
  setShowEditPODropdown,
  showEditETDDropdown,
  setShowEditETDDropdown,
  factories,
  isLoadingFactories,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !editingReport) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Edit Report - {editingReport.ymStyle || "N/A"}
          </h3>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Report Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Type
                </label>
                <select
                  value={editFormData.reportType}
                  onChange={(e) => setEditFormData((prev) => ({
                    ...prev,
                    reportType: e.target.value,
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="Home Wash/Garment Wash Test">Home Wash/Garment Wash Test</option>
                  <option value="HT Testing">HT Testing</option>
                  <option value="EMB testing">EMB testing</option>
                  <option value="Printing Testing">Printing Testing</option>
                  <option value="Pulling Test">Pulling Test</option>
                </select>
              </div>

              {/* Buyer Style - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer Style
                </label>
                <input
                  type="text"
                  value={editFormData.buyerStyle}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                />
              </div>

              {/* Color - Multi-Select */}
              <div className="relative color-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  COLOR <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEditColorDropdown(!showEditColorDropdown)}
                    disabled={editAvailableColors.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {editAvailableColors.length === 0
                        ? "No colors available"
                        : editFormData.color.length === 0
                          ? "Select Color(s)"
                          : editFormData.color.length === editAvailableColors.length
                            ? "All colors selected"
                            : `${editFormData.color.length} color(s) selected`}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showEditColorDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showEditColorDropdown && editAvailableColors.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              color: [...editAvailableColors],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              color: [],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="p-2">
                        {editAvailableColors.map((color, index) => (
                          <label
                            key={index}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.color.includes(color)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    color: [...prev.color, color],
                                  }));
                                } else {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    color: prev.color.filter((c) => c !== color),
                                  }));
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
                  )}
                </div>
              </div>

              {/* PO - Multi-Select */}
              <div className="relative po-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PO <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEditPODropdown(!showEditPODropdown)}
                    disabled={editAvailablePOs.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {editAvailablePOs.length === 0
                        ? "No PO available (Optional)"
                        : editFormData.po.length === 0
                          ? "Select PO(s) (Optional)"
                          : editFormData.po.length === editAvailablePOs.length
                            ? "All PO(s) selected"
                            : `${editFormData.po.length} PO(s) selected`}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showEditPODropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showEditPODropdown && editAvailablePOs.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              po: [...editAvailablePOs],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              po: [],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="p-2">
                        {editAvailablePOs.map((po, index) => (
                          <label
                            key={index}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.po.includes(po)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    po: [...prev.po, po],
                                  }));
                                } else {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    po: prev.po.filter((p) => p !== po),
                                  }));
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
                  )}
                </div>
              </div>

              {/* Ex Fty Date - Multi-Select */}
              <div className="relative etd-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ex Fty Date <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEditETDDropdown(!showEditETDDropdown)}
                    disabled={editAvailableETDs.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {editAvailableETDs.length === 0
                        ? "No ETD dates available (Optional)"
                        : editFormData.exFtyDate.length === 0
                          ? "Select ETD Date(s) (Optional)"
                          : editFormData.exFtyDate.length === editAvailableETDs.length
                            ? "All ETD dates selected"
                            : `${editFormData.exFtyDate.length} date(s) selected`}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showEditETDDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showEditETDDropdown && editAvailableETDs.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              exFtyDate: [...editAvailableETDs],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              exFtyDate: [],
                            }));
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="p-2">
                        {editAvailableETDs.map((etd, index) => (
                          <label
                            key={index}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.exFtyDate.includes(etd)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    exFtyDate: [...prev.exFtyDate, etd],
                                  }));
                                } else {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    exFtyDate: prev.exFtyDate.filter((d) => d !== etd),
                                  }));
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
                  )}
                </div>
              </div>

              {/* Factory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Factory
                </label>
                <Select
                  value={editFormData.factory ? { value: editFormData.factory, label: editFormData.factory } : null}
                  onChange={(selectedOption) => {
                    setEditFormData((prev) => ({
                      ...prev,
                      factory: selectedOption ? selectedOption.value : "",
                    }));
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
              </div>

              {/* Send To Home Washing Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SEND To Home Washing Date
                </label>
                <div className="relative group ant-datepicker-container">
                  <AntDatePicker
                    value={editFormData.sendToHomeWashingDate ? dayjs(editFormData.sendToHomeWashingDate) : null}
                    onChange={(date, dateString) => setEditFormData((prev) => ({
                      ...prev,
                      sendToHomeWashingDate: dateString ? dayjs(date).format('YYYY-MM-DD') : '',
                    }))}
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

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReportModal;

