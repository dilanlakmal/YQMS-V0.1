import axios from "axios";
import { API_BASE_URL } from "../../../../config";

// Helper to get token
export const getToken = () =>
  localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

// Fetch user profile
export const fetchUserProfile = async () => {
  const token = getToken();
  if (!token) throw new Error("No token found!");

  const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data;
}


// Fetch conversations for a user
export const fetchUserConversation = async (emp_id) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.get(`${API_BASE_URL}/api/ai/conversation/${emp_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}


// Create a new conversation
export const createConversation = async (conversation) => {
  const token = getToken();
  if (!token) {
    throw new Error("Token not found!");
  };

  const response = await axios.post(`${API_BASE_URL}/api/ai/conversation`, conversation, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
}

// Add new message
export const addMessages = async (conversationID, newMessages) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.post(`${API_BASE_URL}/api/ai/conversation/${conversationID}/addMessage`,
    newMessages,
    {
      headers: `Bearer ${token}`
    }
  );

  return response.data;
}

//DELETE conversation
export const deleteConversation = async (conversationID) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.delete(`${API_BASE_URL}/api/ai/conversation/${conversationID}`, {
    headers: `Bearer ${token}`
  }
  );
  return response.data;
}

// UPDATE conversation title
export const editConversationTitle = async (conversationID, newTitle) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.patch(
    `${API_BASE_URL}/api/ai/conversation/${conversationID}/updateTitle`,
    { title: newTitle },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

// UPDATE conversation model
export const editConversationModel = async (conversationID, newModel) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.patch(
    `${API_BASE_URL}/api/ai/conversation/${conversationID}/updateModel`,
    { model: newModel },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

export const updateConversationStatus = async (conversationID) => {
  const token = getToken();
  if (!token) throw new Error("Token not found!");

  const response = await axios.patch(
    `${API_BASE_URL}/api/ai/conversation/${conversationID}/updateActiveStatus`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};