import { Ollama } from "ollama";
import { getMoNumberTools, getMoNumber } from "../qc_assistance/QC.tools.js";

const abortController = new AbortController();
let toolIsCall = false;
// Main handler for chat requests
const handleChatWithOllama = async (req, res) => {
    const { model, messages, tool } = req.body;
    let apiHost = process.env.OLLAMA_BASE_URL;

    try {
        const ollamaClient = new Ollama({
            host: apiHost,
            headers: {
                Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
            },
            fetch: (url, options) =>
                fetch(url, {
                    ...options,
                    signal: abortController.signal,
                }),
        });

        let updatedMessages;
        if (tool){
            updatedMessages = await selectToolForMessages(messages, ollamaClient);
        } else {
            updatedMessages = [...messages];
        }

        const result = await ollamaClient.chat({
            model,
            messages: updatedMessages,
            stream: false,
            tools: toolIsCall ? getMoNumberTools: null,
        });

        res.status(200).json(result);
        console.log("Request successful:", result);
    } catch (error) {
        console.error("Ollama Error:", error);
        res.status(500).json({ error: error.message || error.toString() });
    }
};

const getModels = async (req, res) => {
    const { model, messages, tool } = req.body;
    let apiHost = process.env.OLLAMA_BASE_URL;

    try {
        const ollamaClient = new Ollama({
            host: apiHost,
            headers: {
                Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
            },
            fetch: (url, options) =>
                fetch(url, {
                    ...options,
                    signal: abortController.signal,
                }),
        });

        const models = await ollamaClient.list();
        return res.json(models);
    } catch (error) {
        console.error("Ollama Error:", error);
        res.status(500).json({ error: error.message || error.toString() });
    }
}

// Extract tool call information from LLM response
const getToolCallFromLLM = (llmResponse) => {
    if (llmResponse?.message?.tool_calls) {
        const toolCall = llmResponse.message.tool_calls[0]; // Use first tool call
        console.log("Tool call detected:", toolCall);
        toolIsCall = true;
        return toolCall?.function;
    }
    toolIsCall = false;
    return null;
};

// Select and execute tools as needed
const selectToolForMessages = async (messages, ollamaClient) => {
    const executedTools = new Set();

    try {
        const response = await ollamaClient.chat({
            model: "qwen3-vl:2b",
            messages,
            stream: false,
            tools: getMoNumberTools,
        });

        console.log("Tool response from LLM:", response);

        // Keep the assistant message for context
        if (response?.message) {
            messages.push({
                role: 'assistant',
                content: response.message.content, // just the textual content
                thinking: response.message.thinking,
                tool_calls: response.message.tool_calls?.map(tc => ({
                    function: {
                        name: tc.function.name,
                        description: tc.function.description,
                        parameters: tc.function.parameters ?? {}
                    },
                    arguments: tc.arguments ?? {}
                })) || []
            });
        }

        const toolCall = getToolCallFromLLM(response);
        const toolName = toolCall?.name;

        if (toolName && !executedTools.has(toolName)) {
            executedTools.add(toolName);

            let toolResult;
            if (toolName === "getMoNumber") {
                toolResult = await getMoNumber();
            }

            messages.push({
                role: "tool",
                tool_name: toolName,
                content: toolResult ?? "",
            });

            console.log("Messages updated with tool result:", messages);
        }

        return messages;
    } catch (error) {
        console.error("Error selecting tool:", error);
        return messages;
    }
};

export default handleChatWithOllama;
export {getModels};