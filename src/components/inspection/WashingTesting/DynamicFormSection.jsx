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
 * - When completing a scanned report (isCompleting=true): Uses the report's specific form type
 * - When manually creating/editing (isCompleting=false): Always uses the default form
 */
const DynamicFormSection = ({ formData, isCompleting, ...props }) => {
    const reportType = formData?.reportType || REPORT_TYPES.HOME_WASH;
    const config = getReportTypeConfig(reportType);

    // Map of form components
    const formComponents = {
        HTTestingForm,
        EMBTestingForm,
        PullingTestForm,
    };

    // Only use custom forms when completing a scanned report
    if (isCompleting && !config.useDefaultForm && config.formComponent) {
        const CustomForm = formComponents[config.formComponent];
        if (CustomForm) {
            return <CustomForm formData={formData} isCompleting={isCompleting} {...props} />;
        }
    }

    // Default to standard form for manual creation/editing
    return <FormSection formData={formData} isCompleting={isCompleting} {...props} />;
};

export default DynamicFormSection;
