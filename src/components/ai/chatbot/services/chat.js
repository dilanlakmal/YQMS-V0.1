
import { getToken } from "./conversation";
import { API_BASE_URL } from "../../../../../config";

import axios from "axios";


export async function getOllamaResponse(model, messages, tool, onChunk) {
    const token = getToken();
    if (!token) throw new Error("Token not found!");

    const body = { model, messages, tool };

    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error("Network response was not ok");
        if (!response.body) throw new Error("ReadableStream not yet supported in this browser.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                // Parse the SSE format "data: {...}\n\n"
                const lines = chunk.split("\n\n");
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(line.replace("data: ", ""));
                            if (onChunk) onChunk(json);
                        } catch (e) {
                            console.error("Error parsing chunk", e);
                        }
                    }
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Stream Error", error);

        // Enhance error message for better UX
        if (error.message === "Network response was not ok") {
            const enhancedError = new Error("Network response was not ok. The AI service may be unavailable or experiencing issues.");
            enhancedError.originalError = error;
            throw enhancedError;
        } else if (error.message === "ReadableStream not yet supported in this browser.") {
            const enhancedError = new Error("ReadableStream not yet supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
            enhancedError.originalError = error;
            throw enhancedError;
        } else if (error.name === "TypeError" && error.message.includes("fetch")) {
            const enhancedError = new Error("Network error: Unable to reach the AI service. Please check your internet connection.");
            enhancedError.originalError = error;
            throw enhancedError;
        }

        throw error;
    }
}

const getModels = async () => {
    const token = getToken();
    if (!token) throw new Error("Token not found!");
    const response = await axios.get(`${API_BASE_URL}/api/ai/chat`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
}

export { getModels };
