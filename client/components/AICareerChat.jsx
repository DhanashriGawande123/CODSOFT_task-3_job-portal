
"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";

const suggestions = [
  "How can I improve my resume?",
  "Which skills should I learn for MERN development?",
  "Suggest projects for freshers.",
  "How can I prepare for a React interview?",
];

// Renders **bold**, bullet lists, numbered lists and headings from the AI reply
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

function FormattedMessage({ content }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const text = line.trim();
        if (!text) return null;

        if (/^(\*|-)\s+/.test(text)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#DD9A3B]">•</span>
              <span>{renderInline(text.replace(/^(\*|-)\s+/, ""))}</span>
            </div>
          );
        }

        const numbered = text.match(/^(\d+)\.\s+(.*)/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#2C5A4E] font-medium">{numbered[1]}.</span>
              <span>{renderInline(numbered[2])}</span>
            </div>
          );
        }

        if (/^#{1,6}\s+/.test(text)) {
          return (
            <p key={i} className="font-semibold">
              {renderInline(text.replace(/^#{1,6}\s+/, ""))}
            </p>
          );
        }

        return <p key={i}>{renderInline(text)}</p>;
      })}
    </div>
  );
}

export default function AICareerChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        message: text.trim(),
        history: messages.slice(-10),
      });

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (error) {
      console.error(error);

      const serverMessage = error.response?.data?.message;
      const notLoggedIn = error.response?.status === 401;

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: notLoggedIn
            ? "Please log in to use the AI assistant."
            : serverMessage || "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-65px)] bg-[#F3EFE6] px-4 py-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-3xl text-[#16243B]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Career assistant
            </h1>
            <p className="text-[#5B6B82] mt-1">
              Ask about resumes, skills, projects, and interviews.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="text-sm text-[#5B6B82] hover:text-[#16243B] border border-[#DCD5C6] hover:border-[#16243B] rounded-[4px] px-4 py-2 transition-colors"
            >
              New chat
            </button>
          )}
        </div>

        {/* Chat window */}
        <div className="bg-white border border-[#DCD5C6] rounded-[6px] overflow-hidden">
          <div className="h-[60vh] min-h-[420px] overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col justify-center">
                <div className="w-12 h-12 rounded-full bg-[#DD9A3B] text-[#16243B] flex items-center justify-center font-semibold mb-5">
                  AI
                </div>
                <h2
                  className="text-xl text-[#16243B]"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                >
                  What would you like help with today?
                </h2>
                <p className="text-[#5B6B82] text-sm mt-1 mb-6">
                  Pick a question to start, or type your own below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => sendMessage(item)}
                      className="text-left text-sm text-[#16243B] bg-[#F3EFE6] border border-[#DCD5C6] hover:border-[#DD9A3B] rounded-[6px] p-4 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 mb-5 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-[#DD9A3B] text-[#16243B] flex items-center justify-center text-xs font-semibold">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[80%] px-4 py-3 rounded-[6px] text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-[#2C5A4E] text-white"
                      : "bg-[#F3EFE6] border border-[#DCD5C6] text-[#16243B]"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <FormattedMessage content={message.content} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 mb-5">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#DD9A3B] text-[#16243B] flex items-center justify-center text-xs font-semibold">
                  AI
                </div>
                <div className="bg-[#F3EFE6] border border-[#DCD5C6] rounded-[6px] px-4 py-3 flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full bg-[#DD9A3B] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2 border-t border-[#DCD5C6] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your career..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm text-[#16243B] placeholder-[#94A0B2] bg-[#F3EFE6] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#DD9A3B] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B] font-medium px-6 py-2.5 rounded-[4px] transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        <p className="text-xs text-[#94A0B2] mt-3 text-center">
          AI can make mistakes. Check important details before acting on them.
        </p>
      </div>
    </div>
  );
}