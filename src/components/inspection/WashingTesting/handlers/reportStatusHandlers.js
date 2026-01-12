/**
 * Report Status Handlers
 * Handlers for managing report status updates (received, completion)
 */

import { updateReceivedStatusAPI, updateCompletionStatusAPI } from '../services';
import showToast from '../../../../utils/toast';

/**
 * Handle received status submission
 * @param {string} reportId - Report ID
 * @param {array} images - Images array
 * @param {string} notes - Notes text
 * @param {boolean} shouldUpdateStatus - Whether to update received date
 * @param {function} saveReceivedStatus - Hook function to save
 * @param {function} setShowReceivedModal - Modal state setter
 * @param {function} fetchReports - Refresh reports function
 */
export const handleReceivedStatusSubmit = async (
    reportId,
    images,
    notes,
    shouldUpdateStatus,
    saveReceivedStatus,
    setShowReceivedModal,
    fetchReports
) => {
    try {
        const success = await saveReceivedStatus(reportId, images, notes, shouldUpdateStatus);

        if (success) {
            setShowReceivedModal(false);
            await fetchReports();
        }
    } catch (error) {
        console.error('Error saving received status:', error);
        showToast.error('Failed to save received status');
    }
};

/**
 * Handle completion status submission
 * @param {string} reportId - Report ID
 * @param {array} images - Images array
 * @param {string} notes - Notes text
 * @param {function} saveCompletionStatus - Hook function to save
 * @param {function} setShowCompletionModal - Modal state setter
 * @param {function} fetchReports - Refresh reports function
 */
export const handleCompletionStatusSubmit = async (
    reportId,
    images,
    notes,
    saveCompletionStatus,
    setShowCompletionModal,
    fetchReports
) => {
    try {
        const success = await saveCompletionStatus(reportId, images, notes);

        if (success) {
            setShowCompletionModal(false);
            await fetchReports();
        }
    } catch (error) {
        console.error('Error saving completion status:', error);
        showToast.error('Failed to save completion status');
    }
};

/**
 * Handle received image upload
 * @param {FileList} files - Files to upload
 * @param {array} currentImages - Current images
 * @param {function} setImages - Image state setter
 * @param {number} limit - Image limit
 */
export const handleReceivedImageUpload = (files, currentImages, setImages, limit = 5) => {
    if (!files || files.length === 0) return;

    const currentCount = currentImages?.length || 0;
    const filesToHandle = Array.from(files);

    if (currentCount >= limit) {
        showToast.warning(`Maximum of ${limit} images allowed per section.`);
        return;
    }

    const availableSlots = limit - currentCount;
    const filesToAdd = filesToHandle.slice(0, availableSlots);

    if (filesToHandle.length > availableSlots) {
        showToast.info(`Only ${availableSlots} more image(s) can be added (Limit: ${limit}).`);
    }

    setImages([...currentImages, ...filesToAdd]);
};

/**
 * Handle completion image upload
 * @param {FileList} files - Files to upload
 * @param {array} currentImages - Current images
 * @param {function} setImages - Image state setter
 * @param {number} limit - Image limit
 */
export const handleCompletionImageUpload = (files, currentImages, setImages, limit = 5) => {
    handleReceivedImageUpload(files, currentImages, setImages, limit);
};
