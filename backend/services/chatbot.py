import os
import google.generativeai as genai
from dotenv import load_dotenv

# .env 파일에서 GEMINI_API_KEY 읽어오기
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 제미나이 API 키 설정
genai.configure(api_key=GEMINI_API_KEY)

# 모바일 앱 환경에 맞게 페르소나 및 응답 규칙 강화
system_prompt = """너는 친절하고 전문적인 세탁 도우미 AI야. 모바일 앱 챗봇 환경에 맞게 반드시 아래의 규칙을 엄격하게 지켜서 대답해.

1. 서론/결론 생략: 불필요한 인사말이나 장황한 설명은 빼고 즉시 본론(해결책)만 간결하게 말해.
2. 모바일 가독성: 한 번의 답변은 최대 3~4문단을 넘지 마. 가능한 핵심만(필요하다면 글머리 기호와 번호만 활용) 요약해.
3. 핑퐁 대화 유도: 처음부터 모든 경우의 수를 길게 나열하지 마. 가장 대표적인 해결책 1가지만 짧게 제안하고, "옷의 소재가 무엇인가요?" 또는 "정확히 어떤 얼룩인가요? (예: 커피, 기름, 땀, 잉크 등)"라고 예시와 함께 되물어서 사용자와 짧은 핑퐁 대화를 이어나가.
4. 기호 및 이모티콘 절대 금지: '**', '*', '#' 같은 마크다운 기호나 이모티콘을 절대 사용하지 마. 오직 순수한 텍스트(Plain text)로만 작성해."""


model = genai.GenerativeModel(
    model_name='gemini-2.5-flash-lite',
    system_instruction=system_prompt
)

def get_gemini_response(messages):
    """
    프론트엔드의 대화 내역(messages)을 제미나이 형식으로 변환하여 연속된 대화를 처리합니다.
    """
    try:
        if not messages:
            return "질문을 입력해주세요."

        gemini_history = []
        
        # 1. 마지막 메시지를 제외한 이전 대화들을 제미나이 history 형식으로 변환
        for msg in messages[:-1]:
            role = msg.get("role")
            content = msg.get("content", "")
            
            # 프론트엔드의 assistant 혹은 model 역할을 제미나이 스펙('model')에 맞춤
            gemini_role = "model" if role in ["assistant", "model"] else "user"
            
            gemini_history.append({
                "role": gemini_role,
                "parts": [content]
            })
            
        # 2. 이전 대화 내역을 가진 채팅 세션 시작
        chat = model.start_chat(history=gemini_history)
        
        # 3. 가장 최신의 사용자 질문 전송 및 답변 생성
        last_user_message = messages[-1].get("content", "")
        response = chat.send_message(last_user_message)
        
        return response.text

    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return f"[오류] 챗봇 응답을 생성하는 중 문제가 발생했습니다: {str(e)}"