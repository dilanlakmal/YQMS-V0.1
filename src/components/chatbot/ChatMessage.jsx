import { cn } from "@/components/chatbot/lib/utils";
import { useState, useEffect } from "react";
import { marked } from "marked";
import { LuBot } from "react-icons/lu";
import DOMPurify from "dompurify";

export function ChatMessage({
  userData,
  message,
  lastMessage,
  setLastMessage,
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4 py-2 px-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm",
          isUser ? "bg-gray-500 text-white" : "bg-gray-300 text-gray-800",
        )}
      >
        {isUser ? (
          <img
            src={userData.face_photo}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <LuBot className="w-8 h-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 flex flex-col", isUser && "items-end")}>
        <div
          className={cn(
            "px-4 py-2 max-w-[80%] rounded-2xl relative text-sm leading-relaxed break-words",
            isUser
              ? "bg-gray-500 text-white rounded-br-none"
              : "bg-gray-100 text-gray-900 rounded-bl-none",
          )}
        >
          {isUser ? (
            message.content
          ) : lastMessage ? (
            <ChatMessageTyping
              message={message.content}
              onFinish={() => setLastMessage(false)}
            />
          ) : (
            <MarkdownViewer text={message.content} />
          )}
          {/* {message.content} */}
          {/* Optional subtle shadow */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none shadow-sm rounded-2xl",
            )}
          ></div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageTyping({ message, speed = 10, onFinish }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!message) return;

    let index = 0;

    const interval = setInterval(() => {
      setDisplayed((prev) => prev + message[index]);
      index++;

      if (index >= message.length) {
        clearInterval(interval);
        if (onFinish) onFinish();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [message, speed, onFinish]);

  return <MarkdownViewer text={displayed} />;
}

export function MarkdownViewer({ text = "" }) {
  const rawHtml = marked(text);
  const safeHtml = DOMPurify.sanitize(rawHtml);

  return (
    <div
      className="prose prose-neutral max-w-none dark:prose-inert"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
