import handleChatWithOllama, { getModels } from "../services/ollama.service.js";

export const chat = async (req, res) => await handleChatWithOllama(req, res);
export const models = async (req, res) => await getModels(req, res);