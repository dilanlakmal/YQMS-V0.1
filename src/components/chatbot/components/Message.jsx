import { cn } from "../utils";
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

  const handleCopy = (e) => {
    if (!isUser) {
      navigator.clipboard.writeText(message.content);
    }
  }

  return (
    <div className={cn("flex gap-4 py-2 px-3 overflow-hidden", isUser && "items-end", isUser && "flex-row-reverse")}>
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
                <FaRegCopy className="w-4 h-4" onClick={handleCopy} />
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

  const modifiedHtml = safeHtml.replace(
    /<pre(?:\s[^>]*)?><code(?:\s[^>]*)?>([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => {
      const encoded = encodeURIComponent(code);
      return `
        <div class="relative group">
          <pre class="!m-0 !p-2 !rounded bg-gray-200 overflow-x-auto break-words"><code>${code}</code></pre>
          <button
            type="button"
            data-code="${encoded}"
            class="copy-btn absolute top-2 right-2 bg-gray-500 hover:bg-gray-800 text-white font-bold p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Copy
          </button>
        </div>
      `;
    }
  );

  const handleClick = (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const code = decodeURIComponent(btn.dataset.code);
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="w-full break-words font-serif" onClick={handleClick}>
      <div
        className="
          prose
          prose-neutral
          max-w-2xl
          dark:prose-invert
          break-words
          hyphens-auto
          [&>*]:mb-6
          [&>table]:block
          [&_table]:table-auto
          [&>table]:overflow-x-auto
          [&_table]:border
          [&_table]:border-gray-300
          [&_td]:border
          [&_td]:border-gray-300
          [&_td]:p-2
          [&>th]:border
          [&_th]:border-gray-300
          [&_th]:bg-gray-100
          [&_th]:p-2
          [&_th]:border
          [&_pre]:overflow-x-auto
          [&>pre]:bg-gray-200
          [&>pre]:p-2
          [&>pre]:rounded
          [&>pre]:max-w-full
          [&_code]:break-words
          [&>code]:bg-gray-200
          [&_code]:px-1
          [&_code]:py-0.5
          [&_code]:rounded
          [&>p]:overflow-wrap-anywhere
          [&>h1]:font-bold
          [&_h1]:text-2xl
          [&_h2]:text-xl
          [&_h2]:font-bold
          [&_h3]:text-lg
          [&_h3]:font-bold
          [&_h4]:font-bold
          [&_h5]:font-bold
          [&_h6]:font-bold
          [&_span]:bg-yellow-100
          [&_ol]:list-decimal
          [&_ol]:ml-6
          [&_ul]:list-disc
          [&_ul]:ml-6
        "
        dangerouslySetInnerHTML={{ __html: modifiedHtml }}
      />
    </div>
  );
}

