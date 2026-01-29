import orchestratorService from "../../../modules/ai/orchestrator/orchestrator.service.js";
import { getModels } from "../services/ollama.service.js";

export const chat = async (req, res) => {
    // Determine if we should use the new Orchestrator (default Yes for new flow)
    await orchestratorService.handleChat(req, res);
};
export const models = async (req, res) => await getModels(req, res);