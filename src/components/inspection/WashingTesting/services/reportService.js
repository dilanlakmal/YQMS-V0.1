/**
 * Report Service
 * API calls for report management
 */

import { API_BASE_URL } from '../../../../../config';

/**
 * Fetch washing machine test reports with filters
 * @param {object} filters - Filter parameters
 * @returns {Promise<object>} - Response data
 */
export const fetchReportsAPI = async (filters = {}) => {
    const queryParams = new URLSearchParams();

    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.color) queryParams.append('color', filters.color);
    if (filters.factory) queryParams.append('factory', filters.factory);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const response = await fetch(`${API_BASE_URL}/api/report-washing?${queryParams.toString()}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }

    return await response.json();
};

/**
 * Create a new washing machine test report
 * @param {FormData} formData - Report form data
 * @returns {Promise<object>} - Response data
 */
export const createReportAPI = async (formData) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create report');
    }

    return await response.json();
};

/**
 * Update an existing report
 * @param {string} reportId - Report ID
 * @param {FormData} formData - Updated form data
 * @returns {Promise<object>} - Response data
 */
export const updateReportAPI = async (reportId, formData) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: 'PUT',
        body: formData,
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update report');
        }

        return result;
    } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);

        let errorMessage = `Server error (${response.status}): ${response.statusText}`;
        const preMatch = text.match(/<pre>([^<]+)<\/pre>/i);

        if (preMatch) {
            const errorText = preMatch[1];
            const errorMatch = errorText.match(/Error:\s*([^<]+)/i);

            if (errorMatch) {
                errorMessage = errorMatch[1].trim();
            } else {
                errorMessage = errorText.split('<br>')[0].trim();
            }
        }

        throw new Error(errorMessage);
    }
};

/**
 * Delete a report
 * @param {string} reportId - Report ID to delete
 * @returns {Promise<object>} - Response data
 */
export const deleteReportAPI = async (reportId) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete report');
    }

    return await response.json();
};

/**
 * Update report received status
 * @param {string} reportId - Report ID
 * @param {FormData} formData - Received status data
 * @returns {Promise<object>} - Response data
 */
export const updateReceivedStatusAPI = async (reportId, formData) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}/received`, {
        method: 'PATCH',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update received status');
    }

    return await response.json();
};

/**
 * Update report completion status
 * @param {string} reportId - Report ID
 * @param {FormData} formData - Completion status data
 * @returns {Promise<object>} - Response data
 */
export const updateCompletionStatusAPI = async (reportId, formData) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}/completion`, {
        method: 'PATCH',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update completion status');
    }

    return await response.json();
};

/**
 * Update report images
 * @param {string} reportId - Report ID
 * @param {string} imageType - Type of images ('initial', 'received', 'completion')
 * @param {FormData} formData - Image data
 * @returns {Promise<object>} - Response data
 */
export const updateReportImagesAPI = async (reportId, imageType, formData) => {
    const response = await fetch(`${API_BASE_URL}/api/report-washing/${reportId}/images/${imageType}`, {
        method: 'PATCH',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update images');
    }

    return await response.json();
};
