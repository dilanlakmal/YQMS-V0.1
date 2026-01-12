/**
 * Validation Helper Functions
 * Form and data validation utilities
 */

import { VALIDATION_RULES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../constants';

/**
 * Validate if YM Style looks complete
 * @param {string} value - YM Style value
 * @returns {boolean} - True if valid
 */
export const isValidYMStyle = (value) => {
    if (!value || value.length < VALIDATION_RULES.MIN_YM_STYLE_LENGTH) {
        return false;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length >= VALIDATION_RULES.MIN_YM_STYLE_LENGTH &&
        /^[A-Za-z]/.test(trimmedValue) &&
        !trimmedValue.includes(':');
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateImageFile = (file) => {
    if (!file) {
        return { isValid: false, error: 'No file provided' };
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        };
    }

    return { isValid: true, error: null };
};

/**
 * Validate form data before submission
 * @param {object} formData - Form data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateFormData = (formData) => {
    const errors = [];

    if (!formData.ymStyle || formData.ymStyle.trim() === '') {
        errors.push('YM Style is required');
    }

    if (!formData.color || formData.color.length === 0) {
        errors.push('At least one color is required');
    }

    if (!formData.sendToHomeWashingDate) {
        errors.push('Send to Home Washing Date is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate edit form data
 * @param {object} editFormData - Edit form data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateEditFormData = (editFormData) => {
    const errors = [];

    if (!editFormData.color || editFormData.color.length === 0) {
        errors.push('At least one color is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Check if image limit is reached
 * @param {number} currentCount - Current image count
 * @param {number} limit - Maximum allowed images
 * @returns {boolean} - True if limit is reached
 */
export const isImageLimitReached = (currentCount, limit) => {
    return currentCount >= limit;
};

/**
 * Calculate available image slots
 * @param {number} currentCount - Current image count
 * @param {number} limit - Maximum allowed images
 * @returns {number} - Number of available slots
 */
export const getAvailableImageSlots = (currentCount, limit) => {
    return Math.max(0, limit - currentCount);
};
