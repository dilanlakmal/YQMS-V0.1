import api from "./api";
import { fetchUserProfile } from "./userService.js";

const BASE_PATH = "/instruction/translation";

/**
 * Cache userId to avoid refetching on every call.
 * Ideally, this should be handled by a global state manager (Context/Redux).
 */
let cachedUserId = null;

const getUserId = async () => {
    if (cachedUserId) return cachedUserId;
    try {
        const user = await fetchUserProfile();
        cachedUserId = user._id;
        return cachedUserId;
    } catch (error) {
        console.error("Failed to fetch user profile for ID", error);
        throw error;
    }
};

const instructionService = {
    progress: {
        /**
         * Get translation progress for a user and language.
         * @param {string} toLanguage - Target language code (default: "en")
         */
        getProgress: async (toLanguage = "en") => {
            const userId = await getUserId();
            return api.get(`${BASE_PATH}/progress/${userId}/${toLanguage}`);
        },

        /**
         * Update the status of a specific progress item.
         * @param {string} progressId 
         * @param {string} status 
         */
        updateStatus: async (progressId, status = "active") => {
            const userId = await getUserId();
            return api.patch(`${BASE_PATH}/progress/update/${userId}/${progressId}/status`, { status });
        }
    },

    customer: {
        /**
         * Get customer/buyer information.
         */
        getCustomer: async () => {
            return api.get(`${BASE_PATH}/customer`);
        }
    },

    document: {
        /**
         * Upload a document file.
         * @param {Object} file 
         */
        upload: async (file) => {
            console.log("file", file);

            const userId = await getUserId();
            console.log("userId", userId);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", userId);
            console.log("formData", formData);
            // Log the FormData contents for debugging
            console.log("FormData entries:", Array.from(formData.entries()));

            return api.post(`${BASE_PATH}/document/upload`, formData, {
                headers: {
                    // vital: set to undefined to let the browser set the Content-Type with the correct boundary
                    "Content-Type": undefined,
                },
                timeout: 0 // No timeout for large uploads
            });
        },

        /**
         * Get documents for a user.
         * @param {Object} userId 
         */
        getDocsByUser: async () => {
            const userId = await getUserId();
            return api.get(`${BASE_PATH}/document/${userId}`);
        },

        /**
         * Set a document as active.
         * @param {string} docId 
         */
        setActive: async (docId) => {
            const userId = await getUserId();
            return api.patch(`${BASE_PATH}/document/${userId}/active/${docId}`);
        },

        /**
         * Delete a single document by ID.
         * @param {string} docId 
         */
        deleteDoc: async (docId) => {
            const userId = await getUserId();
            return api.delete(`${BASE_PATH}/document/${userId}/${docId}`);
        },

        /**
         * Delete all documents for the current user.
         */
        deleteAllDocs: async () => {
            const userId = await getUserId();
            return api.delete(`${BASE_PATH}/document/${userId}`);
        }
    }
};

// Export individual namespaces for backward compatibility if needed, 
// or export the default service object.
export const { progress, customer, document } = instructionService;
export default instructionService;
