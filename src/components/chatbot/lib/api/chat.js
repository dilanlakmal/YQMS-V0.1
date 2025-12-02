
import { getToken } from "./conversation";
import { API_BASE_URL } from "../../../../../config";

import axios from "axios";
// import { Ollama } from "ollama";


export async function getOllamaResponse(model, messages) {

    const token = getToken();

    if (!token) throw Error("Token not found!")

    const body = {
        model: model,
        messages: messages
    }
    const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, body, {
        headers: {Authorization: `Bearer ${token}`}
    })

    return response.data;

}