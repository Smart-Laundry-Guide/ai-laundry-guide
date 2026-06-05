import {
  BookOpen,
  Clock,
  Droplets,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { useState } from "react";

const checklistItems = [
  { id: 1, label: "흰옷 분리" },
  { id: 2, label: "주머니 확인" },
  { id: 3, label: "지퍼 잠금" },
  { id: 4, label: "세탁망 준비" },
];

export function HomeScreen() {
  const [checked, setChecked] = useState<number[]>([]);

  const toggle = (id: number) => {
    setChecked((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id],
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-24"
      style={{ background: "#f8fafb" }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-5">
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#1a2332",
            lineHeight: "1.2",
            marginTop: "2px",
          }}
        >
          Laundry Care
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7688",
            marginTop: "4px",
          }}
        >
          초보자도 쉽게 보는 세탁 도우미
        </p>
      </div>

      <div className="px-6 flex flex-col flex-1">
        {/* Hero Card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #e3f4fb 0%, #daeef6 50%, #d4f1e8 100%)",
            boxShadow: "0 10px 32px rgba(135, 206, 235, 0.32)",
            marginBottom: "28px",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: "120px",
              height: "120px",
              background: "#87CEEB",
              opacity: 0.15,
              top: "-30px",
              right: "-30px",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "70px",
              height: "70px",
              background: "#98D8C8",
              opacity: 0.2,
              bottom: "-20px",
              right: "50px",
            }}
          />

          <div className="relative flex items-center gap-4 mb-4">
            <div
              className="bg-white rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                width: "64px",
                height: "64px",
                boxShadow: "0 4px 12px rgba(135,206,235,0.3)",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#87CEEB"
                strokeWidth="1.5"
              >
                <path d="M3 6l1 1v11a1 1 0 001 1h12a1 1 0 001-1V7l1-1" />
                <path d="M3 6h18M8 6V4h8v2" />
                <path d="M9 11s1-1 3-1 3 1 3 1" />
                <path d="M9 15s1-1 3-1 3 1 3 1" />
              </svg>
            </div>
            <div className="flex-1">
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1a2332",
                  lineHeight: "1.4",
                }}
              >
                옷 사진을 찍고
                <br />
                세탁 방법을 확인하세요
              </h2>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-2 mb-4">
            {checklistItems.map((item) => {
              const isChecked = checked.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all"
                  style={{
                    background: isChecked
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.55)",
                    border: isChecked
                      ? "1.5px solid #87CEEB"
                      : "1.5px solid rgba(255,255,255,0.7)",
                    boxShadow: isChecked
                      ? "0 2px 8px rgba(135,206,235,0.25)"
                      : "none",
                  }}
                >
                  {isChecked ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#87CEEB"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: "1.5px solid #87CEEB",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isChecked ? "#1a5f7a" : "#5a6a7d",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to="/camera"
            className="relative flex items-center justify-center w-full text-white rounded-2xl py-4 hover:opacity-90 transition-opacity"
            style={{
              fontSize: "15px",
              fontWeight: 700,
              background: "#87CEEB",
              boxShadow: "0 4px 14px rgba(135,206,235,0.45)",
            }}
          >
            사진 촬영하기
          </Link>
        </div>

        {/* Row 1: 세탁 기호 설명 (full-width) */}
        <Link
          to="/guide"
          className="rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #f0f9ff 0%, #e1f3fb 100%)",
            boxShadow: "0 6px 22px rgba(135,206,235,0.18)",
            marginBottom: "10px",
          }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: "46px",
                height: "46px",
                background: "white",
                boxShadow: "0 3px 10px rgba(56,182,232,0.2)",
              }}
            >
              <BookOpen
                size={22}
                color="#38b6e8"
                strokeWidth={2}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#0c4a6e",
                }}
              >
                세탁 기호 설명
              </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#4a6ea8",
                    marginTop: "2px",
                  }}
                >
                헷갈리는 세탁기호를 확인해요
                  </p>
            </div>
          </div>
          <svg
            className="relative z-10 flex-shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0c4a6e"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* Row 2: AI 챗봇 (full-width) */}
        <Link
          to="/chatbot"
          className="rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #eff6ff 0%, #ddeaff 100%)",
            boxShadow: "0 6px 22px rgba(100,148,250,0.16)",
            marginBottom: "28px",
          }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: "46px",
                height: "46px",
                background: "white",
                boxShadow: "0 3px 10px rgba(58,150,232,0.2)",
              }}
            >
              <MessageCircle
                size={22}
                color="#3a96e8"
                strokeWidth={2}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#0c3d6e",
                }}
              >
                AI 챗봇
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#4a6ea8",
                  marginTop: "2px",
                }}
              >
                세탁이 막막할 땐 물어보세요
              </p>
            </div>
          </div>
          <svg
            className="relative z-10 flex-shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0c3d6e"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          {/* 지난 분석 */}
          <Link
            to="/history"
            className="rounded-2xl p-4 flex flex-col relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #edfbfc 0%, #d6f2f6 100%)",
              boxShadow: "0 6px 20px rgba(40,168,204,0.16)",
              minHeight: "124px",
            }}
          >
            <div
              className="rounded-xl flex items-center justify-center relative z-10"
              style={{
                width: "42px",
                height: "42px",
                background: "white",
                boxShadow: "0 2px 8px rgba(40,168,204,0.2)",
              }}
            >
              <Clock
                size={20}
                color="#28a8cc"
                strokeWidth={2}
              />
            </div>
            <div className="mt-auto">
              <p
                className="relative z-10"
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#0a3d52",
                  marginTop: "10px",
                }}
              >
                세탁 기록
              </p>
              <p
                className="relative z-10"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#3e7c94",
                  marginTop: "2px",
                  letterSpacing: "-0.3px",
                }}
              >
                지난 분석 다시보기
              </p>
            </div>
          </Link>

          {/* 얼룩 제거 */}
          <Link
            to="/stain"
            className="rounded-2xl p-4 flex flex-col relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #f2f6ff 0%, #e2ecff 100%)",
              boxShadow: "0 6px 20px rgba(74,143,232,0.16)",
              minHeight: "124px",
            }}
          >
            <div
              className="rounded-xl flex items-center justify-center relative z-10"
              style={{
                width: "42px",
                height: "42px",
                background: "white",
                boxShadow: "0 2px 8px rgba(74,143,232,0.2)",
              }}
            >
              <Droplets
                size={20}
                color="#4a8fe8"
                strokeWidth={2}
              />
            </div>
            <div className="mt-auto">
              <p
                className="relative z-10"
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#0c2e60",
                  marginTop: "10px",
                }}
              >
                얼룩 제거
              </p>
              <p
                className="relative z-10"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#4a6ea8",
                  marginTop: "2px",
                  letterSpacing: "-0.3px",
                }}
              >
                상황별 맞춤 대처
              </p>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}