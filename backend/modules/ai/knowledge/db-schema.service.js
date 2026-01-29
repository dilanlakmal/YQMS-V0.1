
import * as models from "../../../controller/MongoDB/dbConnectionController.js";

/**
 * Service to inspect database schemas dynamically.
 * Used by the AI to understand available data structures.
 */
class DbSchemaService {
    constructor() {
        this.excludedModels = ["Conversation", "UserMain", "UserProd", "RoleManagment"]; // Security excludes
    }

    /**
     * list all available collections/models that the AI is allowed to query.
     */
    getAvailableCollections() {
        const available = [];
        for (const [key, model] of Object.entries(models)) {
            // Check if it's a mongoose model (has schema) and not excluded
            if (model && model.schema && !this.excludedModels.includes(key)) {
                available.push(key);
            }
        }
        return available;
    }

    /**
     * Get the simplified schema for a specific model.
     * Returns field names and types.
     */
    getModelSchema(modelName) {
        if (this.excludedModels.includes(modelName)) {
            return null;
        }

        const model = models[modelName];
        if (!model || !model.schema) {
            return null;
        }

        const paths = model.schema.paths;
        const schemaSummary = {};

        for (const [path, typeInfo] of Object.entries(paths)) {
            // Skip internal fields usually
            if (path === "__v") continue;

            schemaSummary[path] = typeInfo.instance; // e.g., "String", "Number", "Date"
        }

        return schemaSummary;
    }
}

export default new DbSchemaService();
