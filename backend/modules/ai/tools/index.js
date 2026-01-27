import * as qcHandlers from "./handlers/qc.handlers.js";
import { qcToolsDefinition } from "./definitions/qc.definitions.js";

/**
 * The ToolRegistry maps tool names to their handler functions
 * and provides the JSON definitions for the LLM.
 */

class ToolRegistry {
    constructor() {
        this.handlers = new Map();
        this.definitions = [];

        // Register QC Tools
        this.registerTools(qcToolsDefinition, qcHandlers);

        // FUTURE: Register more modules here
        // this.registerTools(cuttingToolsDefinition, cuttingHandlers);
    }

    registerTools(definitions, handlers) {
        // Add definitions to the list
        this.definitions.push(...definitions);

        // Map definitions to handlers via name
        // Convention: handler name in camelCase (getMoNumbers) 
        // matches definition name in snake_case (get_mo_numbers) converted back/forth
        // Or we just map them explicitly here for safety

        // Example manual mapping for better control
        this.handlers.set("get_mo_numbers", handlers.getMoNumbers);
        this.handlers.set("get_report_summary_by_mo", handlers.getReportSummaryByMO);
    }

    getDefinitions() {
        return this.definitions;
    }

    async callTool(name, args) {
        const handler = this.handlers.get(name);
        if (!handler) {
            throw new Error(`Tool handler for '${name}' not found.`);
        }
        console.log(`AI Tool Execution: ${name}`, args);
        return await handler(args);
    }
}

const toolRegistry = new ToolRegistry();
export default toolRegistry;
