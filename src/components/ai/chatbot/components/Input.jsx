import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { editConversationModel } from "../services/conversation";
import { motion } from "framer-motion";
import ChatGuide from "./StepIntro";
import { getModels } from "../services/chat";

export default function ChatInput({
  setConversations,
  conversations,
  activeConversationId,
  lastMessage,
  setLastMessage,
  model,
  setModel,
  input,
  setInput,
  handleSubmit,
  isLoading,
  models

}) {
  const textareaRef = useRef(null);
  const [historyIndex, setHistoryIndex] = useState(-1);



  const userMessages = conversations
    .find(conv => conv._id === activeConversationId)
    ?.messages
    ?.filter(msg => msg.role === "user") || [];


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "ArrowUp") {
      let newIndex;
      if (historyIndex === 0) {
        newIndex = userMessages.length - 1;
      } else {
        newIndex = Math.max(historyIndex - 1, 0);
      }
      setHistoryIndex(newIndex)

      if (newIndex < 0) {
        setInput("");
      } else {
        const message = userMessages[newIndex];
        setInput(message?.content || "");
      }
    } else if (e.key == "ArrowDown") {
      const newIndex = Math.min(historyIndex + 1, -1);
      setHistoryIndex(newIndex);

      if (newIndex === -1) {
        setInput("");
      } else {
        const message = userMessages[userMessages.length + newIndex];
        setInput(message?.content || "");
      }
    }
  }
  // Auto resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "0px";
      ta.style.height = ta.scrollHeight + "px";
    }
    if (!model) {
      setModel(models[0].name);
    }
  }, [input]);




  const handleChangeModel = async (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    const updatedConversations = conversations.map(conv => conv._id === activeConversationId ? { ...conv, model: newModel } : conv)
    setConversations(updatedConversations);
    await editConversationModel(activeConversationId, newModel);
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    setHistoryIndex(-1);
  }

  return (
    <div className="bg-gradient-to-t from-gray-50 to-white border-t border-gray-200 shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-4">
        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="relative">
          {/* TEXTAREA */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="Ask me anything..."
            className="
            hide-scrollbar
            min-h-[56px]
            max-h-[500px]
            w-full
            resize-none
            rounded-2xl
            border-2
            border-gray-200
            bg-white
            pl-4
            py-4
            pr-4      
            pb-[3.5em]      
            text-base
            focus-visible:ring-2
            focus-visible:ring-blue-400
            focus-visible:border-blue-400
            transition-all
            shadow-sm
            hover:shadow-md
            focus:shadow-lg
          "
            rows={1}
          />

          {/* SEND BUTTON */}
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            onClick={() => setLastMessage(false)}
            className="
            absolute
            bottom-3
            right-3
            h-10 w-10
            rounded-xl
            shadow-md
            hover:shadow-lg
            bg-gradient-to-br from-blue-500 to-blue-600
            hover:from-blue-600 hover:to-blue-700
            disabled:from-gray-300 disabled:to-gray-400
            disabled:cursor-not-allowed
            transition-all
            transform
            hover:scale-105
            active:scale-95
          "
          >
            <Send
              className={`h-5 w-5 ${isLoading ? "animate-spin text-white/70" : "text-white"
                }`}
            />
          </Button>

          {/* MODEL SELECTOR */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="relative group">
              {/* Icon indicator */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <select
                id="modelSelection"
                value={model}
                onChange={handleChangeModel}
                className="
                appearance-none
                bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50
                border-2
                border-purple-300
                rounded-xl
                pl-10 pr-10 py-2.5
                text-xs
                font-semibold
                text-purple-900
                shadow-md
                hover:shadow-lg
                hover:border-purple-400
                hover:from-purple-100
                hover:via-purple-200
                hover:to-purple-100
                transition-all
                duration-200
                cursor-pointer
                focus:outline-none
                focus:ring-2
                focus:ring-purple-500
                focus:border-purple-500
                focus:shadow-xl
                backdrop-blur-sm
              "
              >
                {models.map((m) => (
                  <option
                    key={m.name}
                    value={m.model}
                    className="bg-white text-gray-800 py-2"
                  >
                    🤖 {m.name}
                  </option>
                ))}
              </select>

              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-purple-700 group-hover:text-purple-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                <div className="font-semibold mb-0.5">AI Model</div>
                <div className="text-gray-300">Select your preferred model</div>
                {/* Arrow */}
                <div className="absolute top-full left-4 -mt-1">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* FOOTNOTE */}
        <p className="mt-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}


