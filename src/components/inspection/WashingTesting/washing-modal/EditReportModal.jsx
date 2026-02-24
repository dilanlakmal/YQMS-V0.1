import React from "react";
import Select from "react-select";
import { DatePicker as AntDatePicker } from "antd";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useOrderDataStore } from "../../../../stores/washing";

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
  onClose,
  onSubmit,
}) => {
  const { factories, isLoadingFactories } = useOrderDataStore();
  if (!isOpen || !editingReport) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 overflow-y-auto overflow-x-hidden"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[calc(100vh-1.5rem)] my-6 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 pb-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Edit Report - {editingReport.ymStyle || "N/A"}
          </h3>
        </div>
        <div className="p-4 pt-3 overflow-y-auto overflow-x-hidden min-h-0 flex-1">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                  required
                >
                  <option value="Garment Wash Report">Garment Wash Report</option>
                  <option value="HT Testing">HT Testing</option>
                  <option value="EMB testing">EMB testing</option>
                  <option value="Printing Testing">Printing Testing</option>
                  <option value="Pulling Test">Pulling Test</option>
                </select>
              </div>

              {/* YM Style - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YM Style
                </label>
                <input
                  type="text"
                  value={editingReport.ymStyle || editingReport.style || "N/A"}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-not-allowed bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Color - Multi-Select: fixed list = report's colors at open (so unchecking keeps labels visible); read-only when report completed */}
              <MultiSelectDropdown
                containerClass="color-dropdown-container"
                label="COLOR"
                required
                options={
                  (() => {
                    const reportColors = Array.isArray(editingReport.color)
                      ? editingReport.color
                      : editingReport.color
                        ? [editingReport.color]
                        : [];
                    return reportColors.length > 0 ? reportColors : editAvailableColors || [];
                  })()
                }
                selected={editFormData.color}
                onChange={(v) => setEditFormData((p) => ({ ...p, color: v }))}
                isOpen={showEditColorDropdown}
                onToggle={setShowEditColorDropdown}
                emptyText="No colors available"
                placeholder="Select Color(s)"
                allSelectedText="All colors selected"
                countLabel="color(s)"
                readOnly={editingReport?.status === "completed"}
              />

              {/* PO - Multi-Select */}
              <MultiSelectDropdown
                containerClass="po-dropdown-container"
                label="PO (Optional)"
                options={editAvailablePOs}
                selected={editFormData.po}
                onChange={(v) => setEditFormData((p) => ({ ...p, po: v }))}
                isOpen={showEditPODropdown}
                onToggle={setShowEditPODropdown}
                emptyText="No PO available (Optional)"
                placeholder="Select PO(s) (Optional)"
                allSelectedText="All PO(s) selected"
                countLabel="PO(s)"
                readOnly={editingReport?.status === "completed"}
              />

              {/* Ex Fty Date - Multi-Select */}
              <MultiSelectDropdown
                containerClass="etd-dropdown-container"
                label="Ex Fty Date (Optional)"
                options={editAvailableETDs}
                selected={editFormData.exFtyDate}
                onChange={(v) => setEditFormData((p) => ({ ...p, exFtyDate: v }))}
                isOpen={showEditETDDropdown}
                onToggle={setShowEditETDDropdown}
                emptyText="No ETD dates available (Optional)"
                placeholder="Select ETD Date(s) (Optional)"
                allSelectedText="All ETD dates selected"
                countLabel="date(s)"
                readOnly={editingReport?.status === "completed"}
              />

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
            <div className="flex justify-end gap-3 mt-4">
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

