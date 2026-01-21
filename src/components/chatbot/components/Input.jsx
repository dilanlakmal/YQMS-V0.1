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
    <div className="bg-background border-border">
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
            placeholder="Ask anything"
            className="
            hide-scrollbar
            min-h-[56px]
            max-h-[500px]
            w-full
            resize-none
            rounded-2xl
            border-border
            bg-muted
            pl-4
            py-4
            pr-4      
            pb-[3em]      
            text-base
            focus-visible:ring-1
            focus-visible:ring-ring
          "
            rows={1}
          />

          {/* SEND BUTTON */}
          <Button
            type="submit"
            size="icon"
            disabled={isLoading}
            onClick={() => setLastMessage(false)}
            className="
            absolute
            bottom-3
            right-3
            h-9 w-9
            rounded-xl
            shadow-sm
            bg-gray-500
          "
          >
            <Send
              className={`h-4 w-4 ${lastMessage ? "animate-spin text-white/70" : ""
                }`}
            />
          </Button>

          {/* MODEL SELECTOR */}
          <select
            id="modelSelection"
            value={model}
            onChange={handleChangeModel}
            className="
            absolute
            bottom-3
            left-2
            bg-muted
            border-border
            rounded-md
            px-2 py-1
            text-xs
            text-foreground
            shadow-sm
          "
          >
            {models.map((m) => (
              <option key={m.name} value={m.model}>
                {m.name}
              </option>
            ))}
          </select>
        </form>

        {/* FOOTNOTE */}
        <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}

export function MarqueeText({ text, speed = 50 }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setDistance(containerWidth); // total distance to scroll
    }
  }, [text]);

  return (
    <div ref={containerRef} className="overflow-hidden whitespace-nowrap">
      <motion.div
        ref={textRef}
        className="inline-block"
        animate={{ x: [distance, -distance] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          duration: distance / speed, // speed px per second
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}
