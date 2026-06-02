# Laundry Care Backend

Laundry Care의 백엔드 서버입니다. 의류 이미지와 세탁 라벨 이미지를 받아 AI 분석 파이프라인을 실행하고, 세탁 가이드 결과와 분석 기록 API를 제공합니다.

## 주요 기능

- 의류 이미지 기반 의류 종류 분류
- 세탁 기호 라벨 이미지 기반 세탁 기호 탐지
- 텍스트 라벨 이미지 기반 OCR 분석
- 의류 종류, 세탁 기호, OCR 결과를 조합한 세탁 가이드 생성
- 분석 결과를 SQLite 데이터베이스에 저장
- 저장된 세탁 분석 기록 조회
- 세탁 관련 챗봇 API 제공

## 기술 스택

- Python
- FastAPI
- Uvicorn
- SQLite
- PyTorch
- torchvision
- Ultralytics YOLO
- PaddleOCR
- OpenCV
- Pillow
- Google Generative AI

## 프로젝트 구조

```text
backend/
├── main.py
├── pipeline.py
├── chatbot.py
├── requirements.txt
├── .env.example
├── models/
│   ├── efficientnet_classifier.py
│   ├── yolo_detector.py
│   ├── ocr_extractor.py
│   └── guide_generator.py
├── services/
│   ├── chatbot.py
│   └── database.py
```

관련 모델 가중치는 프로젝트 루트의 `model_weights/` 폴더를 사용합니다.

```text
Laundry-Care/
├── backend/
└── model_weights/
    ├── EfficientNet_B0_final.pth
    └── symbol_detector/
        └── best.pt
```

## 실행 방법

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
```

Windows PowerShell:

```bash
venv\Scripts\Activate.ps1
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

`.env.example` 파일을 복사해 `.env` 파일을 만들고 필요한 API 키를 입력합니다.

```bash
cp .env.example .env
```

챗봇 API를 사용하려면 `.env`에 다음 값을 설정합니다.

```env
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 서버 실행

```bash
uvicorn main:app --reload
```

기본 실행 주소:

```text
http://localhost:8000
```

FastAPI 문서:

```text
http://localhost:8000/docs
```

## API 명세

### POST `/analyze`

의류 이미지와 라벨 정보를 받아 AI 분석을 수행합니다.

요청 형식: `multipart/form-data`

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `clothingImage` | File | 필수 | 의류 이미지 |
| `labelType` | string | 필수 | `none`, `symbol`, `ocr` 중 하나 |
| `labelImage` | File | 선택 | 세탁 라벨 이미지 |

응답 예시:

```json
{
  "status": "success",
  "message": "AI 분석 완료",
  "data": {
    "topCandidates": [
      {
        "cls": "knit",
        "confidence": 0.91
      }
    ],
    "symbols": [
      {
        "cls": "hand_wash",
        "subclass": "30도 이하"
      }
    ],
    "modelSummary": "분석 결과 기반 세탁 가이드"
  }
}
```

### POST `/api/chat`

세탁 관련 챗봇 응답을 생성합니다.

요청 예시:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "니트는 어떻게 세탁해?"
    }
  ]
}
```

응답 예시:

```json
{
  "reply": "니트 세탁 안내 응답"
}
```

### GET `/records`

저장된 세탁 분석 기록을 조회합니다.

쿼리 파라미터:

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `limit` | `10` | 조회할 기록 수 |
| `offset` | `0` | 조회 시작 위치 |

응답 예시:

```json
{
  "status": "success",
  "message": "세탁 기록을 성공적으로 불러왔습니다.",
  "data": []
}
```

## 분석 파이프라인

`pipeline.py`의 `run_pipeline()` 함수가 전체 분석 흐름을 담당합니다.

1. `efficientnet_classifier.py`에서 의류 종류를 분류합니다.
2. `labelType`이 `symbol`이면 `yolo_detector.py`로 세탁 기호를 탐지합니다.
3. 탐지된 기호에 필요한 텍스트가 있으면 `ocr_extractor.py`로 세부 정보를 추출합니다.
4. `labelType`이 `ocr`이면 전체 라벨 텍스트를 OCR로 분석합니다.
5. `guide_generator.py`에서 최종 세탁 가이드 문장을 생성합니다.
6. `services/database.py`를 통해 분석 기록을 SQLite DB에 저장합니다.

## 데이터 저장

서버 시작 시 `laundry_records.db`가 초기화되고, 분석 결과는 `records` 테이블에 저장됩니다.

저장되는 주요 항목:

- 의류 분류 결과
- 신뢰도
- 세탁 기호 결과
- OCR 결과
- 세탁 가이드 요약
- 업로드 이미지 저장 경로

업로드된 의류 이미지는 `temp_images/` 폴더에 저장됩니다.

## 개발 참고

- FastAPI 앱과 라우터는 `main.py`에 있습니다.
- 모델 통합 흐름은 `pipeline.py`에 있습니다.
- 의류 분류 모델 경로는 `model_weights/EfficientNet_B0_final.pth`입니다.
- 세탁 기호 탐지 모델 경로는 `model_weights/symbol_detector/best.pt`입니다.
- SQLite DB 파일명은 `laundry_records.db`입니다.
