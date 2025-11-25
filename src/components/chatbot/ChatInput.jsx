import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { Button } from "@/components/Chatbot/ui/button";
import { Textarea } from "@/components/Chatbot/ui/textarea";
import { editConversationModel } from "./lib/api/conversation";
import { motion } from "framer-motion";

export default function ChatInput({
  activeConversationId,
  lastMessage,
  setLastMessage,
  model,
  setModel,
  input,
  setInput,
  handleSubmit,
  isLoading,
}) {
  const textareaRef = useRef(null);

  const models = [
    { name: "gpt-oss:120b-cloud", active: true },
    { name: "llama3.2:latest", active: false },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "0px";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [input]);

  const handleChangeModel = async (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    await editConversationModel(activeConversationId, newModel);
  };

  return (
    <div className=" border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-4">
        {/* MODEL SELECTOR */}
        <div className="mb-2 flex justify-end">
          <select
            value={model}
            onChange={handleChangeModel}
            className="bg-muted border border-border rounded-md px-2 py-1 text-xs text-foreground"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT..."
            className="
              min-h-[56px]
              max-h-[200px]
              resize-none
              rounded-2xl
              border-border
              bg-muted
              pr-12
              py-4
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
            onClick={() => setLastMessage(false)} // set processing on click
            className="absolute bottom-3 right-3 h-9 w-9 rounded-xl"
          >
            <Send
              className={`h-4 w-4 ${lastMessage ? "animate-spin text-white-500" : ""}`}
            />
          </Button>
        </form>

        {/* FOOTNOTE */}
        <MarqueeText />
      </div>
    </div>
  );
}

export function MarqueeText({text = "ChatGPT can make mistakes. Check important info. "}) {

  return (
    <div className="overflow-hidden whitespace-nowrap w-full  border-gray-300">
      <motion.div
        className="inline-block"
        style={{ display: "inline-block" }}
        animate={{ x: [-1000, 1000] }} // move in px
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 30,
          ease: "linear",
        }}
      >
        {text} {text} {/* duplicate for smooth looping */}
      </motion.div>
    </div>
  );
}