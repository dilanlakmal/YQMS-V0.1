import React from "react";
import FormSection from "./FormSection";


/**
 * Dynamic Form Section Component
 * 
 * This component renders the appropriate form based on the selected report type.
 * - When completing a scanned report (isCompleting=true): Uses the report's specific form type
 * - When manually creating/editing (isCompleting=false): Always uses the default form
 */
const DynamicFormSection = (props) => {
    // Always use FormSection to ensure consistent header and layout
    // FormSection handles the logic for rendering the specific form component based on reportType and isCompleting
    return <FormSection {...props} />;
};

export default DynamicFormSection;
