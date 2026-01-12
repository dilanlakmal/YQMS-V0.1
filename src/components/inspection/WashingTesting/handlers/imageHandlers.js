/**
 * Image Handlers
 * Centralized image handling logic
 */

import { validateImageFile, isImageLimitReached, getAvailableImageSlots } from '../helpers';
import { IMAGE_LIMITS } from '../constants';
import showToast from '../../../../utils/toast';

/**
 * Handle file input change with validation
 * @param {Event} e - Input change event
 * @param {array} currentImages - Current images array
 * @param {function} setFormData - State setter for form data
 * @param {object} inputRef - File input ref
 * @param {number} limit - Image limit
 */
export const handleFileInputChange = (e, currentImages, setFormData, inputRef, limit = IMAGE_LIMITS.INITIAL) => {
    if (!e.target.files || e.target.files.length === 0) {
        return;
    }

    const currentCount = currentImages?.length || 0;
    const filesToHandle = Array.from(e.target.files);

    // Check if limit already reached
    if (isImageLimitReached(currentCount, limit)) {
        showToast.warning(`Maximum of ${limit} images allowed per section.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
    }

    // Calculate available slots
    const availableSlots = getAvailableImageSlots(currentCount, limit);
    const filesToAdd = filesToHandle.slice(0, availableSlots);

    // Show info if some files were skipped
    if (filesToHandle.length > availableSlots) {
        showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: ${limit}).`);
    }

    // Validate files
    const validFiles = filesToAdd.filter(file => {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            showToast.error(validation.error);
            return false;
        }
        return true;
    });

    // Add valid files
    if (validFiles.length > 0) {
        setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...validFiles],
        }));
    }

    // Clear input
    if (inputRef.current) {
        inputRef.current.value = "";
    }
};

/**
 * Handle camera input change
 * @param {Event} e - Input change event
 * @param {array} currentImages - Current images array
 * @param {function} setFormData - State setter
 * @param {object} inputRef - Camera input ref
 * @param {number} limit - Image limit
 */
export const handleCameraInputChange = (e, currentImages, setFormData, inputRef, limit = IMAGE_LIMITS.INITIAL) => {
    if (!e.target.files || e.target.files.length === 0) {
        return;
    }

    const currentCount = currentImages?.length || 0;

    if (isImageLimitReached(currentCount, limit)) {
        showToast.warning(`Maximum of ${limit} images allowed per section.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
    }

    const validFiles = Array.from(e.target.files).filter(file => {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            showToast.error(validation.error);
            return false;
        }
        return true;
    });

    if (validFiles.length > 0) {
        // Check if total exceeds limit after adding
        const availableSlots = getAvailableImageSlots(currentCount, limit);
        const filesToAdd = validFiles.slice(0, availableSlots);

        if (currentCount + validFiles.length > limit) {
            showToast.warning(`Total images exceed limit of ${limit}. Only the first ones were added.`);
        }

        setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...filesToAdd],
        }));
    }

    if (inputRef.current) {
        inputRef.current.value = "";
    }
};

/**
 * Trigger file input
 * @param {array} currentImages - Current images
 * @param {object} inputRef - File input ref
 * @param {number} limit - Image limit
 * @param {string} section - Section name for error message
 */
export const triggerFileInput = (currentImages, inputRef, limit = IMAGE_LIMITS.INITIAL, section = "Initial Step") => {
    if (isImageLimitReached(currentImages?.length || 0, limit)) {
        showToast.warning(`Maximum of ${limit} images allowed (${section}).`);
        return;
    }

    if (inputRef.current) {
        inputRef.current.removeAttribute("capture");
        inputRef.current.click();
    }
};

/**
 * Trigger camera input
 * @param {array} currentImages - Current images
 * @param {object} inputRef - Camera input ref
 * @param {number} limit - Image limit
 * @param {string} section - Section name for error message
 */
export const triggerCameraInput = (currentImages, inputRef, limit = IMAGE_LIMITS.INITIAL, section = "Initial Step") => {
    if (isImageLimitReached(currentImages?.length || 0, limit)) {
        showToast.warning(`Maximum of ${limit} images allowed (${section}).`);
        return;
    }

    if (inputRef.current) {
        inputRef.current.setAttribute("capture", "environment");
        inputRef.current.click();
    }
};
