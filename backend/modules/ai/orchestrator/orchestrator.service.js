
import dbSchemaService from "../knowledge/db-schema.service.js";
import { ymProdConnection } from "../../../controller/MongoDB/dbConnectionController.js";
import AzureTranslatorService from "../../../services/translation/azure.translator.service.js";
import OllamaProvider from "./providers/ollama-provider.js";

/**
 * Orchestrator Service
 * Handles the "Thought Process" of the AI:
 * 1. Identify Intent (Query DB, Translate, Chat)
 * 2. Select Tool/Collection
 * 3. Execute logic
 * 4. Stream response
 */
class OrchestratorService {
    constructor() {
        // Initialize Provider (could be dependency injected)
        this.aiProvider = new OllamaProvider({
            baseUrl: process.env.OLLAMA_BASE_URL
        });
    }

    /**
     * Main entry point for chat requests
     * @param {Object} req - Express request
     * @param {Object} res - Express response (for streaming)
     */
    async handleChat(req, res) {
        const { messages, model, stream = true } = req.body;
        const lastMessage = messages[messages.length - 1].content;

        // 1. Setup Streaming Headers
        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
        }

        const sendEvent = (type, data) => {
            if (stream) {
                res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
            }
        };

        try {
            await this.aiProvider.initialize();

            // 2. Intent Classification
            sendEvent("thought", "Analyzing User Intent...");

            const intent = await this.classifyIntent(lastMessage, model);
            sendEvent("thought", `Intent Detected: ${intent}`);

            if (intent === "TRANSLATION") {
                await this.handleTranslationFlow(lastMessage, model, sendEvent);
            } else if (intent === "DATABASE_QUERY") {
                await this.handleDatabaseFlow(lastMessage, model, sendEvent);
            } else {
                // General Chat
                sendEvent("thought", "Generating Response...");
                const response = await this.aiProvider.chat(messages, { model, stream: true });

                // Stream the response chunks associated with the final answer
                for await (const part of response) {
                    sendEvent("chunk", part.message.content);
                }
            }

            // End stream
            if (stream) res.end();
            else res.json({ status: "done" }); // Fallback for non-stream

        } catch (error) {
            console.error("Orchestrator Error:", error);
            sendEvent("error", error.message);
            res.end();
        }
    }

    /**
     * Gets available models from the provider
     */
    async getModels(req, res) {
        try {
            await this.aiProvider.initialize();
            const result = await this.aiProvider.listModels();
            res.json(result);
        } catch (error) {
            console.error("Orchestrator getModels Error:", error);
            res.status(500).json({ message: "Failed to fetch models", error: error.message });
        }
    }

    /**
     * step 1: Classify provided text
     */
    async classifyIntent(text, model) {
        const prompt = `
        Classify the user's intent into one of these categories:
        1. DATABASE_QUERY: User is asking for data, reports, defects, quantities, MO numbers, or records from the system.
        2. TRANSLATION: User explicitly asks to translate text.
        3. GENERAL_CHAT: Anything else (greetings, general questions, coding help, etc.).

        User Input: "${text}"

        Return ONLY the category name.
        `;

        const response = await this.aiProvider.chat([{ role: "user", content: prompt }], { model, stream: false });
        return response.message.content.trim().toUpperCase().replace(/[^A-Z_]/g, "");
    }

    /**
     * Flow for Database Queries
     */
    async handleDatabaseFlow(query, model, sendEvent) {
        // Step 2.1: Select Collection
        sendEvent("thought", "Selecting relevant Database Collection...");

        const availableCollections = dbSchemaService.getAvailableCollections();
        const collectionPrompt = `
        You are a Database Expert. Select the ONE most relevant MongoDB collection for this query.
        Available Collections: ${availableCollections.join(", ")}
        
        Query: "${query}"
        
        Return ONLY the Collection Name. If none match, return "NONE".
        `;

        const collectionRes = await this.aiProvider.chat([{ role: "user", content: collectionPrompt }], { model });
        const collectionName = collectionRes.message.content.trim();

        if (collectionName === "NONE" || !availableCollections.includes(collectionName)) {
            sendEvent("thought", "No specific collection matched. Creating general response.");
            sendEvent("chunk", "I couldn't find a specific database table for that request. Could you be more specific?");
            return;
        }

        sendEvent("thought", `Selected Collection: ${collectionName}`);

        // Step 2.2: Analyze Schema
        sendEvent("thought", `Analyzing logic for ${collectionName}...`);
        const schema = dbSchemaService.getModelSchema(collectionName);

        // Step 2.3: Build Query
        sendEvent("thought", "Constructing Database Query...");
        const queryPrompt = `
        You are a MongoDB Expert. Write a MongoDB find query (filter object) or aggregation pipeline for this request.
        Collection: ${collectionName}
        Schema (Fields: Type): ${JSON.stringify(schema, null, 2)}
        User Request: "${query}"

        Return PURE JSON only. No markdown. 
        If it's a find query, return object: { "filter": {...} }
        If it's an aggregation, return object: { "pipeline": [...] }
        `;

        const queryRes = await this.aiProvider.chat([{ role: "user", content: queryPrompt }], { model });
        let dbQuery;
        try {
            // Clean markdown if present
            const cleanJson = queryRes.message.content.replace(/```json/g, "").replace(/```/g, "").trim();
            dbQuery = JSON.parse(cleanJson);
        } catch (e) {
            sendEvent("error", "Failed to generate valid query.");
            return;
        }

        // Step 2.4: Execute
        sendEvent("thought", "Executing Query...");
        let results;
        try {
            const dbModel = (await import("../../../controller/MongoDB/dbConnectionController.js"))[collectionName];
            if (!dbModel) throw new Error("Model import failed");

            if (dbQuery.pipeline) {
                results = await dbModel.aggregate(dbQuery.pipeline).limit(50); // Safety limit
            } else {
                results = await dbModel.find(dbQuery.filter || {}).limit(20);
            }
        } catch (e) {
            sendEvent("error", `Query Execution Failed: ${e.message}`);
            return;
        }

        // Step 2.5: Summarize Results
        sendEvent("thought", `Found ${Array.isArray(results) ? results.length : 1} results. Summarizing...`);
        const summaryPrompt = `
        Summarize these database results for the user: "${query}"
        
        Results: ${JSON.stringify(results).substring(0, 5000)} (truncated if too long)
        `;

        const summaryRes = await this.aiProvider.chat([{ role: "user", content: summaryPrompt }], { model, stream: true });

        for await (const part of summaryRes) {
            sendEvent("chunk", part.message.content);
        }
    }

    async handleTranslationFlow(text, model, sendEvent) {
        sendEvent("thought", "Identifying source and target languages...");

        const extractPrompt = `
        Extract the text the user wants to translate and the target language code.
        Example target codes: 'en' (English), 'zh-Hans' (Chinese Simplified), 'km' (Khmer), 'vi' (Vietnamese).
        User Input: "${text}"
        
        Return JSON: { "text": "...", "to": "..." }
        `;

        const extraction = await this.aiProvider.generate(extractPrompt, "json", { model });
        let data;
        try {
            data = JSON.parse(extraction);
        } catch (e) {
            sendEvent("chunk", "I understood you want a translation, but I couldn't parse the details.");
            return;
        }

        sendEvent("thought", `Translating to ${data.to} via Azure...`);

        try {
            const translatedText = await AzureTranslatorService.translateText(data.text, null, data.to);
            sendEvent("chunk", translatedText);
        } catch (error) {
            sendEvent("thought", "Azure translation failed, falling back to AI...");
            const transRes = await this.aiProvider.chat([
                { role: "user", content: `Translate this to ${data.to}: ${data.text}` }
            ], { model, stream: true });

            for await (const part of transRes) {
                sendEvent("chunk", part.message.content);
            }
        }
    }
}

export default new OrchestratorService();
