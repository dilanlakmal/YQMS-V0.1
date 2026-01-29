import { cn } from "../utils";
import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { LuBot } from "react-icons/lu";
import DOMPurify from "dompurify";
import markedKatex from "marked-katex-extension";
import { FaRegCopy, FaCheck } from "react-icons/fa6";
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
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleCopy = () => {
    if (!isUser) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  return (
    <div
      className={cn(
        "flex gap-4 py-3 px-4 animate-slideUp opacity-0",
        "animate-[slideUp_0.4s_ease-out_forwards]",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm shadow-md transition-transform hover:scale-110",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-200"
            : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white ring-2 ring-purple-200"
        )}
      >
        {isUser ? (
          <img
            src={userData.face_photo}
            alt="User Avatar"
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <LuBot className="w-6 h-6" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 flex flex-col max-w-[75%]", isUser && "items-end")}>
        {/* Sender Name */}
        <span className={cn(
          "text-xs font-medium mb-1 px-1",
          isUser ? "text-blue-600" : "text-purple-600"
        )}>
          {isUser ? userData.name : "AI Assistant"}
        </span>

        <div
          className={cn(
            "px-5 py-3 rounded-2xl relative text-[15px] leading-relaxed break-words shadow-lg transition-all hover:shadow-xl",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
              : message.error
                ? "bg-gradient-to-br from-red-50 to-red-100 text-red-900 rounded-bl-md border-2 border-red-300"
                : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : message.error ? (
            <div className="flex flex-col gap-3">
              {/* Error Icon and Title */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800 mb-1">Error Occurred</div>
                  <div className="text-red-900">{message.content}</div>
                </div>
              </div>

              {/* Error Details (Collapsible) */}
              {message.errorDetails && (
                <details className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-red-700 hover:text-red-900">
                    Technical Details
                  </summary>
                  <div className="mt-2 text-xs text-red-800 font-mono bg-white p-2 rounded border border-red-200">
                    {message.errorDetails}
                  </div>
                </details>
              )}

              {/* Helpful Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-red-200">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Page
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 text-xs font-medium rounded-lg transition-all border border-red-300 hover:border-red-400"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Error
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(message.thought || (lastMessage && thinking)) && (
                <ThoughtBlock
                  thought={message.thought || thinking}
                  isStreaming={lastMessage && !message.content}
                />
              )}

              {message.content && (
                <div className="mt-1">
                  <MarkdownViewer text={message.content} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Only for AI messages (not errors) */}
        {!isUser && message.content && !message.error && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <button
              onClick={handleCopy}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              )}
              title="Copy message"
            >
              {copied ? (
                <>
                  <FaCheck className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FaRegCopy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleLike}
              className={cn(
                "p-2 rounded-lg transition-all hover:scale-110",
                liked
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
              )}
              title="Good response"
            >
              <AiOutlineLike className="w-4 h-4" />
            </button>

            <button
              onClick={handleDislike}
              className={cn(
                "p-2 rounded-lg transition-all hover:scale-110",
                disliked
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
              )}
              title="Bad response"
            >
              <AiOutlineDislike className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}

function ThoughtBlock({ thought, isStreaming }) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  useEffect(() => {
    if (isStreaming) setIsOpen(true);
  }, [isStreaming]);

  return (
    <div className="my-2 border-l-4 border-purple-300 pl-3 bg-purple-50 rounded-r-lg py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-2 focus:outline-none transition-colors"
      >
        <span className={cn(
          "transition-transform duration-200",
          isOpen && "rotate-90"
        )}>
          ▶
        </span>
        {isStreaming ? (
          <span className="flex items-center gap-2">
            Thinking
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </span>
          </span>
        ) : (
          "Thought Process"
        )}
      </button>

      {isOpen && (
        <div className="text-xs text-purple-800 font-mono bg-white/60 p-3 rounded mt-2 whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 border border-purple-200">
          {thought}
        </div>
      )}
    </div>
  );
}


export function ChatMessageTyping({ message, onFinish }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + message[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else if (onFinish && currentIndex === message.length) {
      onFinish();
    }
  }, [currentIndex, message, onFinish]);

  return <span>{displayedText}</span>;
}

export function MarkdownViewer({ text = "" }) {
  const rawHtml = marked.parse(text);
  const safeHtml = DOMPurify.sanitize(rawHtml);

  const modifiedHtml = safeHtml.replace(
    /<pre(?:\s[^>]*)?>(<code(?:\s[^>]*)?>[\s\S]*?<\/code>)<\/pre>/g,
    (_, code) => {
      const encoded = encodeURIComponent(code);
      return `
        <div class="relative group my-3">
          <pre class="!m-0 !p-4 !rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 overflow-x-auto break-words shadow-md"><code class="text-gray-100 text-sm">${code}</code></pre>
          <button
            type="button"
            data-code="${encoded}"
            class="copy-btn absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all text-xs shadow-lg hover:shadow-xl transform hover:scale-105"
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

    // Visual feedback
    btn.textContent = "Copied!";
    btn.classList.add("bg-green-500");
    btn.classList.remove("bg-blue-500");

    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("bg-green-500");
      btn.classList.add("bg-blue-500");
    }, 2000);
  };

  return (
    <div className="w-full break-words" onClick={handleClick}>
      <div
        className="
          prose
          prose-neutral
          max-w-none
          dark:prose-invert
          break-words
          hyphens-auto
          [&>*]:mb-4
          [&>table]:block
          [&_table]:table-auto
          [&>table]:overflow-x-auto
          [&_table]:border
          [&_table]:border-gray-300
          [&_table]:rounded-lg
          [&_td]:border
          [&_td]:border-gray-200
          [&_td]:p-3
          [&>th]:border
          [&_th]:border-gray-300
          [&_th]:bg-gradient-to-br
          [&_th]:from-gray-50
          [&_th]:to-gray-100
          [&_th]:p-3
          [&_th]:font-semibold
          [&_th]:border
          [&_pre]:overflow-x-auto
          [&>pre]:bg-gray-900
          [&>pre]:p-4
          [&>pre]:rounded-lg
          [&>pre]:max-w-full
          [&>pre]:shadow-md
          [&_code]:break-words
          [&>code]:bg-purple-100
          [&>code]:text-purple-800
          [&_code]:px-1.5
          [&_code]:py-0.5
          [&_code]:rounded
          [&_code]:text-sm
          [&_code]:font-mono
          [&>p]:overflow-wrap-anywhere
          [&>p]:leading-relaxed
          [&>h1]:font-bold
          [&>h1]:text-2xl
          [&>h1]:text-gray-900
          [&>h1]:mb-4
          [&_h2]:text-xl
          [&_h2]:font-bold
          [&_h2]:text-gray-800
          [&_h2]:mb-3
          [&_h3]:text-lg
          [&_h3]:font-bold
          [&_h3]:text-gray-800
          [&_h3]:mb-2
          [&_h4]:font-semibold
          [&_h4]:text-gray-700
          [&_h5]:font-semibold
          [&_h5]:text-gray-700
          [&_h6]:font-semibold
          [&_h6]:text-gray-700
          [&_strong]:text-gray-900
          [&_strong]:font-semibold
          [&_em]:text-gray-700
          [&_a]:text-blue-600
          [&_a]:underline
          [&_a]:hover:text-blue-700
          [&_ol]:list-decimal
          [&_ol]:ml-6
          [&_ol]:space-y-1
          [&_ul]:list-disc
          [&_ul]:ml-6
          [&_ul]:space-y-1
          [&_li]:text-gray-700
          [&_blockquote]:border-l-4
          [&_blockquote]:border-blue-400
          [&_blockquote]:pl-4
          [&_blockquote]:italic
          [&_blockquote]:text-gray-600
          [&_blockquote]:bg-blue-50
          [&_blockquote]:py-2
          [&_blockquote]:rounded-r
        "
        dangerouslySetInnerHTML={{ __html: modifiedHtml }}
      />
    </div>
  );
}

