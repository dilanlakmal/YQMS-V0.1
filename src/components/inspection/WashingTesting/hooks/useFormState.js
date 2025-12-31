import { useState, useCallback } from "react";

/**
 * Custom hook for form state management
 */
export const useFormState = (initialFormData) => {
  const [formData, setFormData] = useState(initialFormData);

  // Handle input change
  const handleInputChange = useCallback((field, value, onFieldChange) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Call optional callback for field-specific logic
      if (onFieldChange) {
        onFieldChange(field, value, newData, prev);
      }

      return newData;
    });
  }, []);

  // Reset form
  const resetForm = useCallback((defaultData) => {
    setFormData(defaultData || initialFormData);
  }, [initialFormData]);

  return {
    formData,
    setFormData,
    handleInputChange,
    resetForm,
  };
};

