import { LuBot } from "react-icons/lu";
import { ChatMessage as Message } from "./Message";
import Input from "./Input";

export default function ChatContent({
    setConversations,
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
    models
}) {
    return (
        <>
            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
                    <div className="absolute md:-right-20 md:-top-20 -right-10 -top-10 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl"></div>
                    <div className="absolute md:-left-20 md:top-40 -left-10 top-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl"></div>
                </div>

                <div className="mx-auto max-w-5xl px-4 py-8 relative z-10 min-h-full flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] animate-fadeIn">
                            <div className="mb-8 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center shadow-xl ring-4 ring-white relative z-10 transition-transform duration-500 group-hover:scale-105">
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
                                        <LuBot className="w-12 h-12 text-white drop-shadow-md" />
                                    </div>
                                </div>
                                {/* Status Dot */}
                                <div className="absolute bottom-1 right-1 h-7 w-7 bg-green-500 rounded-full border-4 border-white shadow-lg z-20 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 text-center tracking-tight">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-500 text-center max-w-lg mb-10 text-lg leading-relaxed">
                                I'm your advanced AI assistant. Ask me anything, translate documents, or get help with your tasks.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-4">
                                {[
                                    { icon: "💡", title: "Brainstorm Ideas", prompt: "Help me brainstorm ideas for...", color: "hover:border-yellow-400 hover:bg-yellow-50" },
                                    { icon: "📝", title: "Draft Content", prompt: "Write a professional email about...", color: "hover:border-purple-400 hover:bg-purple-50" },
                                    { icon: "🔍", title: "Analyze Data", prompt: "Analyze this information and provide insights...", color: "hover:border-blue-400 hover:bg-blue-50" },
                                    { icon: "🌐", title: "Translate Text", prompt: "Translate this text into...", color: "hover:border-green-400 hover:bg-green-50" }
                                ].map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInput(suggestion.prompt)}
                                        className={`group flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 ${suggestion.color}`}
                                    >
                                        <span className="text-3xl bg-gray-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">{suggestion.icon}</span>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-800 group-hover:text-gray-900 mb-1">
                                                {suggestion.title}
                                            </div>
                                            <div className="text-sm text-gray-500 line-clamp-2">
                                                {suggestion.prompt}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {messages.map((message, index) => (
                                <Message
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
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex gap-4 py-4 px-4 animate-slideUp fade-in duration-500">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-100">
                                <LuBot className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col gap-2 max-w-[80%]">
                                <span className="text-xs font-bold text-purple-600 px-1 uppercase tracking-wider">Thinking</span>
                                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl rounded-bl-none shadow-xl border border-purple-100">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-bounce"
                                            style={{ animationDelay: "0s", animationDuration: "1s" }}
                                        />
                                        <div
                                            className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce"
                                            style={{ animationDelay: "0.2s", animationDuration: "1s" }}
                                        />
                                        <div
                                            className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-bounce"
                                            style={{ animationDelay: "0.4s", animationDuration: "1s" }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 font-medium animate-pulse">Processing your request...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            <div className="z-20 relative">
                <Input
                    setConversations={setConversations}
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
                    models={models}
                />
            </div>
        </>
    );
}
