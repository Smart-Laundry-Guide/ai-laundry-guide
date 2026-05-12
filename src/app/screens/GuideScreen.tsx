import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { SymbolIcon } from '../components/LaundrySymbols';
import { BottomNav } from '../components/BottomNav';

type TabType = 'wash' | 'squeeze' | 'bleach' | 'natural_dry' | 'machine_dry' | 'iron' | 'dryclean';

interface SymbolEntry {
  code: string; name: string; description: string; tip: string;
}

const SYMBOLS: Record<TabType, SymbolEntry[]> = {
  wash: [
    { code: 'wash_30', name: '세탁기 세탁 (30°C 이하)',
      description: '최대 30°C의 찬물로 세탁기 세탁이 가능합니다.',
      tip: '울·섬세 코스를 권장합니다. 중성세제를 사용하면 더 안전해요.' },
    { code: 'wash_40', name: '세탁기 세탁 (40~50°C)',
      description: '최대 40~50°C의 미온수로 세탁기 세탁이 가능합니다.',
      tip: '표준 코스로 세탁할 수 있어요.' },
    { code: 'wash_60', name: '세탁기 세탁 (60°C 이상)',
      description: '60°C 이상의 뜨거운 물로 세탁기 세탁이 가능합니다.',
      tip: '면·린넨 등 열에 강한 소재에 적합합니다.' },
    { code: 'hand_40', name: '손세탁 (40°C 이하)',
      description: '최대 40°C에서 손으로 부드럽게 세탁해야 합니다. 세탁기 사용 불가.',
      tip: '비틀어 짜거나 탈수기 사용은 피해 주세요.' },
    { code: 'hand_30', name: '손세탁 (30°C 이하)',
      description: '최대 30°C의 찬물로 손세탁해야 합니다. 세탁기 사용 불가.',
      tip: '니트·실크 등 섬세한 소재에 많이 표시됩니다.' },
    { code: 'hand_neutral', name: '손세탁 (중성세제)',
      description: '중성세제를 사용하여 손세탁해야 합니다.',
      tip: '중성세제는 울샴푸·핸드워시 등 pH 중성 제품을 말해요.' },
    { code: 'wash_no', name: '물세탁 금지',
      description: '물을 이용한 세탁이 금지됩니다. 드라이클리닝을 이용하세요.',
      tip: '임의로 물세탁하면 수축, 변색, 변형이 생길 수 있어요.' },
  ],
  squeeze: [
    { code: 'squeeze_ok', name: '약하게 탈수 가능',
      description: '손으로 짜는 경우 약하게, 원심 탈수기는 짧은 시간만 사용합니다.',
      tip: '강한 탈수는 섬유를 손상시킬 수 있어요.' },
    { code: 'squeeze_no', name: '탈수 금지',
      description: '비틀거나 짜면 안 됩니다. 탈수기 사용도 금지입니다.',
      tip: '수건으로 눌러서 수분을 제거한 뒤 그대로 펴서 건조하세요.' },
  ],
  bleach: [
    { code: 'bleach_cl_ok', name: '염소계 표백 가능',
      description: '염소계(락스 계열) 표백제를 사용할 수 있습니다.',
      tip: '흰 면 소재에 주로 허용됩니다. 용량을 반드시 지키세요.' },
    { code: 'bleach_cl_no', name: '염소계 표백 금지',
      description: '염소계 표백제 사용이 금지됩니다.',
      tip: '산소계 표백제 가능 여부는 별도 기호를 확인하세요.' },
    { code: 'bleach_ox_ok', name: '산소계 표백 가능',
      description: '산소계 표백제(옥시류)를 사용할 수 있습니다.',
      tip: '색상 의류에도 비교적 안전하게 사용할 수 있어요.' },
    { code: 'bleach_ox_no', name: '산소계 표백 금지',
      description: '산소계 표백제 사용도 금지됩니다.',
      tip: '표백이 필요한 경우 전문 세탁소에 문의하세요.' },
  ],

  // ── 자연건조 ────────────────────────────────────────────────────────────────
  natural_dry: [
    { code: 'natural_hang_sun', name: '옷걸이 걸어 햇빛 건조',
      description: '옷걸이에 걸어 햇빛에서 자연건조합니다.',
      tip: '직사광선은 일부 소재의 색을 바래게 할 수 있어요.' },
    { code: 'natural_hang_shade', name: '옷걸이 걸어 그늘 건조',
      description: '옷걸이에 걸어 그늘에서 자연건조합니다.',
      tip: '통풍이 잘 되는 그늘이 가장 이상적이에요.' },
    { code: 'natural_flat_sun', name: '뉘어서 햇빛 건조',
      description: '평평하게 뉘어서 햇빛에서 자연건조합니다.',
      tip: '니트처럼 형태 유지가 중요한 소재에 적합합니다.' },
    { code: 'natural_flat_shade', name: '뉘어서 그늘 건조',
      description: '평평하게 뉘어서 그늘에서 자연건조합니다.',
      tip: '수분이 빠지면서 형태가 그대로 유지됩니다.' },
  ],

  // ── 건조기 ──────────────────────────────────────────────────────────────────
  machine_dry: [
    { code: 'machine_dry_60', name: '건조기 사용 가능 (60°C 이하)',
      description: '60°C를 초과하지 않는 온도에서 건조기를 사용할 수 있습니다.',
      tip: '살짝 덜 건조된 상태에서 꺼내면 수축을 줄일 수 있어요.' },
    { code: 'machine_dry_80', name: '건조기 사용 가능 (80°C 이하)',
      description: '80°C를 초과하지 않는 온도에서 건조기를 사용할 수 있습니다.',
      tip: '면·린넨 등 열에 강한 소재에 주로 허용됩니다.' },
    { code: 'machine_dry_no', name: '건조기 사용 금지',
      description: '건조기를 사용하면 수축하거나 변형될 수 있습니다.',
      tip: '자연건조 기호를 함께 확인해 건조 방법을 선택하세요.' },
  ],

  iron: [
    { code: 'iron_low', name: '저온 다림질 (120°C 이하)',
      description: '다리미 온도를 최대 120°C로 설정하여 다림질합니다.',
      tip: '아크릴·나일론 등 열에 약한 합성섬유에 적합합니다.' },
    { code: 'iron_mid', name: '중온 다림질 (160°C 이하)',
      description: '다리미 온도를 최대 160°C로 설정하여 다림질합니다.',
      tip: '폴리에스터·울 혼방 소재에 적합합니다.' },
    { code: 'iron_high', name: '고온 다림질 (210°C 이하)',
      description: '다리미 온도를 최대 210°C로 설정하여 다림질합니다.',
      tip: '면·린넨 소재에 적합합니다.' },
    { code: 'iron_no', name: '다림질 금지',
      description: '다림질을 하면 의류가 손상될 수 있습니다.',
      tip: '스팀다리미도 사용하지 마세요.' },
  ],
  dryclean: [
    { code: 'dryclean_ok', name: '드라이클리닝 가능',
      description: '다양한 용제를 사용하는 일반 드라이클리닝이 가능합니다.',
      tip: '세탁소에 라벨을 직접 보여주세요.' },
    { code: 'dryclean_gentle', name: '드라이클리닝 약하게',
      description: '약한 방법으로 드라이클리닝해야 합니다.',
      tip: '세탁소에 "약하게" 처리 요청을 해주세요.' },
    { code: 'dryclean_special', name: '특수 전문점 드라이클리닝',
      description: '가죽·모피·헤어 등을 전문적으로 취급하는 전문점에서만 가능합니다.',
      tip: '일반 세탁소에는 맡기지 마세요.' },
    { code: 'dryclean_no', name: '드라이클리닝 금지',
      description: '드라이클리닝이 불가합니다.',
      tip: '물세탁 또는 손세탁 기호를 확인하세요.' },
  ],
};

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'wash',        label: '세탁',    emoji: '🫧' },
  { id: 'squeeze',     label: '탈수',    emoji: '💧' },
  { id: 'bleach',      label: '표백',    emoji: '🔆' },
  { id: 'natural_dry', label: '자연건조', emoji: '🌿' },
  { id: 'machine_dry', label: '건조기',  emoji: '🌀' },
  { id: 'iron',        label: '다림질',  emoji: '♨️' },
  { id: 'dryclean',    label: '드라이',  emoji: '✨' },
];

export function GuideScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('wash');
  const currentTabInfo = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-24">
      {/* 헤더 */}
      <div className="bg-white px-6 pt-12 pb-4 flex items-center"
        style={{ borderBottom: '1px solid #eef1f5' }}>
        <Link to="/" className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
        </Link>
        <h1 className="text-[#1a2332] flex-1 text-center mr-8"
          style={{ fontSize: '22px', fontWeight: 700 }}>
          세탁 기호 설명
        </h1>
      </div>

      {/* 탭 스크롤 */}
      <div className="px-6 py-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0"
              style={{
                fontSize: '13px', fontWeight: 600,
                background: activeTab === tab.id ? '#87CEEB' : '#f0f4f8',
                color:      activeTab === tab.id ? 'white'   : '#6b7688',
                boxShadow:  activeTab === tab.id ? '0 3px 10px rgba(135,206,235,0.4)' : 'none',
              }}>
              <span style={{ fontSize: '12px' }}>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 현재 탭 설명 배너 */}
      <div className="mx-6 mb-4 px-4 py-3 rounded-2xl flex items-center gap-2"
        style={{ background: 'linear-gradient(135deg, #e3f4fb, #d4f1e8)' }}>
        <span style={{ fontSize: '18px' }}>{currentTabInfo.emoji}</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a5f7a' }}>
            {currentTabInfo.label} 기호
          </p>
          <p style={{ fontSize: '11px', color: '#5a8fa0' }}>
            {SYMBOLS[activeTab].length}가지 기호
          </p>
        </div>
      </div>

      {/* 기호 카드 목록 */}
      <div className="px-6 space-y-4">
        {SYMBOLS[activeTab].map((sym, i) => (
          <div key={i} className="bg-white rounded-2xl p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-4 mb-3">
              {/* 기호 아이콘 */}
              <div className="w-14 h-14 flex-shrink-0 bg-[#f8fafb] rounded-2xl flex items-center justify-center p-2">
                <SymbolIcon code={sym.code}/>
              </div>
              <h3 className="text-[#1a2332] flex-1"
                style={{ fontSize: '15px', fontWeight: 700 }}>
                {sym.name}
              </h3>
            </div>
            <p className="text-[#6b7688] mb-3"
              style={{ fontSize: '13px', lineHeight: '1.6' }}>
              {sym.description}
            </p>
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p className="text-[#92400e]"
                style={{ fontSize: '12px', lineHeight: '1.5' }}>
                💡 {sym.tip}
              </p>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
