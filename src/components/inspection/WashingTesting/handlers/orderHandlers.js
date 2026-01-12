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
        return;
    }

    setIsSearchingOrderNo(true);
    try {
        const suggestions = await searchOrderNoAPI(searchTerm);
        setOrderNoSuggestions(suggestions);
        setShowOrderNoSuggestions(suggestions.length > 0);
    } catch (error) {
        console.error("Error searching Order_No:", error);
        setOrderNoSuggestions([]);
        setShowOrderNoSuggestions(false);
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
    // Use case-insensitive comparison
    const currentStyle = (formData.ymStyle || "").trim().toUpperCase();
    const selectedStyle = (orderNo || "").trim().toUpperCase();

    // If the selected order is the same as typed (even different casing),
    // just update casing and close suggestions without resetting data
    if (selectedStyle === currentStyle) {
        setFormData(prev => ({ ...prev, ymStyle: orderNo }));
        setShowOrderNoSuggestions(false);
        setOrderNoSuggestions([]);

        // Still trigger fetches (hook handles duplicate suppression case-insensitively)
        fetchOrderColors(orderNo, setFormData);
        fetchYorksysOrderETD(orderNo);
        return;
    }

    // Truly new style selected: Clear color, PO, and ETD
    setFormData(prev => ({
        ...prev,
        ymStyle: orderNo,
        color: [],
        po: [],
        exFtyDate: [],
    }));
    setShowOrderNoSuggestions(false);
    setOrderNoSuggestions([]);
    resetOrderData();

    // Fetch colors and ETD for the new style
    await fetchOrderColors(orderNo, setFormData);
    await fetchYorksysOrderETD(orderNo);
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
