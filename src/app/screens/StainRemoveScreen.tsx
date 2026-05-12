import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from '../components/BottomNav';

const stains = [
  {
    id: 'coffee',
    emoji: '☕',
    name: '커피 · 차',
    tagline: '즉시 찬물이 핵심!',
    separatorColor: 'rgba(253,186,116,0.38)',
    lightIconBg: '#fff3e8',
    pastelBadgeBg: '#fde8cc',
    pastelBadgeText: '#b45309',
    steps: [
      { icon: '💧', text: '찬물로 즉시 헹구세요. 뜨거운 물은 단백질을 고착시킵니다.' },
      { icon: '🧴', text: '세탁 세제를 얼룩 부위에 직접 바르고 5분간 두세요.' },
      { icon: '👆', text: '부드럽게 문질러 세제를 침투시키세요.' },
      { icon: '🫧', text: '찬물로 충분히 헹군 뒤 일반 세탁하세요.' },
    ],
    warning: '뜨거운 물을 사용하면 착색이 영구적으로 고착될 수 있습니다.',
  },
  {
    id: 'wine',
    emoji: '🍷',
    name: '와인 · 과일즙',
    tagline: '탄산수 + 소금 콤보!',
    separatorColor: 'rgba(232,121,249,0.32)',
    lightIconBg: '#fde8fe',
    pastelBadgeBg: '#f5d0fc',
    pastelBadgeText: '#9333a0',
    steps: [
      { icon: '🥤', text: '즉시 탄산수나 찬물을 부어 희석시키세요.' },
      { icon: '🧻', text: '마른 수건으로 눌러 흡수시키세요. 절대 문지르지 마세요!' },
      { icon: '🧂', text: '소금을 뿌려 얼룩을 흡수시킨 후 털어내세요.' },
      { icon: '🧪', text: '산소계 표백제를 희석해 바르고 30분 후 세탁하세요.' },
    ],
    warning: '문지르면 얼룩이 더 넓게 퍼집니다. 반드시 눌러서 흡수시키세요.',
  },
  {
    id: 'blood',
    emoji: '🩸',
    name: '핏자국',
    tagline: '반드시 찬물만 사용!',
    separatorColor: 'rgba(251,113,133,0.32)',
    lightIconBg: '#ffe5e9',
    pastelBadgeBg: '#fecdd3',
    pastelBadgeText: '#be3a4c',
    steps: [
      { icon: '❄️', text: '반드시 찬물만 사용하세요. 따뜻한 물은 절대 금지!' },
      { icon: '🪣', text: '찬물에 담가 핏자국을 충분히 불려주세요.' },
      { icon: '💊', text: '과산화수소수(소독약)를 얼룩에 살짝 바르세요.' },
      { icon: '🧺', text: '헹군 후 효소계 세탁 세제로 세탁하세요.' },
    ],
    warning: '뜨거운 물은 혈액 단백질을 응고시켜 절대 지워지지 않게 만듭니다.',
  },
  {
    id: 'oil',
    emoji: '🍗',
    name: '기름 · 음식기름',
    tagline: '베이킹 소다로 흡수!',
    separatorColor: 'rgba(251,191,36,0.38)',
    lightIconBg: '#fff9e0',
    pastelBadgeBg: '#fef3b0',
    pastelBadgeText: '#a16207',
    steps: [
      { icon: '🧻', text: '종이 타월로 기름을 최대한 눌러 흡수시키세요.' },
      { icon: '🍚', text: '베이킹 소다를 얼룩에 뿌리고 30분간 두세요.' },
      { icon: '🧽', text: '주방 세제(기름 분해용)를 직접 바르고 부드럽게 문지르세요.' },
      { icon: '🫧', text: '찬물로 헹구고 일반 세탁하세요.' },
    ],
    warning: '건조 후에는 기름 얼룩 제거가 매우 어렵습니다. 빠른 처치가 핵심입니다!',
  },
  {
    id: 'ink',
    emoji: '🖊️',
    name: '볼펜 · 잉크',
    tagline: '알코올이 답!',
    separatorColor: 'rgba(96,165,250,0.32)',
    lightIconBg: '#e0f0ff',
    pastelBadgeBg: '#bfdfff',
    pastelBadgeText: '#2563a0',
    steps: [
      { icon: '👕', text: '얼룩 아래에 흰 천이나 수건을 받쳐 두세요.' },
      { icon: '💨', text: '알코올(손 소독제나 이소프로필 알코올)을 얼룩에 뿌리세요.' },
      { icon: '🧻', text: '수건으로 가볍게 눌러 잉크를 흡수시키세요.' },
      { icon: '🧺', text: '헹군 후 세탁 세제로 세탁하세요.' },
    ],
    warning: '수성 잉크와 유성 잉크에 따라 효과가 다를 수 있습니다. 우선 알코올을 시도해보세요.',
  },
  {
    id: 'sweat',
    emoji: '💧',
    name: '땀 · 황변',
    tagline: '식초 + 베이킹 소다!',
    separatorColor: 'rgba(74,222,128,0.35)',
    lightIconBg: '#e8faee',
    pastelBadgeBg: '#c6f4d6',
    pastelBadgeText: '#166534',
    steps: [
      { icon: '🧪', text: '흰 식초와 물을 1:1로 섞어 얼룩에 바르세요.' },
      { icon: '🍚', text: '베이킹 소다를 뿌려 거품이 나면 30분 기다리세요.' },
      { icon: '☀️', text: '과산화수소와 세탁 세제를 섞어 황변 부위에 바르세요.' },
      { icon: '🌤️', text: '햇볕에 말리면 자연 표백 효과가 있습니다.' },
    ],
    warning: '오래된 황변은 완전 제거가 어렵습니다. 입은 후 빠른 세탁이 최선입니다.',
  },
  {
    id: 'grass',
    emoji: '🌿',
    name: '풀 · 흙',
    tagline: '효소 세제로 분해!',
    separatorColor: 'rgba(52,211,153,0.32)',
    lightIconBg: '#ddf8ec',
    pastelBadgeBg: '#bbf0d8',
    pastelBadgeText: '#0f6644',
    steps: [
      { icon: '🪣', text: '마른 얼룩은 솔로 털어낸 뒤 찬물에 담가 불리세요.' },
      { icon: '🧴', text: '효소계 세탁 세제를 얼룩에 직접 바르세요.' },
      { icon: '⏰', text: '30분간 두었다가 부드럽게 문지르세요.' },
      { icon: '🧺', text: '찬물로 헹구고 일반 세탁하세요.' },
    ],
    warning: '풀 얼룩의 클로로필 성분은 햇볕에 말리면 자연 표백 효과가 있습니다.',
  },
  {
    id: 'makeup',
    emoji: '💄',
    name: '화장품 · 립스틱',
    tagline: '클렌징 오일로 녹이기!',
    separatorColor: 'rgba(244,114,182,0.32)',
    lightIconBg: '#fde8f5',
    pastelBadgeBg: '#fbc9e8',
    pastelBadgeText: '#9d2264',
    steps: [
      { icon: '🫧', text: '미셀라 워터나 클렌징 오일을 얼룩에 충분히 바르세요.' },
      { icon: '👆', text: '부드럽게 문질러 화장품 성분을 분해시키세요.' },
      { icon: '🧽', text: '주방 세제를 소량 추가해 거품을 내어 닦으세요.' },
      { icon: '🫧', text: '찬물로 헹구고 일반 세탁하세요.' },
    ],
    warning: '파운데이션, 마스카라 등 제품마다 성분이 다릅니다. 유분기 많은 것은 오일 클렌저가 효과적입니다.',
  },
];

export function StainRemovalScreen() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-5 flex items-center">
        <Link to="/" className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
        </Link>
        <h1
          className="text-[#1a2332] flex-1 text-center mr-8"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          얼룩 제거 가이드
        </h1>
      </div>

      {/* Tip banner */}
      <div
        className="mx-6 mb-5 rounded-2xl px-4 py-3.5 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, #e3f4fb, #d4f1e8)', border: '1px solid #b3e0f0' }}
      >
        <span style={{ fontSize: '20px' }}>⚡</span>
        <p className="text-[#1a5f7a]" style={{ fontSize: '13px', fontWeight: 500, lineHeight: '1.6' }}>
          <strong>황금 법칙:</strong> 대부분의 얼룩은 <strong>즉시 처리</strong>할수록 제거가 쉽습니다. 방치하지 마세요!
        </p>
      </div>

      {/* Stain cards */}
      <div className="px-6 space-y-3">
        {stains.map((stain) => {
          const isOpen = openId === stain.id;
          return (
            <div
              key={stain.id}
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid #e5e9ef',
                boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              {/* Card header — always white */}
              <button
                className="w-full text-left"
                onClick={() => toggle(stain.id)}
              >
                <div
                  className="flex items-center gap-4 p-4"
                  style={{ background: 'white' }}
                >
                  <div
                    className="rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{
                      width: '52px',
                      height: '52px',
                      background: stain.lightIconBg,
                      transition: 'background 0.25s ease',
                    }}
                  >
                    {stain.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1a2332]" style={{ fontSize: '16px', fontWeight: 700 }}>
                      {stain.name}
                    </p>
                    <p className="text-[#5a6a7d]" style={{ fontSize: '12px', fontWeight: 500 }}>
                      {stain.tagline}
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: stain.lightIconBg,
                      transition: 'background 0.25s ease',
                    }}
                  >
                    {isOpen
                      ? <ChevronUp size={16} color="#4b5563" strokeWidth={2.5} />
                      : <ChevronDown size={16} color="#6b7688" strokeWidth={2.5} />
                    }
                  </div>
                </div>
              </button>

              {/* Expanded content with fade separator */}
              {isOpen && (
                <div className="bg-white">
                  {/* Soft separator */}
                  <div
                    style={{
                      height: '1px',
                      background: `linear-gradient(90deg, transparent 0%, ${stain.separatorColor} 20%, ${stain.separatorColor} 80%, transparent 100%)`,
                    }}
                  />
                  <div className="px-5 pt-4 pb-5">
                    {/* Steps */}
                    <div className="space-y-3 mb-4">
                      {stain.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          {/* Pastel step number badge */}
                          <div
                            className="rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              width: '26px',
                              height: '26px',
                              background: stain.pastelBadgeBg,
                              color: stain.pastelBadgeText,
                              fontSize: '12px',
                              fontWeight: 800,
                              marginTop: '1px',
                            }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex items-start gap-2 flex-1">
                            <span style={{ fontSize: '16px' }}>{step.icon}</span>
                            <p className="text-[#374151]" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                              {step.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
                    <div
                      className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                      style={{ background: '#fff8f1', border: '1px solid #fed7aa' }}
                    >
                      <AlertTriangle size={15} color="#f97316" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                      <p className="text-[#9a3412]" style={{ fontSize: '12px', fontWeight: 500, lineHeight: '1.6' }}>
                        {stain.warning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
