import Header from "./components/Header";
import { ChatSidebar as Sidebar } from "./components/Sidebar";
import { useState } from "react";
import { useRef, useEffect } from "react";
import "./styles/main.css";
import {
  createConversation,
  updateConversationStatus
} from "./services/conversation";
import { getOllamaResponse } from "./services/chat";
import AzureTranslator from "./features/Translator/AzureTranslator";
import ChatContent from "./components/ChatContent";


function strictThreeWords(text) {
  if (text.split(" ").length > 3) {
    return text
      .trim()
      .replace(/[^\w\s]/g, "")   // remove punctuation
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");
  }
  return text;
}


export default function ChatInterface({
  currentService,
  setCurrentService,
  messages,
  userData,
  model,
  setModel,
  initialMessages,
  activeConversationId,
  setActiveConversationId,
  conversations,
  setConversations,
  onClose,
  models,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState(false);
  const [generateTopic, setGenerateTopic] = useState(false);
  const [thinking, setThinking] = useState("");

  // Language State
  const [language, setLanguage] = useState("en"); // Default English

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNewChat = async () => {
    const newConv = {
      title: "New conversation",
      userID: userData.emp_id,
      model: model,
      active_status: true,
      date: new Date(),
      messages: [...initialMessages],
    };
    const newConversationCreated = await createConversation(newConv);
    await updateConversationStatus(newConversationCreated._id);
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

    const userMessage = {
      _id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    let updatedConversations = [...conversations];
    let activeID = activeConversationId;

    // Helper to add message to a conversation
    const addMessageToConversation = (convId, message) => {
      return updatedConversations.map((conv) =>
        conv._id === convId
          ? { ...conv, messages: [...(conv.messages || []), message] }
          : conv
      );
    };

    // 1️⃣ Handle new conversation
    if (updatedConversations.length === 0) {
      const newConversation = {
        userID: userData.emp_id,
        title: "New conversation",
        date: new Date(),
        model,
        active_status: true,
        messages: [userMessage],
      };
      const created = await createConversation(newConversation);
      updatedConversations = [created];
      activeID = created._id;
      setActiveConversationId(created._id);
    } else {
      // 2️⃣ Add user message to existing conversation
      updatedConversations = addMessageToConversation(activeID, userMessage);
    }

    // 3️⃣ Update UI immediately
    try {
      // 3️⃣ Update UI immediately
      setConversations(updatedConversations);
      setInput("");

      // Streaming Handling
      let fullContent = "";
      let fullThought = "";

      const activeConversation = updatedConversations.find(c => c._id === activeID);
      const payloadMessages = activeConversation ? activeConversation.messages.map(m => ({
        role: m.role,
        content: m.content
      })) : [];

      if (language !== "en") {
        const langMap = { km: "Khmer", zh: "Chinese", fr: "French" };
        payloadMessages.unshift({
          role: "system",
          content: `Please response in ${langMap[language] || "English"} language.`
        });
      }

      await getOllamaResponse(model, payloadMessages, true, (chunk) => {
        let shouldUpdate = false;

        if (chunk.type === "thought") {
          fullThought += (fullThought ? "\n" : "") + chunk.data;
          setThinking(fullThought);
          shouldUpdate = true;
        } else if (chunk.type === "chunk") {
          fullContent += chunk.data;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          setConversations(prevConvs => {
            return prevConvs.map(conv => {
              if (conv._id !== activeID) return conv;

              const msgs = [...conv.messages];
              const lastMsg = msgs[msgs.length - 1];

              if (lastMsg && lastMsg.role === "assistant") {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  content: fullContent,
                  thought: fullThought
                };
              } else {
                msgs.push({
                  _id: Date.now().toString(),
                  role: "assistant",
                  content: fullContent,
                  thought: fullThought,
                  timestamp: new Date()
                });
              }
              return { ...conv, messages: msgs };
            });
          });
        }
      });

      // Final save handled by state update above mostly, but could persist here
      // const finalConvs = [...updatedConversations]; 
      // Ideally we sync back to backend after stream ends.

    } catch (error) {
      console.error("Error:", error);

      // Create a user-friendly error message
      let errorMessage = "I apologize, but I encountered an error while processing your request.";
      let errorDetails = "";

      if (error.message.includes("Network")) {
        errorMessage = "Unable to connect to the AI service. Please check your internet connection.";
        errorDetails = "Network error";
      } else if (error.message.includes("Token")) {
        errorMessage = "Your session has expired. Please refresh the page and try again.";
        errorDetails = "Authentication error";
      } else if (error.message.includes("ReadableStream")) {
        errorMessage = "Your browser doesn't support streaming. Please try a different browser.";
        errorDetails = "Browser compatibility issue";
      } else {
        errorDetails = error.message || "Unknown error";
      }

      // Add error message to conversation
      const errorMsg = {
        _id: Date.now().toString(),
        role: "assistant",
        content: errorMessage,
        error: true,
        errorDetails: errorDetails,
        timestamp: new Date()
      };

      setConversations(prevConvs => {
        return prevConvs.map(conv => {
          if (conv._id !== activeID) return conv;
          return { ...conv, messages: [...conv.messages, errorMsg] };
        });
      });
    } finally {
      setIsLoading(false);
      setLastMessage(true);
    }
  };

  return (
    <div className="flex h-screen w-screen max-w-full">
      <Sidebar
        setCurrentService={setCurrentService}
        generateTopic={generateTopic}
        setGenerateTopic={setGenerateTopic}
        setModel={setModel}
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

      <div className="flex flex-1 flex-col sm:w-1/2">
        <div>
          <Header onClose={onClose} language={language} setLanguage={setLanguage} />
        </div>
        <div className="relative flex-1 flex flex-col items-center">
          <div className="absolute top-[0%] bottom-1 left-[0%] right-[0%] flex justify-center flex-col bg-background text-foreground">
            {currentService === "" && (
              <ChatContent
                setConversations={setConversations}
                conversations={conversations}
                thinking={thinking}
                setThinking={setThinking}
                userData={userData}
                messages={messages}
                lastMessage={lastMessage}
                setLastMessage={setLastMessage}
                activeConversationId={activeConversationId}
                isLoading={isLoading}
                handleSubmit={handleSubmit}
                messagesEndRef={messagesEndRef}
                model={model}
                setModel={setModel}
                input={input}
                setInput={setInput}
                models={models}
              />
            )}
            {currentService === "translator" && <AzureTranslator />}
          </div>
        </div>
      </div>
    </div>
  );
}
