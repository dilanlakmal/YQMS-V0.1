import React from "react";
import HTTestingForm from "./forms/HTTestingForm";
import EMBTestingForm from "./forms/EMBTestingForm";
import HomeWashForm from "./forms/HomeWashForm";
import GarmentWashForm from "./forms/GarmentWashForm";
import PullingTestForm from "./forms/PullingTestForm";

const FormSection = ({
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  isCompleting,
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
  availableSizes,
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
  // Report Type dropdown
  isReportTypeOpen,
  setIsReportTypeOpen,
  dropdownRef,
  reportTypeIcons,
  reportTypes,
  // Fabrication data
  fabrication,
  season,
  styleDescription,
  custStyle,
  // ANF Specs
  anfSpecs,
  isLoadingSpecs,
  fetchAnfSpecs,
  causeAssignData, // Added prop
  assignHistory, // Pass full history
  users, // Added prop
  isLoadingUsers, // Added prop
}) => {

  // Common props shared by all forms
  const commonProps = {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    isCompleting,
    handleFileInputChange,
    handleCameraInputChange,
    triggerFileInput,
    triggerCameraInput,
    handleRemoveImage,
    fileInputRef,
    cameraInputRef,
    causeAssignData, // Pass to all forms
    assignHistory, // Pass to all forms
    users, // Pass to all forms
    isLoadingUsers, // Pass to all forms
    // Search props
    searchOrderNo,
    orderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    handleOrderNoSelect,
    // Data props
    season,
    styleDescription,
    custStyle,
    fabrication,
  };

  // Props specific to HomeWashForm (User Inputs & Yorksys Data)
  const homeWashProps = {
    ...commonProps,
    orderNoSuggestions,
    showOrderNoSuggestions,
    setShowOrderNoSuggestions,
    isSearchingOrderNo,
    handleOrderNoSelect,
    searchOrderNo,
    fetchOrderColors,
    fetchYorksysOrderETD,
    availableColors,
    isLoadingColors,
    showColorDropdown,
    setShowColorDropdown,
    availablePOs,
    showPODropdown,
    setShowPODropdown,
    availableETDs,
    showETDDropdown,
    setShowETDDropdown,
    factories,
    isLoadingFactories,
    imageRotations,
    fabrication,
    season,
    styleDescription,
    custStyle,
  };

  const renderForm = () => {
    // If completing a scanned report, render the form matching the report's type
    // Otherwise, always render HomeWashForm (even if user changes report type dropdown)
    if (isCompleting) {
      // Completing a scanned report - use the report's actual type
      switch (formData.reportType) {
        case "HT Testing":
          return <HTTestingForm {...commonProps} />;
        case "EMB/Printing Testing":
        case "EMB Testing": // Handle legacy name if any
          return <EMBTestingForm {...commonProps} />;
        case "Pulling Test":
          return <PullingTestForm {...commonProps} />;
        case "Garment Wash Report":
          return <GarmentWashForm {...commonProps}
            // specific props for GarmentWashForm data fetching
            searchOrderNo={searchOrderNo}
            handleOrderNoSelect={handleOrderNoSelect}
            fetchOrderColors={fetchOrderColors}
            fetchYorksysOrderETD={fetchYorksysOrderETD}
            availableColors={availableColors}
            isLoadingColors={isLoadingColors}
            showOrderNoSuggestions={showOrderNoSuggestions}
            setShowOrderNoSuggestions={setShowOrderNoSuggestions}
            orderNoSuggestions={orderNoSuggestions}
            isSearchingOrderNo={isSearchingOrderNo}
            season={season}
            styleDescription={styleDescription}
            custStyle={custStyle}
            fabrication={fabrication}
            showColorDropdown={showColorDropdown}
            setShowColorDropdown={setShowColorDropdown}
            availableSizes={availableSizes}
            anfSpecs={anfSpecs}
            isLoadingSpecs={isLoadingSpecs}
            fetchAnfSpecs={fetchAnfSpecs}
          />;
        case "Home Wash Test":
        default:
          return <HomeWashForm {...homeWashProps} />;
      }
    } else {
      // Creating new report or manually changing type - always show HomeWashForm
      return <HomeWashForm {...homeWashProps} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      {/* Form Header with Report Type */}
      <div className={`flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row gap-6`}>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white uppercase tracking-tight">
          {formData.reportType === "Home Wash Test" ? "Form Report" : formData.reportType}
        </h2>

        {/* Report Type Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs sm:text-sm font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 whitespace-nowrap">
            Report Type
          </label>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => !isCompleting && setIsReportTypeOpen(!isReportTypeOpen)}
              disabled={isCompleting}
              title={isCompleting ? "Report type cannot be changed when completing a scanned report" : "Select report type"}
              className={`flex items-center justify-between min-w-[200px] sm:min-w-[260px] px-3 sm:px-4 py-2 rounded-xl border-2 transition-all duration-300 shadow-sm text-sm
                ${isCompleting
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
                  : isReportTypeOpen
                    ? 'bg-white dark:bg-gray-800 border-blue-500 ring-4 ring-blue-500/10 shadow-blue-50/50'
                    : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-700 border-blue-200/60 dark:border-gray-600 hover:border-blue-400 hover:shadow-md cursor-pointer'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg ${isCompleting ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {reportTypeIcons && reportTypeIcons[formData.reportType]}
                </span>
                <span className={`font-medium text-[12px] sm:text-[13px] tracking-tight truncate ${isCompleting ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                  {formData.reportType}
                  {isCompleting && <span className="ml-2 text-[10px] text-orange-600 dark:text-orange-400">(Locked)</span>}
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${isCompleting ? 'text-gray-400' : 'text-blue-600'} ${isReportTypeOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isReportTypeOpen && reportTypes && (
              <div className="absolute top-full right-0 mt-1.5 z-50 overflow-hidden bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl rounded-xl border-2 border-blue-100 dark:border-gray-600 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px] sm:min-w-[260px]">
                <div className="p-1.5 space-y-0.5">
                  {reportTypes.map((type) => (
                    <button
                      key={type.val}
                      type="button"
                      onClick={() => {
                        handleInputChange("reportType", type.val);
                        setIsReportTypeOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                        ${formData.reportType === type.val
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <span className={`text-lg ${formData.reportType === type.val ? 'text-white' : 'text-blue-500/70 group-hover:text-blue-600'}`}>
                        {type.icon}
                      </span>
                      <span className={`flex-1 text-left font-semibold text-[11px] ${formData.reportType === type.val ? 'text-white' : ''}`}>
                        {type.val}
                      </span>
                      {formData.reportType === type.val && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the selected form */}
      {renderForm()}
    </div>
  );
};
export default FormSection;
