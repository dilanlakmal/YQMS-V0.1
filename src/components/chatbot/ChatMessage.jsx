import { cn } from "@/components/chatbot/lib/utils"

export function ChatMessage({ message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-4 py-6", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-secondary" : "bg-primary",
        )}
      >
        <span className={cn("text-sm font-semibold", isUser ? "text-secondary-foreground" : "text-primary-foreground")}>
          {isUser ? "You" : "AI"}
        </span>
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 max-w-[85%]",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
