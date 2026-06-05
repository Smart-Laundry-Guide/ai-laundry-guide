// ─────────────────────────────────────────────────────────────────────────────
// chatService.ts
//
// 🔌 챗봇 API 연동 방법:
//   1. API_BASE_URL 에 백엔드 서버 주소를 입력하세요. (analysisService와 동일)
//   2. 백엔드 /chat 엔드포인트가 준비되면 주석 처리된 실제 호출 블록을 해제하세요.
//   3. Mock 응답 블록을 제거하세요.
//
// 📌 백엔드 /chat 엔드포인트 명세:
//   POST /chat
//   Request:  { messages: { role: 'user'|'assistant', content: string }[] }
//   Response: { reply: string }
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. API 엔드포인트 설정 (analysisService.ts와 동일한 주소) ─────────────────
// TODO: 실제 서버 주소로 교체하세요
const API_BASE_URL = 'https://your-api-server.example.com';

// ── 2. 타입 정의 ──────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  /** 현재까지의 전체 대화 기록 (컨텍스트 유지용) */
  messages: ChatMessage[];
}

export interface ChatResponse {
  /** 어시스턴트 응답 텍스트 */
  reply: string;
}

// ── 3. Mock 응답 (연동 전까지 사용) ──────────────────────────────────────────
const MOCK_REPLIES: Record<string, string> = {
  '니트': '니트는 30°C 이하 찬물에서 손세탁하거나 울 코스로 세탁하세요. 건조기는 절대 금지! 평평하게 펴서 자연건조해야 변형을 막을 수 있어요 👕',
  '데님': '데님은 처음 세탁 시 꼭 단독으로, 찬물에 뒤집어서 세탁하세요. 색 빠짐을 줄이려면 그늘에서 건조하는 게 좋아요 👖',
  '얼룩': '얼룩은 즉시 찬물로 두드려 제거하는 게 핵심이에요! 문지르면 번질 수 있으니 주의하고, 종류에 따라 제거법이 달라져요 🧹',
};

function getMockReply(userMessage: string): string {
  for (const [keyword, reply] of Object.entries(MOCK_REPLIES)) {
    if (userMessage.includes(keyword)) return reply;
  }
  return '세탁 관련 질문이라면 뭐든 도와드릴게요! 의류 종류나 얼룩 종류를 알려주시면 더 정확하게 안내해 드릴 수 있어요 😊';
}

// ── 4. 메인 호출 함수 ─────────────────────────────────────────────────────────
export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {

  // ── 실제 API 호출 (연동 시 아래 블록 주석 해제) ──────────────────────────
  /*
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: req.messages }),
  });

  if (!response.ok) {
    throw new Error(`챗봇 서버 오류: ${response.status}`);
  }

  return response.json() as Promise<ChatResponse>;
  */

  // ── Mock 응답 반환 — 연동 후 이 블록을 제거하세요 ────────────────────────
  await new Promise(r => setTimeout(r, 800)); // 응답 지연 시뮬레이션
  const lastUserMessage = req.messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
  return { reply: getMockReply(lastUserMessage) };
}
