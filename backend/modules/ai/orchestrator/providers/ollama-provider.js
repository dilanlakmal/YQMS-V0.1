
import AIProvider from "../ai-provider.js";
import { Ollama } from "ollama";

class OllamaProvider extends AIProvider {
    constructor(config) {
        super(config);
        this.client = new Ollama({
            host: config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}
        });
        this.modelCapabilities = new Map();
    }

    async initialize() {
        // Optional: Check connection
        try {
            await this.client.list();
            console.log("Ollama Provider Initialized Connected");
            return true;
        } catch (e) {
            console.error("Ollama Connection Failed", e);
            throw e;
        }
    }

    async chat(messages, options = {}) {
        const { model, tools, stream = false, keep_alive = "1h" } = options;

        try {
            const response = await this.client.chat({
                model: model || "llama3", // default
                messages,
                stream,
                tools,
                keep_alive,
                options: {
                    temperature: options.temperature || 0.7
                }
            });
            return response;
        } catch (error) {
            throw new Error(`Ollama Chat Error: ${error.message}`);
        }
    }

    async generate(prompt, format, options = {}) {
        const { model, system } = options;
        try {
            const response = await this.client.generate({
                model: model || "llama3",
                prompt,
                system,
                format,
                stream: false
            });
            return response.response; // Ollama 'generate' returns response in .response field
        } catch (error) {
            throw new Error(`Ollama Generate Error: ${error.message}`);
        }
    }

    /**
     * Specialized method for LLM Extraction similar to current controller
     */
    async extract(text, schema, options = {}) {
        const messages = [
            { role: "system", content: `You are an extraction assistant. Extract data based on the provided JSON Schema.` },
            { role: "user", content: `Data: ${text}` }
        ];

        try {
            const response = await this.client.chat({
                model: options.model || "gpt-oss:20b",
                messages,
                format: schema, // Ollama supports JSON schema as format now
                options: { temperature: 0 }
            });

            // Parse if it's a string, though Ollama usually returns object if format is JSON
            return typeof response.message.content === 'string'
                ? JSON.parse(response.message.content)
                : response.message.content;

        } catch (error) {
            console.error("Ollama Extraction Error", error);
            return null;
        }
    }


    async analyzeImage(images, prompt, format, options = {}) {
        const { model = "llava" } = options;
        const messages = [
            { role: "user", content: prompt, images: images }
        ];

        try {
            const response = await this.client.chat({
                model,
                messages,
                format,
                stream: false,
                options: { temperature: 0 }
            });

            // Handle parsing
            let content = response.message.content;
            if (format === "json" || typeof format === 'object') {
                try {
                    return JSON.parse(content);
                } catch {
                    return content;
                }
            }
            return content;

        } catch (error) {
            throw new Error(`Ollama Vision Error: ${error.message}`);
        }
    }

    async listModels() {
        return await this.client.list();
    }
}

export default OllamaProvider;
