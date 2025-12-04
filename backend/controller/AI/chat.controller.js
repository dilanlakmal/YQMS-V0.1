import handleChatWithOllama from "./services/ollama.service.js";

export const chat = async(req, res) => await handleChatWithOllama(req, res);