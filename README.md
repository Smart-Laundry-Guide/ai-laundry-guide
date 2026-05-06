# 🧺 Laundry Care — 세탁 도우미 앱 (Frontend)

> AI 기반 세탁 라벨 해석 및 세탁 실수 방지 도우미 시스템의 프론트엔드 레포지토리입니다.

<br>

## 📌 프로젝트 소개

**Laundry Care**는 옷 사진 또는 세탁 라벨 사진을 업로드하면 AI가 의류 종류를 분류하고, 세탁 기호를 인식하여 맞춤형 세탁 가이드를 제공하는 모바일 웹 애플리케이션입니다.

- 의류 분류 모델(EfficientNet-B0)이 사진만으로 저·중·고위험군을 판별
- PaddleOCR로 세탁 라벨 텍스트를 인식하여 세탁 방법·금지 사항·주의 문구를 추출
- YOLOv11s로 세탁 기호를 탐지하여 기호별 가이드를 제공
- 분석 기록을 로컬 저장소에 보관하고 종류·기간별 필터로 조회

<br>

## ✨ 주요 기능

| 화면 | 기능 |
|---|---|
| 홈 | 세탁 전 체크리스트, 기능 메뉴 진입 |
| 사진 업로드 | 카메라 촬영 또는 갤러리 선택, 세탁 라벨 추가 |
| 분석 결과 | 의류 종류·위험군·세탁 가이드, Top-2 후보 선택 |
| 분석 기록 | localStorage 기반 저장, 검색·필터 |
| 세탁 기호 사전 | 기호별 의미 안내 |
| 얼룩 제거 | 상황별 얼룩 제거법 가이드 |
| AI 챗봇 | 세탁 관련 질의응답 |

<br>

## 🛠 기술 스택

| 분류 | 사용 기술 |
|---|---|
| 프레임워크 | React 18 + Vite 6 |
| 라우팅 | React Router 7 |
| 스타일링 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui, Radix UI |
| 아이콘 | Lucide React |
| 상태 저장 | localStorage |
| 패키지 매니저 | npm |

<br>

## 🗂 폴더 구조

```
src/
└── app/
    ├── components/
    │   ├── BottomNav.tsx       # 하단 네비게이션
    │   └── ui/                 # shadcn/ui 공통 컴포넌트
    ├── screens/
    │   ├── HomeScreen.tsx      # 홈
    │   ├── CameraScreen.tsx    # 사진 업로드 (카메라/갤러리)
    │   ├── LoadingScreen.tsx   # 분석 중
    │   ├── ResultScreen.tsx    # 세탁 가이드 결과
    │   ├── HistoryScreen.tsx   # 분석 기록
    │   ├── GuideScreen.tsx     # 세탁 기호 사전
    │   ├── StainRemoveScreen.tsx # 얼룩 제거 가이드
    │   └── ChatbotScreen.tsx   # AI 챗봇
    ├── App.tsx                 # 스플래시 화면 + 라우터
    └── routes.tsx              # 라우트 정의
```

<br>

## ⚙️ 실행 방법

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

> 개발 서버는 기본적으로 `http://localhost:5173` 에서 실행됩니다.

<br>

## 🔗 백엔드 연동 구조

현재 프론트엔드는 목업 데이터로 동작합니다. FastAPI 백엔드 연동 시 아래 흐름으로 API를 호출합니다.

```
사진 업로드 (CameraScreen)
    ↓
POST /analyze  (FormData: clothing_image, label_image?)
    ↓  FastAPI
EfficientNet-B0  +  YOLOv11s  +  PaddleOCR
    ↓
JSON 응답: { topCandidates, symbols, ocrResult, lowConfidence }
    ↓
결과 화면 (ResultScreen)
```

응답 데이터는 `LoadingScreen → ResultScreen` 으로 `location.state`를 통해 전달됩니다.

<br>

## 🗺 화면 흐름

```
홈 (/)
 ├─ 사진 업로드 (/camera)
 │   └─ 분석 중 (/loading)
 │       └─ 결과 (/result)
 │           └─ 분석 기록 (/history)
 ├─ 세탁 기호 사전 (/guide)
 ├─ AI 챗봇 (/chatbot)
 ├─ 지난 분석 (/history)
 └─ 얼룩 제거 (/stain)
```

<br>

## 📋 위험군 분류 기준

의류 분류 모델(EfficientNet-B0 v4)의 9개 클래스에 대해 아래 위험군 기준을 적용합니다.

| 위험군 | 클래스 | 세탁 가이드 요약 |
|---|---|---|
| 🔴 고위험군 | knit, blouse, jacket | 손세탁 또는 드라이클리닝 권장 |
| 🟡 중위험군 | T_shirt, shirt, dress, skirt | 30°C 이하 약한 세탁 |
| 🟢 저위험군 | denim, pants | 일반 세탁 가능 |

<br>
