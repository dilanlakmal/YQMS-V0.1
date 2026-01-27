
/**
 * Abstract Base Class for AI Providers.
 * All specific AI implementations (Ollama, OpenAI, Bedrock, etc.) should extend this.
 */
class AIProvider {
    constructor(config) {
        if (new.target === AIProvider) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.config = config;
    }

    /**
     * Initializes the client (connection check, etc.)
     */
    async initialize() {
        throw new Error("Method 'initialize' must be implemented.");
    }

    /**
     * Standard chat completion
     * @param {Array} messages - [{role: 'user', content: '...'}, ...]
     * @param {Object} options - { temperature, model, etc. }
     */
    async chat(messages, options = {}) {
        throw new Error("Method 'chat' must be implemented.");
    }

    /**
     * Generates text/Json based on a prompt
     * @param {String} prompt 
     * @param {Object} format - JSON Schema or similar
     */
    async generate(prompt, format, options = {}) {
        throw new Error("Method 'generate' must be implemented.");
    }

    /**
     * Handling Vision/Image analysis
     * @param {Array} images - Paths or Base64
     * @param {String} prompt 
     */
    async analyzeImage(images, prompt, format) {
        throw new Error("Method 'analyzeImage' must be implemented.");
    }

    /**
     * Returns list of available models for this provider
     */
    async listModels() {
        throw new Error("Method 'listModels' must be implemented.");
    }
}

export default AIProvider;
