import BotHeader from "./BotHeader";
import ChatInput from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { useRef, useEffect } from "react";
import "./style/index.css"

export default function ChatInterface({
  messages,
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNewChat = () => {
    const newConv = {
      id: String(conversations.length + 1),
      title: "New conversation",
      date: "Today",
      messages: [...initialMessages],
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      )
    );
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5005/webhooks/rest/webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender: "user", message: input }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const assistantMessages = data
          .filter((msg) => msg.text)
          .map((msg, index) => ({
            id: (Date.now() + index + 1).toString(),
            role: "assistant",
            content: msg.text,
            timestamp: new Date(),
          }));

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? { ...conv, messages: [...conv.messages, ...assistantMessages] }
              : conv
          )
        );
      } else {
        const fallbackMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I received your message but have no response at the moment.",
          timestamp: new Date(),
        };
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? { ...conv, messages: [...conv.messages, fallbackMessage] }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error connecting to Rasa:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Unable to reach the Rasa server. Please make sure it's running on http://localhost:5005",
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen">
      <ChatSidebar
        isOpen={sidebarOpen}
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
              <div className="mx-auto max-w-3xl px-4 py-8">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-4 py-6">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-semibold">
                        AI
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce " />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce " />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
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
