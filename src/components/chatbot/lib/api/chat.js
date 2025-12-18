
import { getToken } from "./conversation";
import { API_BASE_URL } from "../../../../../config";

import axios from "axios";


export async function getOllamaResponse(model, messages, tool) {
    const token = getToken();
    if (!token) throw new Error("Token not found!");

    const body = { model, messages, tool };


    const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, body, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 600000 
        });

    return response.data;

}

const getModels = async() => {
    const token = getToken();
    if (!token) throw new Error("Token not found!");
    const response = await axios.get(`${API_BASE_URL}/api/ai/chat`, {
        headers: { Authorization: `Bearer ${token}` },
        });

    return response.data;
}

export {getModels};
