import axios from "axios";
import { getToken } from "../../../Token.js";
// import { API_BASE_URL } from "../../../../../../config.js";

import { API_BASE_URL } from "../../../../../config.js";
const checkToken = () => {
  const token = getToken();
  // if (!token) throw new Error("Token not found!");
  return token
}
const API_BASE = `${API_BASE_URL}/api/ai/production/instruction`

const getCustomerName = async (docId, toLanguages) => {
  const token = checkToken();
  const response = await axios.get(`${API_BASE}/customer/name`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export  {getCustomerName};