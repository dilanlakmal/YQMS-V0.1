// import { useActionState } from 'react';
import "./dashboardPage.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authJsonFetch } from "../../lib/api";
import { useState } from "react";

const DashboardPage = ({ basePath = "/ai-agent" }) => {

  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (text) => {
      return authJsonFetch("/api/chats", {
        method: "POST",
        body: JSON.stringify({ text })
      });
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      setError("");
      navigate(`${basePath}/chats/${id}`);
    },
    onError: (err) => {
      setError(err.message || "Failed to start chat");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;
    mutation.mutate(text);
  };
  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>YAI ChatBot</h1>
        </div>

        <div className="options">
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Image for YQMS</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Q&A for YQMS</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="text"
            placeholder="Type your message here..."
            disabled={mutation.isPending}
          />
          <button type="submit" disabled={mutation.isPending}>
            <img src="/arrow.png" alt="" />
          </button>
        </form>
        {error && (
          <p style={{ color: "#f87171", marginTop: "8px", fontSize: "14px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
