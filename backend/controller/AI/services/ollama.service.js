import { Ollama } from "ollama";
import { getMoNumberTools, getMoNumber } from "../qc_assistance/QC.tools.js";

// Reusable Ollama client to avoid creating it on every request
const ollamaClient = new Ollama({
  host: process.env.OLLAMA_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
});

// Optional: cache model capabilities to reduce latency
const modelCapabilitiesCache = new Map();

// Helper: Extract first tool call from LLM response
const getToolCallFromLLM = (llmResponse) => {
  if (llmResponse?.message?.tool_calls?.length > 0) {
    const toolCall = llmResponse.message.tool_calls[0];
    console.log("Tool call detected:", toolCall);
    return toolCall?.function;
  }
  return null;
};

// Main chat handler
const handleChatWithOllama = async (req, res) => {
  const { model, messages, tool } = req.body;
  const abortController = new AbortController(); // per-request abort controller

  try {
    // 1️⃣ Get model capabilities (cached)
    let capabilities = modelCapabilitiesCache.get(model);
    if (!capabilities) {
      const modelInfo = await ollamaClient.show({ model });
      capabilities = modelInfo.capabilities || [];
      modelCapabilitiesCache.set(model, capabilities);
    }
    const toolsEnabled = tool && capabilities.includes("tools");

    // 2️⃣ First LLM call
    const firstResponse = await ollamaClient.chat({
      model,
      messages,
      stream: false,
      tools: toolsEnabled ? getMoNumberTools : null,
      fetch: (url, options) =>
        fetch(url, { ...options, signal: abortController.signal }),
    });

    // 3️⃣ Check for tool calls
    const toolCall = getToolCallFromLLM(firstResponse);

    if (!toolCall) {
      // No tool call → respond immediately
      return res.status(200).json(firstResponse);
    }

    // 4️⃣ Execute tool
    let toolResult;
    if (toolCall.name === "getMoNumber") {
      toolResult = await getMoNumber();
    }

    // 5️⃣ Build follow-up messages with tool result
    const followUpMessages = [
      ...messages,
      firstResponse.message,
      {
        role: "tool",
        tool_name: toolCall.name,
        content: toolResult ?? "",
      },
    ];

    // 6️⃣ Final LLM call with tool results
    const finalResponse = await ollamaClient.chat({
      model,
      messages: followUpMessages,
      stream: false,
    });

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Ollama Error:", error);
    return res.status(500).json({ error: error.message || error.toString() });
  }
};

// Get all available models
const getModels = async (req, res) => {
  try {
    const models = await ollamaClient.list();
    return res.status(200).json(models);
  } catch (error) {
    console.error("Ollama Error:", error);
    return res.status(500).json({ error: error.message || error.toString() });
  }
};

export default handleChatWithOllama;
export { getModels };
