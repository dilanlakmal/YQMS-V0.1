import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChatList from "../../yqms_chatbot/client/src/components/chatList/ChatList";
import DashboardPage from "../../yqms_chatbot/client/src/routes/dashboardPage/DashboardPage";
import ChatPage from "../../yqms_chatbot/client/src/routes/chatPage/ChatPage";
import "../../yqms_chatbot/client/src/layouts/dashboardLayout/dashboardLayout.css";
import "../../yqms_chatbot/client/src/routes/dashboardPage/dashboardPage.css";
import "../../yqms_chatbot/client/src/routes/chatPage/chatPage.css";
import "../../yqms_chatbot/client/src/components/chatList/chatList.css";
import "../../yqms_chatbot/client/src/components/newPrompt/newPrompt.css";

const basePath = "/ai-agent";

const AIAgent = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dashboardLayout">
        <div className="menu">
          <ChatList basePath={basePath} />
        </div>
        <div className="content">
          <Routes>
            <Route index element={<DashboardPage basePath={basePath} />} />
            <Route path="chats/:id" element={<ChatPage />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default AIAgent;

