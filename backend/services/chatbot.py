import os
from openai import OpenAI
from dotenv import load_dotenv

# 환경변수 로드 및 OpenAI 클라이언트 초기화
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 모바일 앱 환경에 맞게 페르소나 및 응답 규칙 강화
system_prompt = """너는 친절하고 전문적인 세탁 도우미 AI야. 모바일 앱 챗봇 환경에 맞게 반드시 아래의 규칙을 엄격하게 지켜서 대답해.

1. 서론/결론 생략: 불필요한 인사말이나 장황한 설명은 빼고 즉시 본론(해결책)만 간결하게 말해.
2. 모바일 가독성: 한 번의 답변은 최대 3~4문단을 넘지 마. 가능한 핵심만(필요하다면 글머리 기호와 번호만 활용) 요약해.
3. 핑퐁 대화 유도: 처음부터 모든 경우의 수를 길게 나열하지 마. 가장 대표적인 해결책 1가지만 짧게 제안하고, "옷의 소재가 무엇인가요?" 또는 "정확히 어떤 얼룩인가요? (예: 커피, 기름, 땀, 잉크 등)"라고 예시와 함께 되물어서 사용자와 짧은 핑퐁 대화를 이어나가.
4. 기호 및 이모티콘 절대 금지: '**', '*', '#' 같은 마크다운 기호나 이모티콘을 절대 사용하지 마. 오직 순수한 텍스트(Plain text)로만 작성해."""


def get_chatgpt_response(messages):
    """
    프론트엔드의 대화 내역(messages)을 OpenAI 형식으로 변환하여 연속된 대화를 처리합니다.
    """
    try:
        if not messages:
            return "질문을 입력해주세요."

        # OpenAI에 보낼 메시지 리스트 준비 (시스템 프롬프트를 맨 앞에 'system' 역할로 추가)
        openai_messages = [{"role": "system", "content": system_prompt}]
        
        # 프론트엔드에서 온 메시지를 OpenAI 형식에 맞게 정리해서 추가
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")
            
            openai_role = "assistant" if role in ["assistant", "model"] else "user"
            
            openai_messages.append({
                "role": openai_role,
                "content": content
            })
            
        # ChatGPT API 호출 (gpt-5.4-mini 모델 사용)
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=openai_messages,
            temperature=0.7
        )
        
        # 생성된 답변 텍스트만 추출하여 반환
        return response.choices[0].message.content

    except Exception as e:
        # 디버깅을 위해 터미널 출력, 화면에는 안내 메시지 반환
        print(f"OpenAI API Error: {str(e)}")
        return f"[오류] 챗봇 응답을 생성하는 중 문제가 발생했습니다: {str(e)}"