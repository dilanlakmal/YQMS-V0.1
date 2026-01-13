import axios from "axios";
import { getToken } from "../../../../Token.js";
// import { API_BASE_URL } from "../../../../../../config.js";
import FormData from "form-data";

const checkToken = () => {
  // const token = getToken();
  // if (!token) throw new Error("Token not found!");
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcwYWIyOTNhZDQ3YzExNjkwODhjNjYiLCJlbWFpbCI6InltODU4MkB5b3JrbWFycy5jb20iLCJuYW1lIjoiU09CT04gTUVOR0hPUk5HIiwiaWF0IjoxNzYzNzA3NzAxLCJleHAiOjE3NjM3MTEzMDF9.NxFO6iils2QesbVKkiolcSwZeUu72gGGcfsprR08qYU"
  return token
}
const API_BASE_URL = "https://localhost:5001";
const API_BASE = `${API_BASE_URL}/api/ai/production/instruction/extraction`

export async function createDoc(file, team, type) {
  const token = checkToken();
  const form = new FormData();
  form.append("file", file);
  form.append("customer", team);
  form.append("type", type);

  const response = await axios.post(
    `${API_BASE}/document`,
    form,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getProduction(docId) {
  const token = checkToken();
  if (!token) throw new Error("Token not found");

  const body = { docId };

  const response = await axios.post(
    `${API_BASE}/page-extraction`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


export async function getOriginLangByPage(docId, pageNumber) {
  const token = checkToken();

  const response = await axios.get(
    `${API_BASE}/page-language`,
    {
      params: {
        docId,
        pageNumber
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}

export async function updateProductionData(documentId, updateData) {
  const token = checkToken();
  const response = await axios.post(
    `${API_BASE}/update-production/${documentId}`,
    updateData, 
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
}

