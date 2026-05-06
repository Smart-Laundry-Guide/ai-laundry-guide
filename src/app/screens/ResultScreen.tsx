import { ArrowLeft, Droplet, Wind, AlertTriangle, Package, CheckCircle2, Shirt, ShieldAlert } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { saveHistoryItem } from './HistoryScreen';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────
interface Candidate {
  cls: string;          // 영어 클래스명 (모델 출력값)
  confidence: number;   // 0~1 사이 신뢰도
}

interface OcrResult {
  care?: string[];
  warning?: string[];
  prohibitions?: string[];
  materials?: string[];
}

interface SymbolResult {
  cls: string;
  confidence: number;
}

// location.state 로 전달되는 API 응답 구조
interface LocationState {
  fromAnalysis?: boolean;
  labelType?: 'symbol' | 'ocr' | null;
  // 의류 분류 모델 결과
  topCandidates?: Candidate[];   // top-2 [{ cls, confidence }, ...]
  lowConfidence?: boolean;       // 신뢰도 70% 미만 여부
  // OCR 결과 (labelType === 'ocr' 일 때)
  ocrResult?: OcrResult;
  // YOLO 기호 탐지 결과 (labelType === 'symbol' 일 때)
  symbols?: SymbolResult[];
}

// ─── 영어 클래스 → 한국어 표시명 ─────────────────────────────────────────────
const CLASS_KR: Record<string, string> = {
  T_shirt:    '티셔츠',
  denim:      '데님',
  knit:       '니트',
  pants:      '바지',
  shirt:      '셔츠',
  dress:      '원피스',
  skirt:      '치마',
  blouse:     '블라우스',
  jacket:     '자켓',
};

// ─── 위험군 ────────────────────────────────────────────────────────────────────
const RISK_LEVEL: Record<string, { label: string; color: string; bg: string }> = {
  T_shirt:  { label: '중위험군', color: '#d97706', bg: '#fef3c7' },
  shirt:    { label: '중위험군', color: '#d97706', bg: '#fef3c7' },
  dress:    { label: '중위험군', color: '#d97706', bg: '#fef3c7' },
  skirt:    { label: '중위험군', color: '#d97706', bg: '#fef3c7' },
  knit:     { label: '고위험군', color: '#dc2626', bg: '#fee2e2' },
  blouse:   { label: '고위험군', color: '#dc2626', bg: '#fee2e2' },
  jacket:   { label: '고위험군', color: '#dc2626', bg: '#fee2e2' },
  denim:    { label: '저위험군', color: '#16a34a', bg: '#dcfce7' },
  pants:    { label: '저위험군', color: '#16a34a', bg: '#dcfce7' },
};

// ─── 클래스별 세탁 가이드 (영어 키) ──────────────────────────────────────────
interface ClothingData {
  summary: string;
  summaryDetail: string;
  washMethod: string;
  washMode: string;
  dryMethod: string;
  caution: string;
  tags: { text: string; style: string }[];
  risk: string;
  actions: string[];
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
}

const clothingData: Record<string, ClothingData> = {
  knit: {
    summary: '니트류로 추정되며 건조기 사용은 피하는 것이 좋습니다.',
    summaryDetail: '수축 및 변형 위험이 있어 약한 세탁을 권장합니다.',
    washMethod: '찬물 또는 미지근한 물 (30°C 이하)',
    washMode: '울 코스 / 약한 세탁',
    dryMethod: '자연건조 (평평하게 펼쳐서)',
    caution: '건조기 금지, 강한 탈수 주의',
    tags: [
      { text: '건조기 금지', style: 'bg-[#fee2e2] text-[#dc2626]' },
      { text: '저온 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '수축 위험, 형태 변형 가능성',
    actions: ['세탁망 사용', '단독 세탁 권장', '평평하게 건조 권장'],
    gradientFrom: '#e3f4fb', gradientTo: '#c8e9f8', iconColor: '#87CEEB',
  },
  T_shirt: {
    summary: '면 소재 티셔츠로 추정되며 표준 세탁이 가능합니다.',
    summaryDetail: '세탁기 일반 코스로 세탁하며 고온 건조는 피하세요.',
    washMethod: '미지근한 물 (30~40°C)',
    washMode: '표준 코스',
    dryMethod: '자연건조 또는 저온 건조기',
    caution: '인쇄 면 고온 다림질 금지',
    tags: [
      { text: '일반 세탁 가능', style: 'bg-[#dcfce7] text-[#16a34a]' },
      { text: '중온 다림질', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '고온 건조 시 수축 가능',
    actions: ['뒤집어 세탁 권장', '그늘 자연건조', '중온 다림질 가능'],
    gradientFrom: '#d4f1e8', gradientTo: '#b8e8d4', iconColor: '#98D8C8',
  },
  shirt: {
    summary: '면 또는 혼방 셔츠로 추정됩니다.',
    summaryDetail: '세탁기 일반 코스 또는 손세탁이 가능합니다.',
    washMethod: '미지근한 물 (40°C 이하)',
    washMode: '일반 코스',
    dryMethod: '걸어서 자연건조',
    caution: '구김 방지를 위해 세탁 후 바로 꺼내기',
    tags: [
      { text: '표준 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
      { text: '중온 다림질 가능', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '과도한 열처리 시 형태 변형',
    actions: ['뒤집어 세탁 권장', '걸어서 자연건조', '중온 다림질 가능'],
    gradientFrom: '#f0f9ff', gradientTo: '#e0f2fe', iconColor: '#7dd3fc',
  },
  pants: {
    summary: '일반 바지 소재로 추정됩니다.',
    summaryDetail: '소재에 따라 세탁 방법이 다를 수 있으니 라벨을 확인하세요.',
    washMethod: '미지근한 물',
    washMode: '일반 또는 울 코스',
    dryMethod: '자연건조 (접지 않고 걸기)',
    caution: '구김 최소화를 위해 세탁 후 빠르게 꺼내기',
    tags: [
      { text: '표준 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
      { text: '다림질 가능', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '소재에 따라 수축 가능',
    actions: ['뒤집어 세탁 권장', '자연건조', '필요 시 스팀 다림질'],
    gradientFrom: '#f5f3ff', gradientTo: '#ede9fe', iconColor: '#a78bfa',
  },
  denim: {
    summary: '데님 소재로 추정됩니다.',
    summaryDetail: '처음 세탁 시 색이 빠질 수 있으니 반드시 단독 세탁하세요.',
    washMethod: '찬물 (30°C 이하)',
    washMode: '섬세 / 데님 코스',
    dryMethod: '그늘 자연건조',
    caution: '이염 방지를 위해 반드시 단독 세탁',
    tags: [
      { text: '단독 세탁 필수', style: 'bg-[#fef3c7] text-[#d97706]' },
      { text: '색상 이염 주의', style: 'bg-[#fef3c7] text-[#d97706]' },
    ],
    risk: '초기 이염, 퇴색 가능성',
    actions: ['뒤집어 세탁 필수', '찬물 단독 세탁', '그늘 자연건조'],
    gradientFrom: '#eff6ff', gradientTo: '#dbeafe', iconColor: '#60a5fa',
  },
  dress: {
    summary: '원피스로 추정됩니다.',
    summaryDetail: '소재에 따라 세탁 방법이 다르므로 라벨을 함께 확인하세요.',
    washMethod: '미지근한 물 (30°C 이하)',
    washMode: '섬세 코스 또는 손세탁',
    dryMethod: '그늘 자연건조 (걸어서)',
    caution: '비틀어 짜지 말고 눌러 탈수',
    tags: [
      { text: '섬세 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
      { text: '저온 건조', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '소재에 따라 수축·변형 가능',
    actions: ['단독 세탁 권장', '섬세 코스 사용', '그늘 자연건조'],
    gradientFrom: '#fdf2f8', gradientTo: '#fce7f3', iconColor: '#f472b6',
  },
  skirt: {
    summary: '치마로 추정됩니다.',
    summaryDetail: '소재에 따라 취급 방법이 다를 수 있습니다.',
    washMethod: '미지근한 물 (30°C 이하)',
    washMode: '섬세 코스',
    dryMethod: '자연건조 (걸어서)',
    caution: '비틀어 짜지 않기',
    tags: [
      { text: '섬세 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '소재에 따라 수축 가능',
    actions: ['세탁망 사용 권장', '자연건조', '다림질 시 저온'],
    gradientFrom: '#fff7ed', gradientTo: '#ffedd5', iconColor: '#fb923c',
  },
  blouse: {
    summary: '블라우스로 추정되며 손세탁 또는 드라이클리닝을 권장합니다.',
    summaryDetail: '섬세한 소재일 가능성이 높아 약한 세탁이 필요합니다.',
    washMethod: '찬물 (30°C 이하)',
    washMode: '손세탁 또는 울 코스',
    dryMethod: '그늘 자연건조 (걸어서)',
    caution: '세게 비비거나 탈수 금지',
    tags: [
      { text: '손세탁 권장', style: 'bg-[#fee2e2] text-[#dc2626]' },
      { text: '저온 세탁', style: 'bg-[#dbeafe] text-[#2563eb]' },
    ],
    risk: '소재 손상, 변형 가능성',
    actions: ['세탁망 사용', '중성세제 사용', '그늘 자연건조'],
    gradientFrom: '#f0fdf4', gradientTo: '#dcfce7', iconColor: '#4ade80',
  },
  jacket: {
    summary: '자켓/아우터로 추정되며 드라이클리닝을 권장합니다.',
    summaryDetail: '세탁 전 반드시 내부 라벨을 확인하세요.',
    washMethod: '찬물 (30°C 이하) 또는 드라이클리닝',
    washMode: '드라이클리닝 권장',
    dryMethod: '자연건조 (걸어서)',
    caution: '임의 세탁 시 변형·수축 위험',
    tags: [
      { text: '드라이클리닝', style: 'bg-[#fee2e2] text-[#dc2626]' },
      { text: '라벨 필수 확인', style: 'bg-[#fef3c7] text-[#d97706]' },
    ],
    risk: '세탁 방법 오선택 시 손상',
    actions: ['라벨 먼저 확인', '드라이클리닝 우선', '부득이한 경우 손세탁'],
    gradientFrom: '#f8fafc', gradientTo: '#f1f5f9', iconColor: '#94a3b8',
  },
};

// ─── YOLO 기호 → 한국어 설명 ──────────────────────────────────────────────────
const SYMBOL_KR: Record<string, string> = {
  machine_wash:    '세탁기 세탁 가능',
  hand_wash:       '손세탁 권장',
  no_wash:         '세탁 금지',
  bleach:          '염소계 표백 가능',
  no_bleach:       '표백 금지',
  tumble_dry:      '건조기 사용 가능',
  no_tumble_dry:   '건조기 사용 금지',
  natural_dry:     '자연건조',
  iron:            '다림질 가능',
  no_iron:         '다림질 금지',
  dry_clean:       '드라이클리닝',
  no_dry_clean:    '드라이클리닝 금지',
  squeeze:         '탈수 가능',
  no_squeeze:      '탈수 금지',
  flame_warning:   '화기 주의',
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function ResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const state: LocationState = location.state ?? {};

  const fromAnalysis = state.fromAnalysis ?? false;
  const labelType    = state.labelType ?? null;
  const lowConf      = state.lowConfidence ?? false;

  // top-2 후보 (없으면 목업 데이터)
  const topCandidates: Candidate[] = state.topCandidates ?? [
    { cls: 'knit',    confidence: 0.87 },
    { cls: 'T_shirt', confidence: 0.74 },
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);

  const currentCls  = topCandidates[selectedIdx]?.cls ?? 'knit';
  const current     = clothingData[currentCls] ?? clothingData['knit'];
  const riskInfo    = RISK_LEVEL[currentCls] ?? RISK_LEVEL['knit'];
  const displayName = CLASS_KR[currentCls] ?? currentCls;
  const conf        = Math.round((topCandidates[selectedIdx]?.confidence ?? 0) * 100);

  // OCR 결과
  const ocr = state.ocrResult;
  // YOLO 기호 결과
  const symbols = state.symbols ?? [];

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-5 flex items-center">
        <button onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
        </button>
        <h1
          className="text-[#1a2332] flex-1 text-center mr-8"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          맞춤 세탁 가이드
        </h1>
      </div>

      <div className="px-6 pt-5 pb-10 space-y-4">

        {/* ── 신뢰도 낮음 경고 배너 ── */}
        {lowConf && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: '#fef3c7', border: '1px solid #fde68a' }}
          >
            <ShieldAlert size={18} strokeWidth={2} color="#d97706" className="flex-shrink-0" />
            <p style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              신뢰도가 낮아 정확하지 않을 수 있습니다. 라벨을 직접 확인하거나 다른 각도로 다시 촬영해 주세요.
            </p>
          </div>
        )}

        {/* ── 분석된 의류 카드 ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-[#8896a8] mb-3" style={{ fontSize: '12px', fontWeight: 600 }}>
            분석에 사용된 의류
          </p>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${current.gradientFrom}, ${current.gradientTo})` }}
            >
              <Shirt size={36} color={current.iconColor} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[#1a2332]" style={{ fontSize: '20px', fontWeight: 700 }}>
                  {displayName}
                </p>
                {/* 위험군 뱃지 */}
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: riskInfo.bg,
                    color: riskInfo.color,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {riskInfo.label}
                </span>
              </div>
              {labelType ? (
                <span
                  className="inline-block mt-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '11px', fontWeight: 600 }}
                >
                  {labelType === 'symbol' ? '🏷 라벨 기호 포함 분석' : '📝 주의 문구 포함 분석'}
                </span>
              ) : (
                <span
                  className="inline-block mt-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: '#f0f4f8', color: '#8896a8', fontSize: '11px', fontWeight: 600 }}
                >
                  의류 사진만으로 분석
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Top-2 의류 후보 (의류만 입력 시) ── */}
        {!labelType && topCandidates.length >= 2 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#1a2332]" style={{ fontSize: '16px', fontWeight: 700 }}>
                Top-2 의류 후보
              </h2>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#87CEEB' }}>
                선택 시 즉시 반영
              </span>
            </div>
            <div className="flex gap-3">
              {topCandidates.slice(0, 2).map((c, idx) => {
                const cData = clothingData[c.cls] ?? clothingData['knit'];
                const cConf = Math.round(c.confidence * 100);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className="flex-1 rounded-2xl p-4 border-2 transition-all"
                    style={{
                      borderColor: selectedIdx === idx ? '#87CEEB' : '#e5e9ef',
                      background:  selectedIdx === idx ? '#f0f9ff' : 'white',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ background: `linear-gradient(135deg, ${cData.gradientFrom}, ${cData.gradientTo})` }}
                    >
                      <Shirt size={22} color={cData.iconColor} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332', textAlign: 'center' }}>
                      {CLASS_KR[c.cls] ?? c.cls}
                    </p>
                    <p style={{ fontSize: '11px', color: '#87CEEB', fontWeight: 600, textAlign: 'center', marginTop: '2px' }}>
                      신뢰도 {cConf}%
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7688', textAlign: 'center', marginTop: '2px' }}>
                      {RISK_LEVEL[c.cls]?.label ?? ''}
                    </p>
                    {selectedIdx === idx && (
                      <div className="mt-2 mx-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#87CEEB' }}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Summary Card ── */}
        <div
          className="rounded-3xl p-6"
          style={{ background: 'linear-gradient(135deg, #e3f4fb, #d4f1e8)', boxShadow: '0 4px 16px rgba(135, 206, 235, 0.2)' }}
        >
          <p className="text-[#1a2332] mb-2" style={{ fontSize: '17px', fontWeight: 600, lineHeight: '1.5' }}>
            {current.summary}
          </p>
          <p className="text-[#3f4f63]" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {current.summaryDetail}
          </p>
        </div>

        {/* ── YOLO 기호 탐지 결과 (symbol 모드) ── */}
        {labelType === 'symbol' && symbols.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-[#1a2332] mb-4" style={{ fontSize: '17px', fontWeight: 600 }}>
              감지된 세탁 기호
            </h2>
            <div className="flex flex-wrap gap-2">
              {symbols.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full"
                  style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '13px', fontWeight: 500 }}
                >
                  {SYMBOL_KR[s.cls] ?? s.cls}
                  <span style={{ color: '#87CEEB', marginLeft: '6px', fontSize: '12px' }}>
                    {Math.round(s.confidence * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── OCR 결과 (ocr 모드) ── */}
        {labelType === 'ocr' && ocr && (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-[#1a2332] mb-4" style={{ fontSize: '17px', fontWeight: 600 }}>
              라벨 텍스트 인식 결과
            </h2>
            <div className="space-y-3">
              {ocr.care && ocr.care.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896a8', marginBottom: '6px' }}>세탁 방법</p>
                  <div className="flex flex-wrap gap-2">
                    {ocr.care.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '12px', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.prohibitions && ocr.prohibitions.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896a8', marginBottom: '6px' }}>금지 사항</p>
                  <div className="flex flex-wrap gap-2">
                    {ocr.prohibitions.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.warning && ocr.warning.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896a8', marginBottom: '6px' }}>주의 문구</p>
                  <div className="flex flex-wrap gap-2">
                    {ocr.warning.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full" style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.materials && ocr.materials.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896a8', marginBottom: '6px' }}>소재</p>
                  <div className="flex flex-wrap gap-2">
                    {ocr.materials.map((t, i) => (
                      <span key={i} className="px-3 py-1 rounded-full" style={{ background: '#f3f4f6', color: '#374151', fontSize: '12px', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 세탁방법 안내 ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-[#1a2332] mb-5" style={{ fontSize: '17px', fontWeight: 600 }}>
            세탁방법 안내
          </h2>
          <div className="space-y-4">
            {[
              { icon: <Droplet size={20} className="stroke-[#87CEEB]" strokeWidth={2} />,    bg: '#e3f4fb', label: '세탁 방식', value: current.washMethod },
              { icon: <Package size={20} className="stroke-[#87CEEB]" strokeWidth={2} />,   bg: '#e3f4fb', label: '권장 모드', value: current.washMode },
              { icon: <Wind size={20} className="stroke-[#98D8C8]" strokeWidth={2} />,      bg: '#d4f1e8', label: '건조 방법', value: current.dryMethod },
              { icon: <AlertTriangle size={20} className="stroke-[#ef4444]" strokeWidth={2} />, bg: '#fee2e2', label: '주의 사항', value: current.caution },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: row.bg }}>
                  {row.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[#1a2332] mb-0.5" style={{ fontSize: '15px', fontWeight: 600 }}>{row.label}</p>
                  <p className="text-[#6b7688]" style={{ fontSize: '14px' }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI 분석 결과 ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-[#1a2332] mb-5" style={{ fontSize: '17px', fontWeight: 600 }}>
            AI 분석 결과
          </h2>
          <div className="space-y-0">
            {[
              {
                label: '의류 종류',
                content: (
                  <span className="text-[#1a2332]" style={{ fontSize: '14px' }}>
                    {displayName} ({conf}%)
                  </span>
                ),
              },
              {
                label: '위험 등급',
                content: (
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{ background: riskInfo.bg, color: riskInfo.color, fontSize: '12px', fontWeight: 700 }}
                  >
                    {riskInfo.label}
                  </span>
                ),
              },
              {
                label: '라벨 인식',
                content: (
                  <div className="flex flex-wrap gap-2">
                    {current.tags.map((tag, ti) => (
                      <span key={ti} className={`px-3 py-1 rounded-full ${tag.style}`} style={{ fontSize: '12px', fontWeight: 500 }}>
                        {tag.text}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                label: '위험 요소',
                content: (
                  <span className="text-[#1a2332]" style={{ fontSize: '14px' }}>
                    {current.risk}
                  </span>
                ),
              },
              {
                label: '판단 근거',
                content: (
                  <span className="text-[#1a2332]" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {labelType === 'symbol'
                      ? `의류 분류 모델 + YOLO 기호 탐지 기반 (신뢰도 ${conf}%)`
                      : labelType === 'ocr'
                      ? `의류 분류 모델 + OCR 텍스트 인식 기반 (신뢰도 ${conf}%)`
                      : `의류 분류 모델 기반 (신뢰도 ${conf}%)`}
                  </span>
                ),
              },
            ].map((row, i, arr) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #f0f4f8' : 'none' }}
              >
                <span className="text-[#8896a8] flex-shrink-0" style={{ fontSize: '14px', fontWeight: 500, width: '72px' }}>
                  {row.label}
                </span>
                <div className="flex-1">{row.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 추천 행동 ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-[#1a2332] mb-4" style={{ fontSize: '17px', fontWeight: 600 }}>
            추천 행동
          </h2>
          <div className="space-y-3">
            {current.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={20} className="stroke-[#10b981] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-[#1a2332]" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                  {action}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 하단 버튼 ── */}
        {fromAnalysis && (
          <div className="flex gap-3 pt-1">
            <Link
              to="/camera"
              className="flex-1 bg-gray-100 text-[#1a2332] rounded-2xl px-6 py-4 text-center hover:bg-gray-200 transition-colors"
              style={{ fontSize: '16px', fontWeight: 600 }}
            >
              다시 촬영
            </Link>
            <button
              onClick={() => {
                saveHistoryItem({
                  typeEn:    currentCls,
                  typeKr:    displayName,
                  riskLabel: riskInfo.label,
                  summary:   current.washMethod + ' / ' + current.dryMethod,
                  tags:      current.tags.map(t => t.text),
                  tagColors: current.tags.map(t => t.style),
                });
                navigate('/history');
              }}
              className="flex-1 bg-[#87CEEB] text-white rounded-2xl px-6 py-4 text-center"
              style={{ fontSize: '16px', fontWeight: 600 }}
            >
              결과 저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}