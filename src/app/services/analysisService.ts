// ─────────────────────────────────────────────────────────────────────────────
// analysisService.ts
//
// 🔌 실제 모델 연동 방법:
//   1. 하단 API_BASE_URL 에 서버 주소를 입력하세요.
//   2. analyzeClothing() 함수 내 "── 실제 API 호출 ──" 블록의 주석을 해제하세요.
//   3. 목(mock) 응답 반환 블록을 제거하세요.
//
// 📌 모델이 반환해야 하는 JSON 구조: AnalysisApiResponse 타입을 참고하세요.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. API 엔드포인트 설정 ────────────────────────────────────────────────────
// TODO: 실제 서버 주소로 교체하세요
const API_BASE_URL = 'https://your-api-server.example.com';

// ── 2. 요청 타입 ──────────────────────────────────────────────────────────────
export interface AnalysisRequest {
  labelType: 'symbol' | 'ocr' | null;
  /** 의류 이미지 (File 객체 or base64 문자열) */
  clothingImage?: File | string | null;
  /** 라벨 이미지 (File 객체 or base64 문자열) — labelType이 있을 때만 전송 */
  labelImage?: File | string | null;
}

// ── 3. 서버가 반환하는 JSON 구조 (모델 연동 시 이 형식에 맞춰주세요) ───────────
export interface AnalysisApiResponse {
  /** 의류 분류 후보 목록 (신뢰도 내림차순) */
  topCandidates: { cls: string; confidence: number }[];

  /**
   * [기호 모드] YOLO로 탐지된 세탁 기호 목록
   * cls 값: 'machine_wash' | 'hand_wash' | 'no_wash' |
   *          'bleach' | 'no_bleach' |
   *          'tumble_dry' | 'no_tumble_dry' |
   *          'natural_dry' | 'iron' | 'no_iron' |
   *          'dry_clean' | 'no_dry_clean' |
   *          'squeeze' | 'no_squeeze'
   */
  symbols?: { cls: string; confidence: number }[];

  /** [OCR 모드] 라벨 텍스트 인식 결과 */
  ocrResult?: {
    care?: string[];
    warning?: string[];
    prohibitions?: string[];
    materials?: string[];
  };

  /**
   * 모델이 직접 생성한 한국어 분석 문장.
   * 이 값이 있으면 ResultScreen의 "AI 분석 정보" 섹션에 그대로 표시됩니다.
   * 없으면 앱 내부 규칙 기반(buildSymbolSummary 등)으로 자동 생성됩니다.
   */
  modelSummary?: string;
}

// ── 4. 목(Mock) 데이터 — 연동 전까지 사용 ────────────────────────────────────
const MOCK_SYMBOL: AnalysisApiResponse = {
  topCandidates: [
    { cls: 'knit',    confidence: 0.87 },
    { cls: 'T_shirt', confidence: 0.74 },
  ],
  symbols: [
    { cls: 'hand_wash',     confidence: 0.95 },
    { cls: 'no_tumble_dry', confidence: 0.92 },
    { cls: 'no_bleach',     confidence: 0.88 },
    { cls: 'iron',          confidence: 0.80 },
  ],
  // TODO: 모델이 요약 문장을 직접 생성하면 아래 필드로 전달하세요.
  // modelSummary: '니트 소재로 확인됩니다. 30°C 이하 찬물에서 손세탁하고 ...',
};

const MOCK_OCR: AnalysisApiResponse = {
  topCandidates: [
    { cls: 'shirt',  confidence: 0.91 },
    { cls: 'blouse', confidence: 0.68 },
  ],
  ocrResult: {
    materials:    ['폴리에스터 65%', '면 35%'],
    care:         ['30°C 이하 세탁기 세탁', '약한 탈수'],
    prohibitions: ['표백제 사용 금지', '건조기 사용 금지'],
    warning:      ['직사광선 건조 금지'],
  },
  // modelSummary: '...',
};

const MOCK_CLOTHING: AnalysisApiResponse = {
  topCandidates: [
    { cls: 'denim',  confidence: 0.83 },
    { cls: 'pants',  confidence: 0.70 },
  ],
  // modelSummary: '...',
};

// ── 5. 메인 호출 함수 ──────────────────────────────────────────────────────────
export async function analyzeClothing(
  req: AnalysisRequest
): Promise<AnalysisApiResponse> {

  // ── 실제 API 호출 (연동 시 아래 블록 주석 해제) ────────────────────────────
  /*
  const formData = new FormData();
  formData.append('labelType', req.labelType ?? 'none');

  if (req.clothingImage instanceof File) {
    formData.append('clothingImage', req.clothingImage);
  } else if (typeof req.clothingImage === 'string') {
    formData.append('clothingImageBase64', req.clothingImage);
  }

  if (req.labelImage instanceof File) {
    formData.append('labelImage', req.labelImage);
  } else if (typeof req.labelImage === 'string') {
    formData.append('labelImageBase64', req.labelImage);
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
    // headers: { 'Authorization': `Bearer YOUR_TOKEN` },  // 인증 필요 시 추가
  });

  if (!response.ok) {
    throw new Error(`분석 서버 오류: ${response.status}`);
  }

  return response.json() as Promise<AnalysisApiResponse>;
  */

  // ── 목(Mock) 응답 반환 — 연동 후 이 블록을 제거하세요 ──────────────────────
  await new Promise(r => setTimeout(r, 200)); // 네트워크 지연 시뮬레이션
  if (req.labelType === 'symbol') return MOCK_SYMBOL;
  if (req.labelType === 'ocr')    return MOCK_OCR;
  return MOCK_CLOTHING;
}
