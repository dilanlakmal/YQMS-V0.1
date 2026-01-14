import React from "react";
import FormSection from "./FormSection";
import HTTestingForm from "./forms/HTTestingForm";
import EMBTestingForm from "./forms/EMBTestingForm";
import PullingTestForm from "./forms/PullingTestForm";
import { REPORT_TYPES, getReportTypeConfig } from "./constants/reportTypes";

/**
 * Dynamic Form Section Component
 * 
 * This component renders the appropriate form based on the selected report type.
 * It acts as a router/factory for different form types.
 * 
 * To add a new report type form:
 * 1. Create the form component in forms/ directory
 * 2. Import it here
 * 3. Add a case in the switch statement OR set formComponent in reportTypes.js config
 */
const DynamicFormSection = ({ formData, ...props }) => {
    const reportType = formData?.reportType || REPORT_TYPES.HOME_WASH;
    const config = getReportTypeConfig(reportType);

    // Map of form components
    const formComponents = {
        HTTestingForm,
        EMBTestingForm,
        PullingTestForm,
        // Add more custom form components here as they are created
    };

    // If a custom form is specified in config, use it
    if (!config.useDefaultForm && config.formComponent) {
        const CustomForm = formComponents[config.formComponent];
        if (CustomForm) {
            return <CustomForm formData={formData} {...props} />;
        }
    }

    // Default to standard form for all report types
    return <FormSection formData={formData} {...props} />;
};

export default DynamicFormSection;
