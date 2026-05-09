import { Loader2, CheckCircle2, Shirt, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { analyzeClothing } from '../services/analysisService';

export function LoadingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const state = (location.state ?? {}) as {
    hasLabel?: boolean;
    clothingPreview?: string | null;
    labelType?: 'symbol' | 'ocr' | null;
  };

  const hasLabel        = !!state.hasLabel;
  const clothingPreview = state.clothingPreview ?? null;

  // 모드별 단계 & 텍스트
  const clothingOnlySteps = [
    { label: '의류 종류 파악 중', delay: 1000 },
    { label: '소재 & 색상 분석 중', delay: 2000 },
    { label: '세탁 방법 정리 중', delay: 3000 },
  ];

  const labelSteps = [
    { label: '라벨 인식 중', delay: 1000 },
    { label: '의류 종류 분석 중', delay: 2000 },
    { label: '세탁 방법 정리 중', delay: 3000 },
  ];

  const steps = hasLabel ? labelSteps : clothingOnlySteps;

  const mainTitle    = hasLabel ? '세탁 정보를 분석하고 있어요' : '의류를 분석하고 있어요';
  const subTitle     = hasLabel
    ? '라벨과 의류 특징을 함께 확인 중입니다'
    : '의류를 꼼꼼히 살펴보고 있어요';
  const bottomInfo   = hasLabel
    ? '잠시만 기다려주세요. 초보자도 쉽게 이해할 수 있게 정리해드릴게요.'
    : '라벨이 없어도 괜찮아요. AI가 의류 사진만으로 세탁 방법을 알려드릴게요.';

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1000);
    const timer2 = setTimeout(() => setCurrentStep(2), 2000);
    const timer3 = setTimeout(() => setCurrentStep(3), 3000);

    // ── 분석 API 호출 + UI 최소 대기 시간(3.5s) 중 늦은 쪽에 맞춰 이동 ──
    const uiDelay    = new Promise<void>(r => setTimeout(r, 3500));
    const apiCall    = analyzeClothing({
      labelType:      state.labelType ?? null,
      clothingImage:  state.clothingPreview ?? null,
    });

    Promise.all([uiDelay, apiCall]).then(([, result]) => {
      navigate('/result', {
        state: {
          ...(location.state ?? {}),
          fromAnalysis:   true,
          topCandidates:  result.topCandidates,
          symbols:        result.symbols,
          ocrResult:      result.ocrResult,
          modelSummary:   result.modelSummary,   // 모델 생성 문장 (없으면 undefined)
        },
      });
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [navigate, location]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #d8f1fb 0%, #c6eef8 35%, #caf4e8 70%, #b8eedd 100%)' }}
    >
      {/* ── Floating bubbles ── */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(135,206,235,0.38) 0%, rgba(135,206,235,0.06) 70%)',
        filter: 'blur(28px)', animation: 'bubbleFloat1 7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '80px', left: '-50px',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(152,216,200,0.42) 0%, rgba(152,216,200,0.06) 70%)',
        filter: 'blur(32px)', animation: 'bubbleFloat2 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '42%', left: '55%',
        width: '130px', height: '130px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(176,230,248,0.35) 0%, rgba(176,230,248,0.04) 70%)',
        filter: 'blur(20px)', animation: 'bubbleFloat3 11s ease-in-out infinite',
      }} />

      {/* ── 의류 사진 미리보기 (의류 전용 모드) ── */}
      {!hasLabel && (
        <div className="mb-7 relative z-10" style={{ animation: 'fadeInUp 0.5s ease' }}>
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              width: '120px',
              height: '120px',
              boxShadow: '0 8px 32px rgba(135,206,235,0.35)',
              border: '3px solid rgba(255,255,255,0.8)',
            }}
          >
            <img
              src={clothingPreview ?? clothingDefaultImg}
              alt="분석 중인 의류"
              className="w-full h-full object-cover"
            />
            {/* 스캔 오버레이 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(135,206,235,0.15) 50%, transparent 100%)',
                animation: 'scanLine 2s ease-in-out infinite',
              }}
            />
            {/* 코너 스캔 마커 */}
            <div className="absolute top-2 left-2 w-4 h-4" style={{ borderTop: '2px solid #87CEEB', borderLeft: '2px solid #87CEEB', borderRadius: '2px' }} />
            <div className="absolute top-2 right-2 w-4 h-4" style={{ borderTop: '2px solid #87CEEB', borderRight: '2px solid #87CEEB', borderRadius: '2px' }} />
            <div className="absolute bottom-2 left-2 w-4 h-4" style={{ borderBottom: '2px solid #87CEEB', borderLeft: '2px solid #87CEEB', borderRadius: '2px' }} />
            <div className="absolute bottom-2 right-2 w-4 h-4" style={{ borderBottom: '2px solid #87CEEB', borderRight: '2px solid #87CEEB', borderRadius: '2px' }} />
          </div>
          {/* AI 분석 뱃지 */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full flex items-center gap-1.5"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(135,206,235,0.4)',
              boxShadow: '0 2px 8px rgba(135,206,235,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            <Shirt size={12} color="#87CEEB" strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1a5f7a' }}>AI 분석 중</span>
          </div>
        </div>
      )}

      {/* ── 라벨 포함 모드: 기존 스피너 아이콘 ── */}
      {hasLabel && (
        <div className="mb-8 relative z-10">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(135,206,235,0.25)',
              }}
            >
              <ScanLine size={44} className="stroke-[#87CEEB]" strokeWidth={1.8} style={{ animation: 'scanIconPulse 2s ease-in-out infinite' }} />
            </div>
            <div
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full"
              style={{ background: 'rgba(152,216,200,0.7)', animation: 'pulse 2s ease-in-out infinite' }}
            />
            <div
              className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full"
              style={{ background: 'rgba(135,206,235,0.6)', animation: 'pulse 2s ease-in-out infinite 0.4s' }}
            />
          </div>
        </div>
      )}

      {/* ── 스피너 (의류 전용 하단) ── */}
      {!hasLabel && (
        <div className="mb-5 relative z-10">
          <Loader2 size={30} className="stroke-[#87CEEB] animate-spin" strokeWidth={2} />
        </div>
      )}

      {/* ── Main Text ── */}
      <h2
        className="text-[#1a2332] text-center mb-2 relative z-10"
        style={{ fontSize: '22px', fontWeight: 700 }}
      >
        {mainTitle}
      </h2>
      <p
        className="text-[#3f6070] text-center mb-10 relative z-10"
        style={{ fontSize: '14px', fontWeight: 400 }}
      >
        {subTitle}
      </p>

      {/* ── Progress Steps ── */}
      <div className="w-full max-w-xs mb-10 relative z-10">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  currentStep > index
                    ? 'bg-[#87CEEB]'
                    : currentStep === index
                    ? 'border-2 border-[#87CEEB]'
                    : 'border-2 border-[rgba(135,206,235,0.4)]'
                }`}
                style={{
                  background:
                    currentStep > index
                      ? '#87CEEB'
                      : currentStep === index
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.3)',
                }}
              >
                {currentStep > index && (
                  <CheckCircle2 size={16} className="stroke-white" strokeWidth={3} />
                )}
              </div>
              <span
                className={currentStep >= index ? 'text-[#1a2332]' : 'text-[#7aacbb]'}
                style={{ fontSize: '15px', fontWeight: currentStep >= index ? 600 : 400 }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Info Card ── */}
      <div
        className="rounded-2xl p-5 max-w-xs w-full relative z-10"
        style={{
          background: 'rgba(255,255,255,0.48)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 20px rgba(135,206,235,0.15)',
        }}
      >
        <p
          className="text-[#3a5a6a] text-center"
          style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.6' }}
        >
          {bottomInfo}
        </p>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes bubbleFloat1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(-18px, 14px) scale(1.06); }
          66%       { transform: translate(10px, -10px) scale(0.96); }
        }
        @keyframes bubbleFloat2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(14px, -18px) scale(1.08); }
          70%       { transform: translate(-8px, 10px) scale(0.94); }
        }
        @keyframes bubbleFloat3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50%       { transform: translate(-12px, -14px) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.88); }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes scanIconPulse {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50%       { opacity: 0.6; transform: scaleY(0.9); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}