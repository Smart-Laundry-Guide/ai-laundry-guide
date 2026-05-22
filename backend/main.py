from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services import database
import os
import sqlite3

# 파이프라인 함수 불러오기
from pipeline import run_pipeline 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp_images", exist_ok=True)

@app.post("/analyze")
async def analyze_laundry(
    clothingImage: UploadFile = File(...),
    labelType: str = Form(...),
    labelImage: UploadFile = File(None)
):
    # 1. 프론트엔드에서 보낸 사진을 인공지능이 읽을 수 있게 바이트(bytes)로 변환
    clothing_bytes = await clothingImage.read()
    
    label_bytes = None
    if labelImage is not None:
        label_bytes = await labelImage.read()

    # 2. AI 파이프라인 실행
    try:
        ai_result = run_pipeline(
            clothing_bytes=clothing_bytes, 
            label_bytes=label_bytes, 
            label_type=labelType
        )
    except Exception as e:
        return {"status": "error", "message": f"AI 분석 중 오류 발생: {str(e)}"}

    # 3. DB에 저장하기 위한 데이터 가공 (가장 확률 높은 옷 종류 뽑기)
    top_candidates = ai_result.get("topCandidates", [])
    top_cls = top_candidates[0].get("cls", "unknown") if top_candidates else "unknown"
    top_conf = top_candidates[0].get("confidence", 0.0) if top_candidates else 0.0
    
    db_record = {
        "cloth_type": top_cls,
        "confidence": top_conf,
        "symbols": ai_result.get("symbols"),
        "ocr_result": ai_result.get("ocrResult"),
        "wash_method": ai_result.get("modelSummary"), # 요약본을 임시로 세탁법 칸에 저장
        "dry_method": None,
        "caution": None,
        "risk_level": None
    }

    # 이미지를 temp_images 폴더에 실제로 저장 (경로 생성)
    save_path = f"temp_images/real_{clothingImage.filename}"
    with open(save_path, "wb") as f:
        f.write(clothing_bytes)
        
    # DB에 기록 저장
    database.save_record(db_record, save_path)

    # 4. 프론트엔드에 진짜 분석 결과 반환
    return {
        "status": "success",
        "message": "AI 분석 완료",
        "data": ai_result
    }

@app.get("/records", summary="세탁 기록 목록 조회")
async def get_laundry_records():
    """
    DB에 저장된 사용자의 세탁 분석 기록을 최신순으로 불러옵니다.
    """
    try:
        # DB 연결 (기존에 생성된 파일 이름과 동일해야 합니다)
        conn = sqlite3.connect("laundry_records.db")
        conn.row_factory = sqlite3.Row  # 결과를 딕셔너리 형태로 받기 위함
        cursor = conn.cursor()
        
        # 테이블에서 모든 데이터를 최신순(id 역순)으로 조회
        # (만약 테이블 이름이 다르면 에러가 날 수 있으니 확인이 필요합니다!)
        cursor.execute("SELECT * FROM records ORDER BY id DESC")
        rows = cursor.fetchall()
        
        # 데이터를 JSON 리스트 형태로 변환
        records_list = [dict(row) for row in rows]
        
        return {
            "status": "success",
            "message": "세탁 기록을 성공적으로 불러왔습니다.",
            "data": records_list
        }
        
    except sqlite3.Error as e:
        return {
            "status": "error",
            "message": f"DB 조회 중 오류 발생: {e}"
        }
    finally:
        if conn:
            conn.close()