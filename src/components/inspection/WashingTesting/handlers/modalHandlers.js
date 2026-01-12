/**
 * Modal Handlers
 * Centralized modal state management handlers
 */

/**
 * Handle received modal open
 * @param {string} reportId - Report ID
 * @param {object} report - Report object
 * @param {function} setReceivedReportId - State setter
 * @param {function} setReceivedImages - State setter
 * @param {function} setReceivedNotes - State setter
 * @param {function} setShowReceivedModal - State setter
 * @param {function} setShouldUpdateReceivedStatus - State setter
 */
export const handleOpenReceivedModal = (
    reportId,
    report,
    setReceivedReportId,
    setReceivedImages,
    setReceivedNotes,
    setShowReceivedModal,
    setShouldUpdateReceivedStatus
) => {
    setReceivedReportId(reportId);
    setReceivedImages(report?.receivedImages || []);
    setReceivedNotes(report?.receivedNotes || "");
    setShouldUpdateReceivedStatus(!report?.receivedDate);
    setShowReceivedModal(true);
};

/**
 * Handle completion modal open
 * @param {string} reportId - Report ID
 * @param {object} report - Report object
 * @param {function} setCompletionReportId - State setter
 * @param {function} setCompletionImages - State setter
 * @param {function} setCompletionNotes - State setter
 * @param {function} setShowCompletionModal - State setter
 */
export const handleOpenCompletionModal = (
    reportId,
    report,
    setCompletionReportId,
    setCompletionImages,
    setCompletionNotes,
    setShowCompletionModal
) => {
    setCompletionReportId(reportId);
    setCompletionImages(report?.completionImages || []);
    setCompletionNotes(report?.completionNotes || "");
    setShowCompletionModal(true);
};

/**
 * Handle edit images modal open
 * @param {object} report - Report object
 * @param {string} type - Image type ('initial', 'received', 'completion')
 * @param {function} setEditingImageReport - State setter
 * @param {function} setEditingImageType - State setter
 * @param {function} setEditingImages - State setter
 * @param {function} setEditingNotes - State setter
 * @param {function} setShowModal - State setter for the specific modal
 */
export const handleOpenEditImagesModal = (
    report,
    type,
    setEditingImageReport,
    setEditingImageType,
    setEditingImages,
    setEditingNotes,
    setShowModal
) => {
    setEditingImageReport(report);
    setEditingImageType(type);

    // Set images and notes based on type
    if (type === 'initial') {
        setEditingImages(report.images || []);
        setEditingNotes(report.notes || "");
    } else if (type === 'received') {
        setEditingImages(report.receivedImages || []);
        setEditingNotes(report.receivedNotes || "");
    } else if (type === 'completion') {
        setEditingImages(report.completionImages || []);
        setEditingNotes(report.completionNotes || "");
    }

    setShowModal(true);
};

/**
 * Close all modals
 * @param {object} setters - Object containing all modal state setters
 */
export const closeAllModals = (setters) => {
    const {
        setShowReceivedModal,
        setShowCompletionModal,
        setShowEditModal,
        setShowDeleteConfirm,
        setShowEditInitialImagesModal,
        setShowEditReceivedImagesModal,
        setShowEditCompletionImagesModal,
        setShowReportDateQR,
        setShowReportDateScanner
    } = setters;

    if (setShowReceivedModal) setShowReceivedModal(false);
    if (setShowCompletionModal) setShowCompletionModal(false);
    if (setShowEditModal) setShowEditModal(false);
    if (setShowDeleteConfirm) setShowDeleteConfirm(false);
    if (setShowEditInitialImagesModal) setShowEditInitialImagesModal(false);
    if (setShowEditReceivedImagesModal) setShowEditReceivedImagesModal(false);
    if (setShowEditCompletionImagesModal) setShowEditCompletionImagesModal(false);
    if (setShowReportDateQR) setShowReportDateQR(false);
    if (setShowReportDateScanner) setShowReportDateScanner(false);
};
