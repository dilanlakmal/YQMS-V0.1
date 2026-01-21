/**
 * Order Handlers
 * Handlers for order search and selection
 */

import { searchOrderNoAPI } from '../services';
import { isValidYMStyle } from '../helpers';
import { VALIDATION_RULES } from '../constants';

/**
 * Search for Order_No suggestions
 * @param {string} searchTerm - Search term
 * @param {function} setOrderNoSuggestions - State setter for suggestions
 * @param {function} setShowOrderNoSuggestions - State setter for visibility
 * @param {function} setIsSearchingOrderNo - State setter for loading state
 */
export const handleOrderNoSearch = async (
    searchTerm,
    setOrderNoSuggestions,
    setShowOrderNoSuggestions,
    setIsSearchingOrderNo
) => {
    if (!searchTerm || searchTerm.length < VALIDATION_RULES.MIN_ORDER_NO_LENGTH) {
        setOrderNoSuggestions([]);
        setShowOrderNoSuggestions(false);
        return [];
    }

    setIsSearchingOrderNo(true);
    try {
        const suggestions = await searchOrderNoAPI(searchTerm);
        setOrderNoSuggestions(suggestions);
        setShowOrderNoSuggestions(suggestions.length > 0);
        return suggestions;
    } catch (error) {
        console.error("Error searching Order_No:", error);
        setOrderNoSuggestions([]);
        setShowOrderNoSuggestions(false);
        return [];
    } finally {
        setIsSearchingOrderNo(false);
    }
};

/**
 * Handle Order_No selection from suggestions
 * @param {string} orderNo - Selected order number
 * @param {object} formData - Current form data
 * @param {function} setFormData - State setter for form data
 * @param {function} setShowOrderNoSuggestions - State setter for visibility
 * @param {function} setOrderNoSuggestions - State setter for suggestions
 * @param {function} fetchOrderColors - Function to fetch colors
 * @param {function} fetchYorksysOrderETD - Function to fetch ETD
 * @param {function} resetOrderData - Function to reset order data
 */
export const handleOrderNoSelection = async (
    orderNo,
    formData,
    setFormData,
    setShowOrderNoSuggestions,
    setOrderNoSuggestions,
    fetchOrderColors,
    fetchYorksysOrderETD,
    resetOrderData
) => {
    // Determine which field we are using: 'ymStyle' (Home Wash/others) or 'style' (Garment Wash)
    const styleField = formData.style !== undefined ? 'style' : 'ymStyle';

    // Use case-insensitive comparison
    const currentStyle = (formData[styleField] || "").trim().toUpperCase();
    const selectedStyle = (orderNo || "").trim().toUpperCase();

    // If the selected order is the same as typed (even different casing),
    // just update casing and close suggestions without resetting data
    if (selectedStyle === currentStyle) {
        setFormData(prev => ({ ...prev, [styleField]: orderNo }));
        setShowOrderNoSuggestions(false);
        setOrderNoSuggestions([]);

        // Still trigger fetches (hook handles duplicate suppression case-insensitively)
        fetchOrderColors(orderNo, setFormData);
        fetchYorksysOrderETD(orderNo, setFormData);
        return;
    }

    // Truly new style selected: Clear color, PO, and ETD
    setFormData(prev => {
        const newData = {
            ...prev,
            [styleField]: orderNo,
            color: [],
            po: [],
            exFtyDate: [],
            buyerStyle: '',
        };

        // Only clear metadata if it's truly a different core style
        // If we just added a trailing number or corrected casing, we keep the data
        if (selectedStyle !== currentStyle) {
            newData.custStyle = '';
            newData.season = '';
            newData.styleDescription = '';
        }
        return newData;
    });
    setShowOrderNoSuggestions(false);
    setOrderNoSuggestions([]);
    resetOrderData();

    // Fetch colors and ETD for the new style
    await fetchOrderColors(orderNo, setFormData);
    await fetchYorksysOrderETD(orderNo, setFormData);
};

/**
 * Should auto-fetch color data
 * @param {string} value - YM Style value
 * @returns {boolean} - True if should auto-fetch
 */
export const shouldAutoFetchColors = (value) => {
    const trimmedValue = value.trim();
    return isValidYMStyle(trimmedValue) && !trimmedValue.includes(':');
};
