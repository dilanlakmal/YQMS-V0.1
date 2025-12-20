import BotHeader from "./BotHeader";
import ChatInput from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { useRef, useEffect } from "react";
import "./style/index.css";
import {
  addMessages,
  createConversation,
  editConversationTitle,
  updateConversationStatus
} from "./lib/api/conversation";
import { getOllamaResponse } from "./lib/api/chat";
import { BsRobot } from "react-icons/bs";
import AzureTranslator from "./services/azureTranslation";


function strictThreeWords(text) {
  return text
    .trim()
    .replace(/[^\w\s]/g, "")   // remove punctuation
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
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
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState(false);
  const [generateTopic, setGenerateTopic] = useState(false);
  const [thinking, setThinking] = useState("");

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

    // 1️⃣ If no conversations exist, create a new one
    if (updatedConversations.length === 0) {
      const newConversation = {
        userID: userData.emp_id,
        title: "New conversation",
        date: new Date(),
        model: model,
        active_status: true,
        messages: [userMessage], // include the user message immediately
      };
      const created = await createConversation(newConversation);
      updatedConversations = [created];
      activeID = created._id;
      setActiveConversationId(created._id);
    } else {
      // 2️⃣ Add user message to existing conversation
      updatedConversations = updatedConversations.map((conv) =>
        conv._id === activeConversationId
          ? { ...conv, messages: [...(conv.messages || []), userMessage] }
          : conv,
      );
    }

    // 3️⃣ Update UI immediately
    setConversations(updatedConversations);
    setInput("");

    try {
      // 4️⃣ Request assistant response
      const activeConversation = updatedConversations.find((conv) => {
        return conv._id === activeID;
      });

      const messages = activeConversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const data = await getOllamaResponse(model, messages, true);

      let topic;
      if (activeConversation.title === "New conversation" || !activeConversation.title) {
          topic = await getOllamaResponse(model, [
          {
            role: "user",
            content: `
            You must output EXACTLY three words.
            No punctuation.
            No explanations.
            No line breaks.
            If unsure, still output exactly three words.

            Text:
            ${input}
            `,
          },
        ], false);
      } else {
        topic = {message: {content: activeConversation.title}};
      }


      const topicText = strictThreeWords(topic.message.content.trim());

      if (data?.message?.thinking) {
        setThinking(data.message.thinking);
      }

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

      // 5️⃣ Add assistant message
      updatedConversations = updatedConversations.map((conv) => {
        if (conv._id !== activeID) return conv;

        const updateConv = {
          ...conv,
          messages: [...conv.messages, assistantMessage],
        };

        // Update title if new
        if (updateConv.title === "New conversation") {
          setGenerateTopic(true);
          updateConv.title = topicText;
          editConversationTitle(activeID, topicText); // persist to backend
        }

        return updateConv;
      });

      // Save assistant message to backend
      const activeAssistant = updatedConversations.find(
        (conv) => conv._id === activeID,
      );
      if (activeAssistant) {
        await addMessages(activeID, activeAssistant.messages);
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
        conv._id === activeID
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv,
      );

      const activeErr = updatedConversations.find(
        (conv) => conv._id === activeID,
      );

      if (activeErr) {
        await addMessages(activeID, activeErr.messages);
      }
      setConversations(updatedConversations);
      setLastMessage(false);
      console.log("Set last message to false", lastMessage);
    } finally {
      setIsLoading(false);
      setLastMessage(true);
      console.log(
        "Set last message to true to finally submit text to bot",
        lastMessage,
      );
    }
  };

  return (
    <div className="flex h-screen w-screen max-w-full">
      <ChatSidebar
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
          <BotHeader onClose={onClose} />
        </div>
        <div className="relative flex-1 flex flex-col items-center">
          <div className="absolute top-[0%] bottom-1 left-[0%] right-[0%] flex justify-center flex-col bg-background text-foreground">
            {currentService === "" && (
              <ChatService
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
              />
            )}
            {currentService === "translator" && <AzureTranslator />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatService({
  conversations,
  setInput,
  input,
  model,
  setModel,
  thinking,
  setThinking,
  userData,
  messages,
  lastMessage,
  setLastMessage,
  activeConversationId,
  isLoading,
  handleSubmit,
  messagesEndRef,
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {messages.map((message, index) => (
            <ChatMessage
              thinking={
                lastMessage && index === messages.length - 1 ? thinking : ""
              }
              setThinking={setThinking}
              userData={userData}
              key={message._id}
              message={message}
              lastMessage={lastMessage && index === messages.length - 1}
              setLastMessage={setLastMessage}
            />
          ))}
          {isLoading && (
            <div className="flex gap-4 py-6">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground text-sm font-semibold">
                  <BsRobot className="w-8 h-8" />
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
          conversations={conversations}
          activeConversationId={activeConversationId}
          lastMessage={lastMessage}
          setLastMessage={setLastMessage}
          model={model}
          setModel={setModel}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
