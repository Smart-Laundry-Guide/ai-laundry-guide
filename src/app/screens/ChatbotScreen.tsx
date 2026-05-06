import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "react-router";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "니트 세탁 방법이 뭐야?",
  "흰 셔츠 얼룩 지우고싶어",
  "청바지 첫 세탁 어떻게 해?",
  "드라이클리닝 꼭 해야 해?",
];

const SYSTEM_PROMPT = `당신은 세탁 전문 AI 도우미입니다. 사용자의 세탁 관련 질문에 친절하고 실용적으로 답변합니다.

답변 규칙:
- 세탁, 드라이클리닝, 얼룩 제거, 의류 관리 등 세탁 관련 질문에만 답변하세요.
- 세탁과 무관한 질문이면 "세탁 관련 질문만 도와드릴 수 있어요 😊"라고 안내하세요.
- 답변은 간결하게, 핵심 정보 위주로 작성하세요. (최대 200자 이내)
- 단계가 필요하면 번호 목록으로 간단히 정리하세요.
- 말투는 친근하고 따뜻하게, 존댓말을 사용하세요.
- 이모지를 적절히 사용해 가독성을 높이세요.`;

export function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 세탁 도우미예요 🧺\n궁금한 세탁 방법이나 얼룩 제거법을 물어보세요!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard detection via visualViewport
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const diff = windowHeight - viewportHeight - (viewport.offsetTop ?? 0);
      setKeyboardHeight(diff > 0 ? diff : 0);
    };

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);
    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const assistantText =
        data.content?.[0]?.text ?? "응답을 받아오지 못했어요. 다시 시도해 주세요.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafb" }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-4 flex items-center"
        style={{ background: "white", borderBottom: "1px solid #eef1f5" }}
      >
        <Link to="/" className="mr-4">
          <ArrowLeft size={24} color="#1a2332" strokeWidth={2} />
        </Link>
        <h1
          className="text-[#1a2332] flex-1 text-center mr-8"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          세탁 AI 도우미
        </h1>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ paddingBottom: `calc(140px + ${keyboardHeight}px)` }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 self-end"
                style={{ background: "linear-gradient(135deg, #87CEEB, #98D8C8)", marginBottom: "2px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 6l1 1v11a1 1 0 001 1h12a1 1 0 001-1V7l1-1" />
                  <path d="M3 6h18M8 6V4h8v2" />
                </svg>
              </div>
            )}
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                maxWidth: "78%",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #87CEEB, #76bdd8)"
                  : "white",
                color: msg.role === "user" ? "white" : "#1a2332",
                fontSize: "14px",
                lineHeight: "1.65",
                fontWeight: 400,
                boxShadow: msg.role === "user"
                  ? "0 4px 14px rgba(135,206,235,0.4)"
                  : "0 2px 10px rgba(0,0,0,0.06)",
                borderBottomRightRadius: msg.role === "user" ? "6px" : "18px",
                borderBottomLeftRadius: msg.role === "assistant" ? "6px" : "18px",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-2 flex-shrink-0" style={{ background: "linear-gradient(135deg, #87CEEB, #98D8C8)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 6l1 1v11a1 1 0 001 1h12a1 1 0 001-1V7l1-1" />
                <path d="M3 6h18M8 6V4h8v2" />
              </svg>
            </div>
            <div className="rounded-2xl px-5 py-3.5 flex items-center gap-1.5" style={{ background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderBottomLeftRadius: "6px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#87CEEB",
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions + Input */}
      <div
        className="fixed left-0 right-0"
        style={{
          bottom: `${keyboardHeight}px`,
          background: "white",
          borderTop: "1px solid #eef1f5",
          paddingBottom: keyboardHeight > 0 ? "8px" : "env(safe-area-inset-bottom)",
          transition: "bottom 0.15s ease-out",
        }}
      >
        {/* Quick Questions */}
        <div className="px-4 pt-3 pb-2 overflow-x-auto">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="rounded-full px-3 py-2 whitespace-nowrap transition-all"
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0c4a6e",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-4 pt-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="세탁 관련 질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 rounded-2xl px-4 py-3 outline-none"
            style={{
              background: "#f0f4f8",
              border: "1.5px solid transparent",
              fontSize: "14px",
              color: "#1a2332",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#87CEEB")}
            onBlur={(e) => (e.target.style.borderColor = "transparent")}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !isLoading ? "#87CEEB" : "#e0e7ef",
              boxShadow: input.trim() && !isLoading ? "0 4px 12px rgba(135,206,235,0.4)" : "none",
            }}
          >
            {isLoading ? (
              <Loader2 size={18} color="white" strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={18} color={input.trim() ? "white" : "#8896a8"} strokeWidth={2.5} />
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}