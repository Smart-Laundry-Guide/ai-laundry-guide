# backend/services/chat_service.py

def get_claude_response(messages):
    """
    API 키 연결 전까지 사용할 가짜 응답 함수
    """
    # 마지막으로 보낸 사용자 메시지 가져오기
    last_user_message = messages[-1].get("content", "질문") if messages else "질문"
    
    return f"[테스트 모드] Claude가 아직 연결되지 않았음. API 키가 연결되면 실제 답변이 나갈 예정."