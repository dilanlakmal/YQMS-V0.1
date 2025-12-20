import { cn } from "@/components/chatbot/lib/utils";
import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { LuBot } from "react-icons/lu";
import DOMPurify from "dompurify";
import markedKatex from "marked-katex-extension";
import { FaRegCopy } from "react-icons/fa6";
import { AiOutlineDislike, AiOutlineLike } from "react-icons/ai";

const options = {
  nonStandard: true,
};

marked.use(markedKatex(options));

export function ChatMessage({
  thinking,
  setThinking,
  userData,
  message,
  lastMessage,
  setLastMessage,
}) {
  const isUser = message.role === "user";

 

  return (
    <div className={cn("flex gap-4 py-2 px-3 overflow-hidden", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm",
          isUser ? "bg-gray-500 text-white" : "bg-gray-300 text-gray-800"
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
            "px-4 py-2 max-w-[80%] rounded-3xl relative text-sm leading-relaxed break-words",
            isUser
              ? "bg-gray-500 text-white rounded-br-none"
              : "bg-white text-gray-900 rounded-bl-none"
          )}
        >
          {isUser ? (
            message.content
          ) : lastMessage ? (
            thinking ? (
              <ChatMessageTyping
                key="thinking"
                message={thinking}
                speed={10}
                onFinish={() => setThinking("")}
              />
            ) : (
              <ChatMessageTyping
                key="content"
                message={message.content}
                onFinish={() => setLastMessage(false)}
              />
            )
          ) : (
            <MarkdownViewer text={message.content} />
          )}
          {!isUser && (
            <div className="relative top-4 left-0 w-full gap-3 flex items-center">
              <button className="border-none">
                <FaRegCopy className="w-4 h-4" />
              </button>
              <button className="border-none">
                <AiOutlineLike className="w-4 h-4" />
              </button>
              <button className="border-none">
                <AiOutlineDislike className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* {message.content} */}
          {/* Optional subtle shadow */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none shadow-sm rounded-2xl"
            )}
          ></div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageTyping({ message, speed = 10, onFinish }) {
  const [displayed, setDisplayed] = useState("");
  const bottomRef = useRef(null);
  // Scroll whenever displayed text changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayed]);

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

  return (
    <>
      <MarkdownViewer text={displayed} />
      <div ref={bottomRef} />
    </>
  )
  
  ;
}

export function MarkdownViewer({ text = "" }) {
  const rawHtml = marked.parse(text);
  const safeHtml = DOMPurify.sanitize(rawHtml);

  return (
    <div className="w-full overflow-x-hidden">
      {/* Inner wrapper allows scrolling for code but prevents overall overflow */}
      <div
        className="
          prose
          prose-neutral
          max-w-1/2
          dark:prose-invert
          break-words
          [&>*]:mb-6
          [&>table]:block
          [&>table]:w-full
          [&>table]:overflow-x-auto
          [&>pre]:overflow-hidden
          [&>pre]:bg-gray-100
          [&>pre]:p-2
          [&>pre]:rounded
          [&>code]:break-words
          [&>code]:bg-gray-100
          [&>code]:px-1
          [&>code]:py-0.5
          [&>code]:rounded
          [&>code]:overflow-hidden
        "
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}


