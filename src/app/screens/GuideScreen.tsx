import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

type TabType = 'wash' | 'bleach' | 'dry' | 'iron' | 'dryclean';

// Real ISO-style laundry symbol SVGs
function WashSymbol({ type }: { type: string }) {
  const s = "#1a2332"; // stroke color
  const sw = "2.2";    // stroke width

  // Shared tub path (basin shape)
  const tub = `M5,13 H35 V22 Q35,35 20,35 Q5,35 5,22 Z`;

  if (type === 'wash-30') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tub} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <path d="M9,24 Q14,21 20,24 Q26,27 31,24" stroke={s} strokeWidth="1.5" fill="none"/>
      <text x="20" y="20" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={s} fontFamily="system-ui,sans-serif">30°</text>
    </svg>
  );
  if (type === 'wash-cold') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tub} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <path d="M9,25 Q14,22 20,25 Q26,28 31,25" stroke={s} strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="18" r="1.8" fill={s}/>
    </svg>
  );
  if (type === 'wash-hand') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tub} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <path d="M14,30 L14,21 Q14,19.5 15.5,19.5 Q17,19.5 17,21 L17,22.5 Q17.5,21 19,21 Q20.5,21 20.5,22.5 L20.5,23 Q21,21.5 22.5,21.5 Q24,21.5 24,23 L24,30 Q21,32 17,30 Z" stroke={s} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'wash-no') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tub} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <line x1="11" y1="16" x2="29" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="29" y1="16" x2="11" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function BleachSymbol({ type }: { type: string }) {
  const s = "#1a2332";
  const sw = "2.2";
  const tri = "M20,5 L36,34 L4,34 Z";

  if (type === 'bleach-ok') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tri} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
    </svg>
  );
  if (type === 'bleach-nonchlorine') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tri} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <line x1="15" y1="29" x2="18" y2="16" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="20" y1="29" x2="23" y2="16" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'bleach-no') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={tri} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <line x1="12" y1="18" x2="28" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="28" y1="18" x2="12" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function DrySymbol({ type }: { type: string }) {
  const s = "#1a2332";
  const sw = "2.2";
  const sq = <rect x="5" y="5" width="30" height="30" rx="3" stroke={s} strokeWidth={sw} fill="none"/>;

  if (type === 'dry-natural') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {sq}
      <line x1="10" y1="13" x2="30" y2="13" stroke={s} strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="13" x2="14" y2="26" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="13" x2="20" y2="29" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="13" x2="26" y2="26" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === 'dry-low') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {sq}
      <circle cx="20" cy="20" r="10" stroke={s} strokeWidth={sw} fill="none"/>
      <circle cx="20" cy="20" r="2.2" fill={s}/>
    </svg>
  );
  if (type === 'dry-no') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {sq}
      <line x1="11" y1="11" x2="29" y2="29" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="29" y1="11" x2="11" y2="29" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function IronSymbol({ type }: { type: string }) {
  const s = "#1a2332";
  const sw = "2";
  // Iron body: typical flat-iron silhouette
  const ironBody = "M4,27 H33 Q38,27 38,23 L32,13 H13 Q7,13 7,19 L4,27 Z";

  if (type === 'iron-high') return (
    <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={ironBody} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <circle cx="13" cy="33" r="2.2" fill={s}/>
      <circle cx="21" cy="33" r="2.2" fill={s}/>
      <circle cx="29" cy="33" r="2.2" fill={s}/>
    </svg>
  );
  if (type === 'iron-mid') return (
    <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={ironBody} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <circle cx="16" cy="33" r="2.2" fill={s}/>
      <circle cx="26" cy="33" r="2.2" fill={s}/>
    </svg>
  );
  if (type === 'iron-low') return (
    <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={ironBody} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <circle cx="21" cy="33" r="2.2" fill={s}/>
    </svg>
  );
  if (type === 'iron-no') return (
    <svg viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d={ironBody} stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <line x1="9" y1="10" x2="35" y2="31" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="10" x2="9" y2="31" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function DrycleanSymbol({ type }: { type: string }) {
  const s = "#1a2332";
  const sw = "2.2";

  if (type === 'dryclean-ok') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="15" stroke={s} strokeWidth={sw}/>
    </svg>
  );
  if (type === 'dryclean-p') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="15" stroke={s} strokeWidth={sw}/>
      <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill={s} fontFamily="system-ui,sans-serif">P</text>
    </svg>
  );
  if (type === 'dryclean-no') return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="20" cy="20" r="15" stroke={s} strokeWidth={sw}/>
      <line x1="10" y1="10" x2="30" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="30" y1="10" x2="10" y2="30" stroke={s} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  );
  return null;
}

export function GuideScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('wash');

  const tabs = [
    { id: 'wash' as TabType, label: '세탁', emoji: '🧺' },
    { id: 'bleach' as TabType, label: '표백', emoji: '◻️' },
    { id: 'dry' as TabType, label: '건조', emoji: '☀️' },
    { id: 'iron' as TabType, label: '다림질', emoji: '🔲' },
    { id: 'dryclean' as TabType, label: '드라이', emoji: '⭕' },
  ];

  const symbols = {
    wash: [
      {
        symbolId: 'wash-30',
        Component: WashSymbol,
        name: '물세탁 가능 (30°C)',
        description: '세탁기 또는 손세탁으로 물세탁이 가능합니다. 30도 이하 미지근한 물을 사용하세요.',
        tip: '일반 세제로 세탁 가능하며, 울/섬세 코스를 권장합니다.',
      },
      {
        symbolId: 'wash-cold',
        Component: WashSymbol,
        name: '찬물 세탁',
        description: '찬물 (30°C 미만) 로만 세탁해야 합니다.',
        tip: '온수는 색 바램과 수축의 원인이 됩니다.',
      },
      {
        symbolId: 'wash-hand',
        Component: WashSymbol,
        name: '손세탁만 가능',
        description: '세탁기 사용이 불가하며 손세탁만 가능합니다.',
        tip: '부드럽게 눌러 빨고, 비틀거나 탈수기는 사용하지 마세요.',
      },
      {
        symbolId: 'wash-no',
        Component: WashSymbol,
        name: '물세탁 금지',
        description: '물세탁이 불가능하며 드라이클리닝만 가능합니다.',
        tip: '전문 세탁소에 맡기는 것이 안전합니다.',
      },
    ],
    bleach: [
      {
        symbolId: 'bleach-ok',
        Component: BleachSymbol,
        name: '표백 가능',
        description: '염소계와 산소계 표백제 모두 사용 가능합니다.',
        tip: '표백제 사용 전 눈에 띄지 않는 부분에 먼저 테스트해보세요.',
      },
      {
        symbolId: 'bleach-nonchlorine',
        Component: BleachSymbol,
        name: '산소계 표백제만 가능',
        description: '염소계(락스 계열)는 사용 불가하며, 산소계 표백제만 사용할 수 있습니다.',
        tip: '염소계 표백제는 의류를 손상시키거나 탈색시킬 수 있습니다.',
      },
      {
        symbolId: 'bleach-no',
        Component: BleachSymbol,
        name: '표백 금지',
        description: '모든 종류의 표백제 사용이 금지됩니다.',
        tip: '색상이 변하거나 섬유 손상이 발생할 수 있으니 주의하세요.',
      },
    ],
    dry: [
      {
        symbolId: 'dry-natural',
        Component: DrySymbol,
        name: '자연건조 (걸어서 건조)',
        description: '평평하게 펴거나 옷걸이에 걸어 그늘에서 자연 건조하세요.',
        tip: '직사광선은 변색의 원인이 될 수 있습니다. 통풍이 잘 되는 그늘이 적합합니다.',
      },
      {
        symbolId: 'dry-low',
        Component: DrySymbol,
        name: '건조기 저온 사용 가능',
        description: '건조기를 저온 설정으로 사용할 수 있습니다.',
        tip: '과도한 건조는 수축의 원인이 됩니다. 살짝 덜 건조된 상태에서 꺼내세요.',
      },
      {
        symbolId: 'dry-no',
        Component: DrySymbol,
        name: '건조기 사용 금지',
        description: '건조기를 사용하면 옷이 줄어들거나 변형될 수 있습니다.',
        tip: '니트, 프린팅 의류, 열에 약한 소재는 특히 주의하세요.',
      },
    ],
    iron: [
      {
        symbolId: 'iron-high',
        Component: IronSymbol,
        name: '고온 다림질 (200°C까지)',
        description: '최대 200도까지 다림질이 가능합니다.',
        tip: '면(코튼), 린넨 소재에 적합합니다.',
      },
      {
        symbolId: 'iron-mid',
        Component: IronSymbol,
        name: '중온 다림질 (150°C 이하)',
        description: '150도 이하로 다림질하세요.',
        tip: '폴리에스터, 울 소재에 적합합니다.',
      },
      {
        symbolId: 'iron-low',
        Component: IronSymbol,
        name: '저온 다림질 (110°C 이하)',
        description: '110도 이하의 낮은 온도로 다림질하세요.',
        tip: '아크릴, 나일론 소재에 적합합니다.',
      },
      {
        symbolId: 'iron-no',
        Component: IronSymbol,
        name: '다림질 금지',
        description: '다림질을 하면 의류가 손상될 수 있습니다.',
        tip: '스팀다리미도 사용하지 마세요.',
      },
    ],
    dryclean: [
      {
        symbolId: 'dryclean-ok',
        Component: DrycleanSymbol,
        name: '드라이클리닝 가능',
        description: '드라이클리닝이 가능합니다.',
        tip: '전문 세탁소에 맡기세요.',
      },
      {
        symbolId: 'dryclean-p',
        Component: DrycleanSymbol,
        name: 'P 용제 사용 가능',
        description: '퍼클로로에틸렌(P) 또는 탄화수소 용제로 드라이클리닝 가능합니다.',
        tip: '세탁소에 라벨을 직접 보여주세요.',
      },
      {
        symbolId: 'dryclean-no',
        Component: DrycleanSymbol,
        name: '드라이클리닝 금지',
        description: '드라이클리닝을 하면 의류가 손상될 수 있습니다.',
        tip: '물세탁 지시 기호를 확인하세요.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center">
        <Link to="/" className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
        </Link>
        <h1
          className="text-[#1a2332] flex-1 text-center mr-8"
          style={{ fontSize: '22px', fontWeight: 700 }}
        >
          세탁 기호 설명
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-5 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 rounded-full whitespace-nowrap transition-all"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                background: activeTab === tab.id ? '#87CEEB' : '#f0f4f8',
                color: activeTab === tab.id ? 'white' : '#6b7688',
                boxShadow: activeTab === tab.id ? '0 3px 10px rgba(135,206,235,0.4)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol Cards */}
      <div className="px-6 space-y-4 pb-8">
        {symbols[activeTab].map((symbol, index) => {
          const Comp = symbol.Component;
          return (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl p-5"
              style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)' }}
            >
              {/* Top row: icon + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#f8fafb]"
                  style={{ width: '52px', height: '52px', padding: '8px' }}
                >
                  <Comp type={symbol.symbolId} />
                </div>
                <h3
                  className="text-[#1a2332]"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                >
                  {symbol.name}
                </h3>
              </div>
              {/* Description — full width */}
              <p
                className="text-[#6b7688] mb-3"
                style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.6' }}
              >
                {symbol.description}
              </p>
              {/* Tip — full width yellow area */}
              <div
                className="rounded-xl px-3 py-2.5"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <p
                  className="text-[#92400e]"
                  style={{ fontSize: '12px', fontWeight: 500, lineHeight: '1.5' }}
                >
                  💡 {symbol.tip}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}