import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bot, Send, X, User, Zap, Cpu } from "lucide-react";
import { API_BASE_URL } from "../../config";

const YQMSAIChatBox = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am the YQMS AI Assistant. Ask me anything about cutting inspections."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState("local"); // 'local' or 'gemini'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/ask`, {
        question: userMessage,
        selectedModel: selectedModel // Send the current model choice
      });
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: response.data.answer }
      ]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage =
        error.response?.data?.answer || "Sorry, something went wrong.";
      setMessages((prev) => [...prev, { sender: "bot", text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col z-50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-500 mr-2 flex-shrink-0" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            YQMS AI
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
            >
              <option value="local">Local LLM</option>
              <option value="gemini">Gemini Flash</option>
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              {selectedModel === "local" ? (
                <Cpu size={16} className="text-slate-500" />
              ) : (
                <Zap size={16} className="text-yellow-500" />
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none"
                }`}
              >
                {msg.text.split("\n").map((line, i) => (
                  <p key={i}>
                    {line.startsWith("* ") ? `• ${line.substring(2)}` : line}
                  </p>
                ))}
              </div>
              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="max-w-xs rounded-2xl px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-bl-none">
                <div className="flex items-center space-x-1">
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue}
            className="p-3 rounded-full bg-blue-600 text-white disabled:bg-gray-400 dark:disabled:bg-slate-600 hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default YQMSAIChatBox;
