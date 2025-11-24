import BotHeader from "./BotHeader";
import ChatInput from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { useRef, useEffect } from "react";
import "./style/index.css";
import { addMessages, createConversation } from "./lib/api/conversation";
import { getOllamaResponse } from "./lib/api/chat";

export default function ChatInterface({
  messages,
  userData,
  initialMessages,
  activeConversationId,
  setActiveConversationId,
  conversations,
  setConversations,
  onClose,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNewChat = async () => {
    const newConv = {
      title: "New conversation",
      userID: userData.emp_id,
      date: new Date(),
      messages: [...initialMessages],
    };
    const newConversationCreated = await createConversation(newConv);
    setActiveConversationId(newConversationCreated._id);
    setConversations([newConversationCreated, ...conversations]);
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  setIsLoading(true);

  // 1️⃣ Create user message
  const userMessage = {
    _id: Date.now().toString(),
    role: "user",
    content: input,
    timestamp: new Date(),
  };

  // 2️⃣ Add user message to conversation (local)
  let updatedConversations = conversations.map((conv) =>
    conv._id === activeConversationId
      ? { ...conv, messages: [...conv.messages, userMessage] }
      : conv
  );

  // save user message to backend
  const activeUser = updatedConversations.find(
    (conv) => conv._id === activeConversationId
  );
  if (activeUser) {
    await addMessages(activeConversationId, activeUser.messages);
  }

  // update UI immediately
  setConversations(updatedConversations);
  setInput("");

  try {
    // 3️⃣ Request LLM response
    const data = await getOllamaResponse("gpt-oss:120b-cloud", input);

    const assistantMessage = data
      ? {
          _id: data.created_at.toString(),
          role: data.message.role,
          content: data.message.content,
          timestamp: new Date(),
        }
      : {
          _id: Date.now().toString(),
          role: "assistant",
          content: "No response available right now.",
          timestamp: new Date(),
        };

    // 4️⃣ ADD ASSISTANT MESSAGE using updatedConversations (NOT old state)
    updatedConversations = updatedConversations.map((conv) =>
      conv._id === activeConversationId
        ? { ...conv, messages: [...conv.messages, assistantMessage] }
        : conv
    );

    const activeAssistant = updatedConversations.find(
      (conv) => conv._id === activeConversationId
    );

    if (activeAssistant) {
      await addMessages(activeConversationId, activeAssistant.messages);
    }

    setConversations(updatedConversations);
  } catch (error) {
    console.error("Error:", error);

    const errorMessage = {
      _id: Date.now().toString(),
      role: "assistant",
      content: "Unable to reach the server.",
      timestamp: new Date(),
    };

    // 5️⃣ Again, build from updatedConversations (NOT old state)
    updatedConversations = updatedConversations.map((conv) =>
      conv._id === activeConversationId
        ? { ...conv, messages: [...conv.messages, errorMessage] }
        : conv
    );

    const activeErr = updatedConversations.find(
      (conv) => conv._id === activeConversationId
    );

    if (activeErr) {
      await addMessages(activeConversationId, activeErr.messages);
    }

    setConversations(updatedConversations);
  } finally {
    setIsLoading(false);
    setLastMessage(true);
  }
};

  return (
    <div className="flex h-screen w-screen">
      <ChatSidebar
        isOpen={sidebarOpen}
        userData={userData}
        onClose={() => setSidebarOpen(false)}
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        conversations={conversations}
        setConversations={setConversations}
        handleNewChat={handleNewChat}
      />

      <div className="flex flex-1 flex-col">
        <div>
          <BotHeader onClose={onClose} />
        </div>
        <div className="relative flex-1 flex flex-col items-center">
          <div className="absolute top-[1%] bottom-1 left-[0%] right-[0%] flex justify-center flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl px-4 py-8">
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={message._id} 
                    message={message} 
                    lastMessage={
                      lastMessage && 
                      (index === messages.length -1)
                    }
                    setLastMessage={setLastMessage}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-4 py-6">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-semibold">
                        AI
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: "0s" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="mt-1">
              <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
