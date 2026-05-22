from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services import database
app = FastAPI()

# 프론트엔드 연결 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_laundry(
    clothingImage: UploadFile = File(...),
    labelType: str = Form(...),
    labelImage: UploadFile = File(None)
):
    """AI 모델이 완성되기 전, 프론트엔드 테스트를 위한 가짜(Mock) 응답"""

    symbols_data = ["machine_wash", "no_bleach"] if labelType == "symbol" else None
    ocr_data = {
        "materials": ["폴리에스터 65%", "면 35%"],
        "care": ["뒤집어서 세탁하십시오"]
    } if labelType == "ocr" else None

    mock_result = {
        "cloth_type": "knit",
        "confidence": 0.95,
        "risk_level": "고위험군",
        "wash_method": "30℃ 손세탁",
        "dry_method": "그늘에 뉘어서 건조",
        "caution": "물빠짐 주의",
        "symbols": symbols_data,
        "ocr_result": ocr_data
    }

    # DB 저장 (경로는 임시)
    database.save_record(mock_result, f"/images/dummy_{clothingImage.filename}")

    return {
        "status": "success",
        "message": "AI 분석 완료 (임시 데이터)",
        "data": mock_result
    }