from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services.database import init_db, save_record, get_all_records
from pydantic import BaseModel
from services.chatbot import get_gemini_response
import os

# 파이프라인 함수 불러오기
from pipeline import run_pipeline 

app = FastAPI()

# 0. CORS 및 DB 초기화
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()  # 서버 시작 시 DB 테이블 자동 생성
    os.makedirs("temp_images", exist_ok=True) # 이미지 저장 폴더 생성

# 1. POST /analyze
@app.post("/analyze")
async def analyze_laundry(
    clothingImage: UploadFile = File(...),
    labelType: str = Form(...),
    labelImage: UploadFile = File(None)
):
    # 사진 바이트 변환
    clothing_bytes = await clothingImage.read()
    label_bytes = await labelImage.read() if labelImage is not None else None

    # AI 파이프라인 실행
    try:
        ai_result = run_pipeline(
            clothing_bytes=clothing_bytes, 
            label_bytes=label_bytes, 
            label_type=labelType
        )
    except Exception as e:
        return {"status": "error", "message": f"AI 분석 중 오류 발생: {str(e)}"}

    # --- 1. DB 저장을 위한 데이터 가공 ---
    top_candidates = ai_result.get("topCandidates", [])
    top_cls = top_candidates[0].get("cls", "unknown") if top_candidates else "unknown"
    top_conf = top_candidates[0].get("confidence", 0.0) if top_candidates else 0.0
    
    # 이미지 저장
    save_path = f"temp_images/real_{clothingImage.filename}"
    with open(save_path, "wb") as f:
        f.write(clothing_bytes)

    # labelType에 따라 DB에 들어갈 JSON 값 확실히 분리하기
    db_symbols = ai_result.get("symbols") if labelType == "symbol" else None
    db_ocr = ai_result.get("ocrResult") if labelType == "ocr" else None

    db_record = {
        "cloth_type": top_cls,
        "confidence": top_conf,
        "symbols": db_symbols,
        "ocr_result": db_ocr,
        "wash_method": ai_result.get("modelSummary"),
        "dry_method": None,
        "caution": None,
        "risk_level": None,
        "image_path": save_path
    }

    # DB 저장 (database.py 호출)
    save_record(db_record)

    # --- 2. 프론트엔드 응답(API Spec) 맞춤 가공 ---
    response_data = {
        "topCandidates": top_candidates
    }
    
    # labelType이 symbol일 때만 symbols 데이터 정제 후 추가
    if labelType == "symbol" and "symbols" in ai_result:
        # spec 요구사항에 따라 confidence 필드 제거하고 cls, subclass만 전달
        cleaned_symbols = [
            {"cls": s.get("cls"), "subclass": s.get("subclass")} 
            for s in ai_result.get("symbols", [])
        ]
        response_data["symbols"] = cleaned_symbols
        
    # labelType이 ocr일 때만 ocrResult 추가
    elif labelType == "ocr" and "ocrResult" in ai_result:
        response_data["ocrResult"] = ai_result.get("ocrResult")
        
    # modelSummary가 있으면 추가
    if "modelSummary" in ai_result:
        response_data["modelSummary"] = ai_result.get("modelSummary")

    # 프론트엔드에 진짜 결과 반환
    return {
        "status": "success",
        "message": "AI 분석 완료",
        "data": response_data
    }


# 대화 목록을 받기 위한 데이터 구조 정의
class ChatRequest(BaseModel):
    messages: list

# 2. POST /chat
@app.post("/api/chat", summary="AI 채팅 서비스")
async def chat_with_ai(request: ChatRequest):
    try:
        # 가짜 응답 함수 호출
        reply = get_gemini_response(request.messages)
        return {"reply": reply}
    except Exception as e:
        return {"status": "error", "message": f"채팅 처리 중 오류 발생: {str(e)}"}
    
# 3. GET /records
@app.get("/records", summary="세탁 기록 목록 조회")
async def get_laundry_records(limit: int = 10, offset: int = 0):
    """
    DB에서 세탁 분석 기록을 불러옵니다.
    """
    records = get_all_records(limit=limit, offset=offset)
    return {
        "status": "success",
        "message": "세탁 기록을 성공적으로 불러왔습니다.",
        "data": records
    }