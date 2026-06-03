# Laundry Care Frontend

Laundry Care의 프론트엔드 애플리케이션입니다. 의류 사진과 세탁 라벨 정보를 기반으로 세탁 가이드를 확인하고, 세탁 기록과 오염 제거 정보를 탐색할 수 있는 화면을 제공합니다.

## 주요 기능

- 홈 화면에서 주요 기능 진입
- 의류 및 세탁 라벨 이미지 촬영/업로드
- 분석 진행 상태를 보여주는 로딩 화면
- 의류 분류, 세탁 기호, OCR 결과 기반 분석 결과 표시
- 세탁 방법 상세 가이드 제공
- 세탁 기록 저장 및 조회
- 오염 종류별 제거 방법 안내
- 세탁 관련 질문을 위한 챗봇 화면 제공

## 기술 스택

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Material UI
- Radix UI
- lucide-react

## 프로젝트 구조

```text
frontend/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── components/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── LaundrySymbols.tsx
│   │   │   └── ui/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── ResultScreen.tsx
│   │   │   ├── GuideScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   ├── StainRemoveScreen.tsx
│   │   │   └── ChatbotScreen.tsx
│   │   ├── services/
│   │   │   ├── analysisService.ts
│   │   │   ├── chatService.ts
│   │   │   └── config.ts
│   │   └── utils/
│   │       └── imageUtils.ts
│   └── styles/
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
├── index.html
├── package.json
└── vite.config.ts
```

## 화면 구성

| 경로 | 화면 | 설명 |
| --- | --- | --- |
| `/` | HomeScreen | 앱 시작 화면 및 주요 기능 진입 |
| `/camera` | CameraScreen | 의류/라벨 이미지 촬영 또는 업로드 |
| `/loading` | LoadingScreen | 분석 진행 상태 표시 |
| `/result` | ResultScreen | 분석 결과와 세탁 요약 표시 |
| `/guide` | GuideScreen | 세탁 기호별 상세 가이드 |
| `/history` | HistoryScreen | 저장된 분석 기록 조회 |
| `/stain` | StainRemovalScreen | 얼룩 제거 방법 안내 |
| `/chatbot` | ChatbotScreen | 세탁 관련 챗봇 화면 |

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

Vite 개발 서버가 실행되면 터미널에 표시되는 로컬 주소로 접속합니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 백엔드 연동

분석 요청은 `src/app/services/analysisService.ts`에서 관리합니다.
현재 서비스는 HTTPS(Vercel)와 HTTP(Oracle Cloud) 간의 Mixed Content 에러를 방지하기 위해 Vercel Proxy를 사용하고 있습니다.

프론트엔드 코드 내의 기본 API 주소는 다음과 같이 `/api`로 설정됩니다.

```ts
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
```

프론트엔드는 `POST /analyze` 엔드포인트로 이미지와 라벨 타입을 `FormData` 형식으로 전송합니다.

요청 필드:

- `labelType`: `symbol`, `ocr`, `none`
- `clothingImage`: 의류 이미지
- `labelImage`: 세탁 라벨 이미지

서버 주소가 변경되면 `API_BASE_URL` 값을 수정하면 됩니다.

## 개발 참고

- 공통 하단 네비게이션은 `src/app/components/BottomNav.tsx`에서 관리합니다.
- 세탁 기호 UI는 `src/app/components/LaundrySymbols.tsx`에 정리되어 있습니다.
- 분석 결과 화면의 세탁 요약 생성 로직은 `src/app/screens/ResultScreen.tsx`에 있습니다.
- 기록 저장/조회 로직은 `src/app/screens/HistoryScreen.tsx`에서 관리합니다.
- 이미지 처리 유틸은 `src/app/utils/imageUtils.ts`에 있습니다.
