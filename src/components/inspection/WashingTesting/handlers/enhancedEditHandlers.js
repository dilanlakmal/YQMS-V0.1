/**
 * Enhanced Edit Handlers
 * Additional handlers for edit operations
 */

import { updateReportAPI, updateReportImagesAPI } from '../services';
import { validateEditFormData } from '../helpers';
import showToast from '../../../../utils/toast';

/**
 * Handle edit form submission
 * @param {Event} e - Form event
 * @param {object} editingReport - Report being edited
 * @param {object} editFormData - Form data
 * @param {function} fetchReports - Refresh reports
 * @param {function} setShowEditModal - Modal state setter
 * @param {function} resetEditState - Reset edit state function
 */
export const handleEditFormSubmit = async (
    e,
    editingReport,
    editFormData,
    fetchReports,
    setShowEditModal,
    resetEditState
) => {
    e.preventDefault();

    if (!editingReport) return;

    // Validate
    const validation = validateEditFormData(editFormData);
    if (!validation.isValid) {
        validation.errors.forEach(err => showToast.warning(err));
        return;
    }

    try {
        const formDataToSubmit = new FormData();

        // Add form fields
        formDataToSubmit.append("reportType", editFormData.reportType || "Home Wash Test");
        formDataToSubmit.append("color", JSON.stringify(editFormData.color || []));
        formDataToSubmit.append("buyerStyle", editFormData.buyerStyle || "");
        formDataToSubmit.append("po", JSON.stringify(editFormData.po || []));
        formDataToSubmit.append("exFtyDate", JSON.stringify(editFormData.exFtyDate || []));
        formDataToSubmit.append("factory", editFormData.factory || "");
        formDataToSubmit.append("sendToHomeWashingDate", editFormData.sendToHomeWashingDate || "");

        // Care Label Information (if applicable)
        if (editFormData.careSymbols) {
            const symbolsValue = typeof editFormData.careSymbols === 'string'
                ? editFormData.careSymbols
                : JSON.stringify(editFormData.careSymbols);
            formDataToSubmit.append("careSymbols", symbolsValue);
        }
        if (editFormData.careLabelNotes) {
            formDataToSubmit.append("careLabelNotes", editFormData.careLabelNotes || "");
        }

        // Handle careLabelImage
        if (editFormData.careLabelImage) {
            if (Array.isArray(editFormData.careLabelImage)) {
                // New files
                editFormData.careLabelImage.forEach(item => {
                    if (item instanceof File) {
                        formDataToSubmit.append("careLabelImage", item);
                    }
                });
                // Existing URLs
                const existingUrls = editFormData.careLabelImage.filter(item => typeof item === 'string');
                if (existingUrls.length > 0) {
                    formDataToSubmit.append("careLabelImageUrls", JSON.stringify(existingUrls));
                }
            } else if (editFormData.careLabelImage instanceof File) {
                formDataToSubmit.append("careLabelImage", editFormData.careLabelImage);
            } else if (typeof editFormData.careLabelImage === 'string') {
                formDataToSubmit.append("careLabelImageUrls", JSON.stringify([editFormData.careLabelImage]));
            }
        }

        const reportId = editingReport._id || editingReport.id;
        const result = await updateReportAPI(reportId, formDataToSubmit);

        if (result.success) {
            showToast.success("Report updated successfully!");
            await fetchReports();
            setShowEditModal(false);
            resetEditState();
        }
    } catch (error) {
        console.error("Error updating report:", error);
        showToast.error(error.message || "An error occurred while updating the report. Please try again.");
    }
};

/**
 * Handle image update for edit modals
 * @param {object} editingImageReport - Report being edited
 * @param {string} editingImageType - Image type ('initial', 'received', 'completion')
 * @param {array} editingImages - Images to update
 * @param {string} editingNotes - Notes to update
 * @param {function} setIsUpdatingImages - Loading state setter
 * @param {function} fetchReports - Refresh reports
 * @param {function} closeModal - Close modal function
 */
export const handleImageUpdateSubmit = async (
    editingImageReport,
    editingImageType,
    editingImages,
    editingNotes,
    setIsUpdatingImages,
    fetchReports,
    closeModal
) => {
    if (!editingImageReport || !editingImageType) return;

    setIsUpdatingImages(true);

    try {
        const formData = new FormData();

        // Add new image files (File objects)
        const newFiles = editingImages.filter(img => img instanceof File);
        newFiles.forEach((file) => {
            formData.append('images', file);
        });

        // Add existing image URLs
        const existingUrls = editingImages.filter(img => typeof img === 'string');
        formData.append('existingImages', JSON.stringify(existingUrls));

        // Add notes
        formData.append('notes', editingNotes || '');

        const reportId = editingImageReport._id || editingImageReport.id;
        const result = await updateReportImagesAPI(reportId, editingImageType, formData);

        if (result.success) {
            showToast.success("Images updated successfully!");
            await fetchReports();
            closeModal();
        }
    } catch (error) {
        console.error("Error updating images:", error);
        showToast.error(error.message || "Failed to update images. Please try again.");
    } finally {
        setIsUpdatingImages(false);
    }
};

/**
 * Handle edit image upload (for edit modals)
 * @param {FileList} files - Files to upload
 * @param {string} type - Image type
 * @param {array} currentImages - Current images
 * @param {function} setImages - Image setter
 * @param {number} limit - Image limit
 */
export const handleEditImageUpload = (files, type, currentImages, setImages, limit = 5) => {
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
