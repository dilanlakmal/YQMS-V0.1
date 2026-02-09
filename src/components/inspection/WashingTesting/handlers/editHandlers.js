/**
 * Edit Handlers
 * Handlers for edit report functionality
 */

import { fetchOrderDetailsAPI, fetchYorksysOrderAPI } from '../services';
import { normalizeDateForInput } from '../helpers';

/**
 * Prepare edit form data from report
 * @param {object} report - Report object
 * @param {function} setEditFormData - State setter
 * @param {function} setEditAvailableColors - State setter
 * @param {function} setEditAvailablePOs - State setter
 * @param {function} setEditAvailableETDs - State setter
 */
export const prepareEditFormData = async (
    report,
    setEditFormData,
    setEditAvailableColors,
    setEditAvailablePOs,
    setEditAvailableETDs
) => {
    // Populate edit form with current report data
    setEditFormData({
        reportType: report.reportType || "Home Wash Test",
        color: report.color || [],
        buyerStyle: report.buyerStyle || "",
        po: report.po || [],
        exFtyDate: report.exFtyDate || [],
        factory: report.factory || "",
        sendToHomeWashingDate: normalizeDateForInput(report.sendToHomeWashingDate),
        careSymbols: report.careSymbols || {},
        careLabelImage: report.careLabelImage || [],
        careLabelNotes: report.careLabelNotes || "",
    });

    // Fetch available options for the report's ymStyle
    if (report.ymStyle) {
        try {
            // Fetch colors
            const orderDetails = await fetchOrderDetailsAPI(report.ymStyle);
            setEditAvailableColors(orderDetails.colors || []);

            // Fetch ETD and PO
            const yorksysData = await fetchYorksysOrderAPI(report.ymStyle);
            setEditAvailablePOs(yorksysData.pos || []);
            setEditAvailableETDs(yorksysData.etds || []);
        } catch (error) {
            console.error("Error fetching order data for edit:", error);
            setEditAvailableColors([]);
            setEditAvailablePOs([]);
            setEditAvailableETDs([]);
        }
    }
};

/**
 * Handle edit form input change
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditFormInputChange = (field, value, editFormData, setEditFormData) => {
    setEditFormData({
        ...editFormData,
        [field]: value
    });
};

/**
 * Handle edit color selection
 * @param {string} color - Color to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditColorSelect = (color, editFormData, setEditFormData) => {
    const currentColors = editFormData.color || [];
    const newColors = currentColors.includes(color)
        ? currentColors.filter(c => c !== color)
        : [...currentColors, color];

    setEditFormData({
        ...editFormData,
        color: newColors
    });
};

/**
 * Handle edit PO selection
 * @param {string} po - PO to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditPOSelect = (po, editFormData, setEditFormData) => {
    const currentPOs = editFormData.po || [];
    const newPOs = currentPOs.includes(po)
        ? currentPOs.filter(p => p !== po)
        : [...currentPOs, po];

    setEditFormData({
        ...editFormData,
        po: newPOs
    });
};

/**
 * Handle edit ETD selection
 * @param {string} etd - ETD to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditETDSelect = (etd, editFormData, setEditFormData) => {
    const currentETDs = editFormData.exFtyDate || [];
    const newETDs = currentETDs.includes(etd)
        ? currentETDs.filter(e => e !== etd)
        : [...currentETDs, etd];

    setEditFormData({
        ...editFormData,
        exFtyDate: newETDs
    });
};
