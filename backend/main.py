from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services.database import init_db, save_record, get_all_records
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

    # DB 저장을 위한 데이터 가공
    top_candidates = ai_result.get("topCandidates", [])
    top_cls = top_candidates[0].get("cls", "unknown") if top_candidates else "unknown"
    top_conf = top_candidates[0].get("confidence", 0.0) if top_candidates else 0.0
    
    # 이미지 저장
    save_path = f"temp_images/real_{clothingImage.filename}"
    with open(save_path, "wb") as f:
        f.write(clothing_bytes)

    db_record = {
        "cloth_type": top_cls,
        "confidence": top_conf,
        "symbols": ai_result.get("symbols"),
        "ocr_result": ai_result.get("ocrResult"),
        "wash_method": ai_result.get("modelSummary"),
        "dry_method": None,
        "caution": None,
        "risk_level": None,
        "image_path": save_path
    }

    # DB 저장 (database.py 호출)
    save_record(db_record)

    return {
        "status": "success",
        "message": "AI 분석 완료",
        "data": ai_result
    }

# 2. GET /records
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