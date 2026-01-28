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
    }
};

// Export individual namespaces for backward compatibility if needed, 
// or export the default service object.
export const { progress, customer } = instructionService;
export default instructionService;
