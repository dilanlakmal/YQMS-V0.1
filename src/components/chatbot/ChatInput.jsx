import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { Button } from "@/components/Chatbot/ui/button";
import { Textarea } from "@/components/Chatbot/ui/textarea";

export default function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
}) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  // Auto-resize effect
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "0px"; // reset height
      ta.style.height = ta.scrollHeight + "px"; // set to content height
    }
  }, [input]);

  return (
    <div className="border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT..."
            className="min-h-[56px] max-h-[200px] resize-none rounded-2xl border-border bg-muted pr-12 text-base focus-visible:ring-1 focus-visible:ring-ring"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
