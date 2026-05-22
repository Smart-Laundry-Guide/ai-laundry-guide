import sqlite3
import json
from datetime import datetime

DB_FILE = "laundry_records.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            cloth_type TEXT,
            confidence REAL,
            wash_method TEXT,
            dry_method TEXT,
            caution TEXT,
            risk_level TEXT,
            symbols TEXT,
            ocr_result TEXT,
            image_path TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_record(data: dict, image_path: str):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    symbols_json = json.dumps(data.get("symbols")) if data.get("symbols") else None
    ocr_result_json = json.dumps(data.get("ocr_result"), ensure_ascii=False) if data.get("ocr_result") else None
    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    cursor.execute('''
        INSERT INTO records (
            created_at, cloth_type, confidence, wash_method, dry_method, 
            caution, risk_level, symbols, ocr_result, image_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        now, data.get("cloth_type"), data.get("confidence"), data.get("wash_method"),
        data.get("dry_method"), data.get("caution"), data.get("risk_level"),
        symbols_json, ocr_result_json, image_path
    ))
    conn.commit()
    conn.close()

init_db()