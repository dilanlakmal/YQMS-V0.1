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
        },

        /**
         * Generic update for progress items.
         * @param {string} progressId 
         * @param {Object} data - { status, team, source_language, target_languages }
         */
        updateProgress: async (progressId, data) => {
            const userId = await getUserId();
            return api.patch(`${BASE_PATH}/progress/${userId}/${progressId}`, data);
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
        },

        /**
         * Convert PDF to Image.
         * @param {string} docId 
         */
        convertPdfToImage: async (docId) => {
            const userId = await getUserId();
            return api.post(`${BASE_PATH}/document/${userId}/convert/${docId}`);
        },

        /**
         * Extract fields from an image-extracted document.
         * @param {string} docId 
         * @param {number} pageNumber 
         */
        extractFields: async (docId, pageNumber = 1) => {
            const userId = await getUserId();
            return api.post(`${BASE_PATH}/document/extract/${docId}`, { userId, pageNumber });
        },

        /**
         * Get the processed instruction data for a document.
         * @param {string} docId 
         */
        getInstruction: async (docId) => {
            const userId = await getUserId();
            return api.get(`${BASE_PATH}/document/${userId}/instruction/${docId}`);
        },

        /**
         * Translate document content to target languages.
         * @param {string} instructionId 
         * @param {string[]} targetLanguages 
         */
        translate: async (instructionId, targetLanguages) => {
            const userId = await getUserId();
            return api.post(`${BASE_PATH}/document/translate`, { userId, instructionId, targetLanguages });
        },

        /**
         * Get supported languages for translation.
         */
        getSupportedLanguages: async () => {
            return api.get(`${BASE_PATH}/document/languages`);
        },

        detectLanguage: async (text) => {
            return api.post(`${BASE_PATH}/document/detect`, { text });
        },

        /**
         * Translates a static string.
         * @param {string} text - The text to translate
         * @param {string} toLanguage - Target language code
         */
        translateStatic: async (text, toLanguage) => {
            return api.post(`${BASE_PATH}/document/translate/static`, { text, toLanguage });
        },

        getInstructionById: async (instructionId) => {
            return api.get(`${BASE_PATH}/document/instruction/${instructionId}`);
        },

        getInstractionTranslatedById: async (instructionId, toLanguage) => {
            return api.get(`${BASE_PATH}/document/instruction/${instructionId}/translated/${toLanguage}`);
        },
        /**
         * Update instruction data.
         * @param {string} docId 
         * @param {Object} data 
         */
        updateInstruction: async (docId, data) => {
            const userId = await getUserId();
            return api.patch(`${BASE_PATH}/document/instruction/${docId}`, { userId, data });
        }
    },

    glossary: {
        /**
         * Get glossary entries with optional filters.
         * @param {Object} filters - { sourceLang, targetLang, category, search }
         */
        getEntries: async (filters = {}) => {
            return api.get("/glossary", { params: filters });
        },

        /**
         * Add or update a glossary entry.
         * @param {Object} data - { originalText, sourceLanguageCode, targetLanguageCode, translatedText, category, description }
         */
        addEntry: async (data) => {
            return api.post("/glossary", data);
        },

        /**
         * Delete a glossary entry by ID.
         * @param {string} id 
         */
        deleteEntry: async (id) => {
            return api.delete(`/glossary/${id}`);
        },

        /**
         * Export all translations from an instruction to the glossary.
         * @param {string} instructionId 
         * @param {string} targetLanguageCode 
         */
        exportFromInstruction: async (instructionId, targetLanguageCode) => {
            return api.post("/glossary/export", { instructionId, targetLanguageCode });
        }
    }
};

// Export individual namespaces for backward compatibility if needed, 
// or export the default service object.
export const { progress, customer, document, glossary } = instructionService;
export default instructionService;
