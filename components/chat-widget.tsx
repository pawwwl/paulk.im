"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_QUESTIONS = [
  "What's your tech stack?",
  "Tell me about your experience",
  "What projects have you built?",
  "What are you learning now?",
];

export const ChatWidget = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false); // add this
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setStreamingText(fullText);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText },
      ]);
      setStreamingText("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "ERROR: Connection lost. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Hide chips once conversation has started
  const showChips = messages.length === 0 && !isLoading;

  return (
    <div className="grid gap-8 grid-cols-1">
      <div
        className={`col-span-2 bg-surface border border-outline flex flex-col shadow-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300 ${
          isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-[550px]"
        }`}
      >
        {/* Chat Header */}
        <div className="px-4 py-2 bg-surface-container border-b border-outline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-pink/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-accent-green/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50"></div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-4 font-bold">
              v1.0.4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <span className="material-symbols-outlined text-sm">
                {isFullscreen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Chat Message Area */}
        <div
          className="flex-grow p-4 font-mono text-sm overflow-y-auto space-y-4"
          ref={messagesContainerRef}
        >
          {/* Initial greeting */}
          <div className="flex flex-col gap-1">
            <span className="text-accent-green flex-shrink-0 text-[10px] tracking-widest">
              [PAWWWL_]
            </span>
            <p className="text-on-surface pl-2 border-l border-outline/30">
              Hey! What would you like to know about me?
            </p>
          </div>
          {/* Quick question chips */}
          {showChips && (
            <div className="flex flex-wrap gap-2 pl-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="font-mono text-[11px] px-3 py-1.5 border border-primary/30 text-primary/100 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-primary/40 mr-1">//</span>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Conversation history */}
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span
                className={`flex-shrink-0 text-[10px] tracking-widest ${
                  msg.role === "user" ? "text-primary" : "text-accent-green"
                }`}
              >
                {msg.role === "user" ? "[VISITOR]" : "[PAWWWL_]"}
              </span>
              <div className="text-on-surface prose prose-invert prose-sm max-w-none pl-2 border-l border-outline/30">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streamingText && (
            <div className="flex flex-col gap-1">
              <span className="text-accent-green flex-shrink-0 text-[10px] tracking-widest">
                [PAWWWL_]
              </span>
              <p className="text-on-surface whitespace-pre-wrap pl-2 border-l border-outline/30">
                {streamingText}
                <span className="animate-pulse">▋</span>
              </p>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingText && (
            <div className="flex flex-col gap-1">
              <span className="text-accent-green flex-shrink-0 text-[10px] tracking-widest">
                [PAWWWL_]
              </span>
              <p className="text-on-surface-variant animate-pulse pl-2 border-l border-outline/30">
                processing...
              </p>
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className="p-4 bg-surface-container/30 border-t border-outline/50">
          <div className="relative flex items-center">
            <span className="absolute left-4 font-mono text-primary">&gt;</span>
            <input
              className="w-full bg-transparent border border-outline/50 focus:border-primary/50 focus:ring-0 text-on-surface font-mono text-sm pl-10 pr-4 py-3 placeholder:text-on-surface-variant/30 outline-none"
              placeholder="AMA..."
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 text-primary hover:text-accent-green transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
