import { Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

export function LoadingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: '라벨 인식', delay: 1000 },
    { label: '의류 종류 분석', delay: 2000 },
    { label: '세탁 방법 정리', delay: 3000 },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1000);
    const timer2 = setTimeout(() => setCurrentStep(2), 2000);
    const timer3 = setTimeout(() => setCurrentStep(3), 3000);
    const timer4 = setTimeout(() => {
      navigate('/result', {
        state: {
          ...(location.state ?? {}),
          fromAnalysis: true,
        },
      });
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate, location]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #d8f1fb 0%, #c6eef8 35%, #caf4e8 70%, #b8eedd 100%)' }}
    >
      {/* ── Floating bubble elements ── */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(135,206,235,0.38) 0%, rgba(135,206,235,0.06) 70%)',
          filter: 'blur(28px)',
          animation: 'bubbleFloat1 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '-50px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(152,216,200,0.42) 0%, rgba(152,216,200,0.06) 70%)',
          filter: 'blur(32px)',
          animation: 'bubbleFloat2 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '55%',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,230,248,0.35) 0%, rgba(176,230,248,0.04) 70%)',
          filter: 'blur(20px)',
          animation: 'bubbleFloat3 11s ease-in-out infinite',
        }}
      />

      {/* ── Animated Icon ── */}
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
            <Loader2 size={48} className="stroke-[#87CEEB] animate-spin" strokeWidth={2} />
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

      {/* ── Main Text ── */}
      <h2
        className="text-[#1a2332] text-center mb-2 relative z-10"
        style={{ fontSize: '22px', fontWeight: 700 }}
      >
        세탁 정보를 분석하고 있어요
      </h2>
      <p
        className="text-[#3f6070] text-center mb-12 relative z-10"
        style={{ fontSize: '14px', fontWeight: 400 }}
      >
        라벨과 의류 특징을 함께 확인 중입니다
      </p>

      {/* ── Progress Steps ── */}
      <div className="w-full max-w-xs mb-16 relative z-10">
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
          잠시만 기다려주세요. 초보자도 쉽게 이해할 수 있게 정리해드릴게요.
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
      `}</style>
    </div>
  );
}
