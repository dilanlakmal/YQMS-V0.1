import { useState } from "react";

import ChatIcon from "../components/chatbot/ChatIcon";
import ChatInterface from "../components/chatbot/ChatInterface";

export default function YQMSAIChatBox({isOpen, setIsOpen}) {

  const initialMessages = [
    {
      id: "1",
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date(),
    },
  ];

  const [activeConversationId, setActiveConversationId] = useState("1");
  const [conversations, setConversations] = useState([
    {
      id: "1",
      title: "New conversation",
      date: "Today",
      messages: initialMessages,
    },
    {
      id: "2",
      title: "React best practices",
      date: "Yesterday",
      messages: [],
    },
    {
      id: "3",
      title: "TypeScript tips",
      date: "Yesterday",
      messages: [],
    },
    {
      id: "4",
      title: "Design patterns",
      date: "Last 7 days",
      messages: [],
    },
    {
      id: "5",
      title: "API integration help",
      date: "Last 7 days",
      messages: [],
    },
  ]);
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const messages = activeConversation?.messages || [];

  return (
    <ChatInterface
      messages={messages}
      initialMessages={initialMessages}
      activeConversationId={activeConversationId}
      setActiveConversationId={setActiveConversationId}
      conversations={conversations}
      setConversations={setConversations}
      onClose={() => setIsOpen(!isOpen)}
    />
  );
}
