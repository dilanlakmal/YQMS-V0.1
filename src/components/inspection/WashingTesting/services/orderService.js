/**
 * Order Service
 * API calls for order data management
 */

import { API_BASE_URL } from '../../../../../config';
import { parseETDDate } from '../helpers';

/**
 * Search for Order_No (YM Style) suggestions
 * @param {string} searchTerm - Search term
 * @returns {Promise<array>} - Array of order number suggestions
 */
export const searchOrderNoAPI = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }

    const response = await fetch(
        `${API_BASE_URL}/api/washing/search-mono?term=${encodeURIComponent(searchTerm)}`
    );

    if (!response.ok) {
        throw new Error('Failed to search order numbers');
    }

    return await response.json();
};

/**
 * Fetch order details (colors) by YM Style
 * @param {string} ymStyle - YM Style number
 * @returns {Promise<object>} - Order details with colors
 */
export const fetchOrderDetailsAPI = async (ymStyle) => {
    const response = await fetch(
        `${API_BASE_URL}/api/washing/order-details/${encodeURIComponent(ymStyle)}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch order details');
    }

    const orderData = await response.json();

    // Process colors
    const colors = (orderData.colors && Array.isArray(orderData.colors))
        ? orderData.colors.map(c => c.original || c).filter(Boolean)
        : [];

    const uniqueColors = [...new Set(colors)];

    return {
        ...orderData,
        colors: uniqueColors
    };
};

/**
 * Fetch Yorksys order data (PO and ETD) by YM Style
 * @param {string} ymStyle - YM Style number
 * @returns {Promise<object>} - Order data with PO and ETD
 */
export const fetchYorksysOrderAPI = async (ymStyle) => {
    const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(ymStyle)}`
    );

    if (response.status === 404) {
        // Order not found - this is expected if Order_No doesn't match moNo or style
        return { pos: [], etds: [] };
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch Yorksys order: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.SKUData || !Array.isArray(result.data.SKUData)) {
        return { pos: [], etds: [] };
    }

    // Extract ETDs
    const allETDs = result.data.SKUData
        .map(sku => sku.ETD)
        .filter(etd => etd && etd.trim() !== "")
        .map(parseETDDate)
        .filter(Boolean);

    const uniqueETDs = [...new Set(allETDs)].sort();

    // Extract POs
    const allPOLines = result.data.SKUData
        .map(sku => sku.POLine)
        .filter(poline => poline && poline.trim() !== "")
        .map(poline => poline.trim());

    const uniquePOLines = [...new Set(allPOLines)];

    return {
        pos: uniquePOLines,
        etds: uniqueETDs
    };
};

/**
 * Fetch factory list
 * @returns {Promise<array>} - Array of factories
 */
export const fetchFactoriesAPI = async () => {
    const response = await fetch(`${API_BASE_URL}/api/factories`);

    if (!response.ok) {
        throw new Error('Failed to fetch factories');
    }

    return await response.json();
};

/**
 * Fetch order sizes
 * @param {string} ymStyle - YM Style number
 * @returns {Promise<array>} - Array of sizes
 */
export const fetchOrderSizesAPI = async (ymStyle) => {
    const response = await fetch(
        `${API_BASE_URL}/api/washing/order-sizes/${encodeURIComponent(ymStyle)}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch order sizes');
    }

    return await response.json();
};
