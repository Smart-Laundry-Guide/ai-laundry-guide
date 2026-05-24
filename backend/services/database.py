import sqlite3
import json

DB_PATH = "laundry_records.db"

def get_db_connection():
    """DB 연결 객체를 반환합니다."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 결과를 딕셔너리로 받기 위함
    return conn

def init_db():
    """테이블이 없으면 생성합니다."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cloth_type TEXT,
            confidence REAL,
            wash_method TEXT,
            dry_method TEXT,
            caution TEXT,
            risk_level TEXT,
            symbols TEXT,    -- JSON string으로 저장
            ocr_result TEXT, -- JSON string으로 저장
            image_path TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_record(data):
    """
    세탁 기록을 DB에 저장합니다.
    data는 사전(dict) 형태여야 합니다.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # JSON 데이터는 string으로 변환해서 저장
    symbols = json.dumps(data.get("symbols")) if data.get("symbols") else None
    ocr = json.dumps(data.get("ocr_result")) if data.get("ocr_result") else None
    
    cursor.execute('''
        INSERT INTO records (
            cloth_type, confidence, wash_method, dry_method, 
            caution, risk_level, symbols, ocr_result, image_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get("cloth_type"), data.get("confidence"), data.get("wash_method"),
        data.get("dry_method"), data.get("caution"), data.get("risk_level"),
        symbols, ocr, data.get("image_path")
    ))
    
    conn.commit()
    conn.close()

def get_all_records(limit=10, offset=0):
    """최신순으로 기록을 조회합니다 (페이징 지원)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM records 
        ORDER BY id DESC 
        LIMIT ? OFFSET ?
    ''', (limit, offset))
    
    rows = cursor.fetchall()
    
    # 저장된 JSON 문자열을 다시 파이썬 딕셔너리로 변환해서 반환
    results = []
    for row in rows:
        record = dict(row)
        record["symbols"] = json.loads(record["symbols"]) if record["symbols"] else None
        record["ocr_result"] = json.loads(record["ocr_result"]) if record["ocr_result"] else None
        results.append(record)
        
    conn.close()
    return results