import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { SymbolIcon, MachineWashIcon, HandWashIcon } from '../components/LaundrySymbols';
import { BottomNav } from '../components/BottomNav';

type TabType = 'machine_wash' | 'hand_wash' | 'squeeze' | 'bleach' | 'natural_dry' | 'machine_dry' | 'iron' | 'dryclean' | 'other';

interface SymbolEntry {
  code: string;
  name: string;
  description: string;
  tip: string;
  // 세탁기·손세탁 파라메트릭 아이콘용
  washType?: 'machine' | 'hand';
  temp?: number;
  gentle?: boolean;
  veryGentle?: boolean;
  neutral?: boolean;
}

const SYMBOLS: Record<TabType, SymbolEntry[]> = {
  // ── 세탁기 세탁 ────────────────────────────────────────────────────────────
  machine_wash: [
    { code: '', washType: 'machine', temp: 30, gentle: true, neutral: true,
      name: '세탁기 세탁 (30°C, 약하게, 중성세제)',
      description: '30°C 이하의 찬물에서 약한 수류로 세탁합니다. 반드시 중성세제를 사용해야 합니다.',
      tip: '캐시미어·울 혼방 등 섬세한 고급 소재에 적합합니다. 중성세제 없이 세탁하면 섬유가 손상될 수 있어요.' },
    { code: '', washType: 'machine', temp: 30, veryGentle: true,
      name: '세탁기 세탁 (30°C, 매우 약하게)',
      description: '30°C 이하의 찬물에서 매우 약한 수류로 세탁합니다.',
      tip: '자수·장식이 많거나 구조가 복잡한 소재에 적합합니다. 세탁망 사용을 권장해요.' },
    { code: '', washType: 'machine', temp: 30, gentle: true,
      name: '세탁기 세탁 (30°C, 약하게)',
      description: '30°C 이하의 찬물에서 약한 수류로 세탁합니다.',
      tip: '울·합성섬유 혼방 소재에 적합합니다. 섬세 또는 울 코스를 선택하세요.' },
    { code: '', washType: 'machine', temp: 60, gentle: true,
      name: '세탁기 세탁 (60°C, 약하게)',
      description: '60°C의 뜨거운 물에서 약한 수류로 세탁합니다.',
      tip: '색상 있는 면 소재 중 고온이 필요하지만 강한 세탁은 피해야 할 의류에 적합합니다.' },
    { code: '', washType: 'machine', temp: 50, gentle: true,
      name: '세탁기 세탁 (50°C, 약하게)',
      description: '50°C의 미온수에서 약한 수류로 세탁합니다.',
      tip: '합성섬유 혼방 소재에 적합합니다. 섬세 코스를 선택해 세탁하세요.' },
    { code: '', washType: 'machine', temp: 40, veryGentle: true,
      name: '세탁기 세탁 (40°C, 매우 약하게)',
      description: '40°C의 미온수에서 매우 약한 수류로 세탁합니다.',
      tip: '기계 세탁이 가능하지만 극도로 섬세한 소재에 적합합니다. 울 코스를 이용하세요.' },
    { code: '', washType: 'machine', temp: 40, gentle: true,
      name: '세탁기 세탁 (40°C, 약하게)',
      description: '40°C의 미온수에서 약한 수류로 세탁합니다.',
      tip: '일반 합성섬유 및 혼방 소재에 적합합니다. 섬세 코스로 세탁하세요.' },
    { code: '', washType: 'machine', temp: 95,
      name: '세탁기 세탁 (95°C)',
      description: '95°C의 매우 뜨거운 물로 세탁기 세탁이 가능합니다.',
      tip: '흰 면 소재나 위생 세탁이 필요한 의류에 사용합니다. 대부분의 의류에는 적용하지 마세요.' },
    { code: '', washType: 'machine', temp: 70,
      name: '세탁기 세탁 (70°C)',
      description: '70°C의 뜨거운 물로 세탁기 세탁이 가능합니다.',
      tip: '면·린넨 등 열에 강한 소재에 적합합니다. 침구류 위생 세탁에 효과적이에요.' },
    { code: '', washType: 'machine', temp: 60,
      name: '세탁기 세탁 (60°C)',
      description: '60°C의 뜨거운 물로 세탁기 세탁이 가능합니다.',
      tip: '면·린넨 등 열에 강한 소재에 적합합니다. 침구류·타월 세탁에 많이 사용됩니다.' },
    { code: '', washType: 'machine', temp: 50,
      name: '세탁기 세탁 (50°C)',
      description: '50°C의 미온수로 세탁기 세탁이 가능합니다.',
      tip: '면·합성섬유 혼방 소재에 적합합니다. 표준 코스로 세탁하세요.' },
    { code: '', washType: 'machine', temp: 40,
      name: '세탁기 세탁 (40°C)',
      description: '40°C의 미온수로 세탁기 세탁이 가능합니다.',
      tip: '일반 의류에 가장 많이 사용되는 온도입니다. 표준 코스로 세탁하세요.' },
    { code: '', washType: 'machine', temp: 30,
      name: '세탁기 세탁 (30°C)',
      description: '30°C 이하의 찬물로 세탁기 세탁이 가능합니다.',
      tip: '울·섬세 코스를 권장합니다. 중성세제를 사용하면 더 안전해요.' },
    { code: 'wash_no', name: '물세탁 금지',
      description: '물을 이용한 세탁이 금지됩니다. 드라이클리닝을 이용하세요.',
      tip: '임의로 물세탁하면 수축, 변색, 변형이 생길 수 있어요.' },
  ],

  // ── 손세탁 ─────────────────────────────────────────────────────────────────
  hand_wash: [
    { code: '', washType: 'hand', temp: 40, gentle: true, neutral: true,
      name: '손세탁 (40°C, 약하게, 중성세제)',
      description: '40°C 이하의 미온수에서 중성세제로 약하게 손세탁합니다.',
      tip: '고급 울·실크 등 매우 섬세한 소재에 적합합니다. 비틀어 짜지 말고 수건으로 눌러 탈수하세요.' },
    { code: '', washType: 'hand', temp: 30, gentle: true, neutral: true,
      name: '손세탁 (30°C, 약하게, 중성세제)',
      description: '30°C 이하의 찬물에서 중성세제로 약하게 손세탁합니다.',
      tip: '캐시미어·앙고라 등 최고급 소재에 적합합니다. 손세탁 전용 중성세제를 사용하세요.' },
    { code: '', washType: 'hand', temp: 40, neutral: true,
      name: '손세탁 (40°C, 중성세제)',
      description: '40°C 이하의 미온수에서 중성세제로 손세탁합니다.',
      tip: '울·실크 소재에 적합합니다. 중성세제는 울샴푸, 핸드워시 등 pH 중성 제품을 사용하세요.' },
    { code: '', washType: 'hand', temp: 30, neutral: true,
      name: '손세탁 (30°C, 중성세제)',
      description: '30°C 이하의 찬물에서 중성세제로 손세탁합니다.',
      tip: '섬세한 소재의 손세탁 시 반드시 pH 중성 세제를 사용하세요. 헹굼 후 수건으로 눌러 탈수하세요.' },
    { code: '', washType: 'hand', temp: 40, gentle: true,
      name: '손세탁 (40°C, 약하게)',
      description: '40°C 이하의 미온수에서 약하게 손세탁합니다. 세탁기 사용 불가.',
      tip: '강하게 문지르거나 비틀지 마세요. 부드럽게 눌러가며 세탁하는 것이 좋아요.' },
    { code: '', washType: 'hand', temp: 30, gentle: true,
      name: '손세탁 (30°C, 약하게)',
      description: '30°C 이하의 찬물에서 약하게 손세탁합니다. 세탁기 사용 불가.',
      tip: '자수·장식이 있는 섬세한 의류에 적합합니다. 찬물로 부드럽게 눌러가며 세탁하세요.' },
    { code: '', washType: 'hand', temp: 40,
      name: '손세탁 (40°C)',
      description: '최대 40°C에서 손으로 부드럽게 세탁합니다. 세탁기 사용 불가.',
      tip: '비틀어 짜거나 탈수기 사용은 피해 주세요. 수건으로 눌러 탈수하세요.' },
    { code: '', washType: 'hand', temp: 30,
      name: '손세탁 (30°C)',
      description: '최대 30°C의 찬물로 손세탁합니다. 세탁기 사용 불가.',
      tip: '니트·실크 등 섬세한 소재에 많이 표시됩니다. 찬물에 부드럽게 세탁하세요.' },
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
    { code: 'dryclean_ok',        name: '드라이클리닝 가능',
      description: '다양한 용제를 사용하는 일반 드라이클리닝이 가능합니다.',
      tip: '어떤 용제든 사용 가능하므로 일반 세탁소에서 처리 가능합니다.' },
    { code: 'dryclean_petroleum', name: '석유계 드라이클리닝',
      description: '석유계 용제를 사용하여 드라이클리닝해야 합니다.',
      tip: '세탁소에 "석유계" 처리 요청을 해주세요.' },
    { code: 'dryclean_silicone',  name: '실리콘계 드라이클리닝',
      description: '실리콘계 용제를 사용하여 드라이클리닝해야 합니다.',
      tip: '세탁소에 "실리콘계" 처리 요청을 해주세요.' },
    { code: 'dryclean_special',   name: '전문점 드라이클리닝',
      description: '가죽, 모피, 앙고라 등 특수 소재를 전문적으로 취급하는 전문점에서만 세탁 가능합니다.',
      tip: '가죽·모피 전문 세탁소에 소재를 알려주고 맡기세요.' },
    { code: 'dryclean_no',        name: '드라이클리닝 금지',
      description: '드라이클리닝을 할 수 없습니다.',
      tip: '물세탁 등 다른 방법을 확인하세요.' },
  ],
  other: [
    { code: 'flame_warning', name: '화기주의',
      description: '불꽃이나 강한 열기에 가까이 할 경우 옷감이 쉽게 불에 타거나 녹아내릴 위험이 있습니다.',
      tip: '겨울철 난로, 캠핑장 화로, 가스레인지 등 화기 근처에서 착용 시 각별한 주의가 필요해요.' },
  ],
};

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'machine_wash', label: '세탁기',   emoji: '🫧' },
  { id: 'hand_wash',    label: '손세탁',   emoji: '🤲' },
  { id: 'squeeze',      label: '탈수',     emoji: '💧' },
  { id: 'bleach',       label: '표백',     emoji: '🔆' },
  { id: 'natural_dry',  label: '자연건조', emoji: '🌿' },
  { id: 'machine_dry',  label: '건조기',   emoji: '🌀' },
  { id: 'iron',         label: '다림질',   emoji: '♨️' },
  { id: 'dryclean',     label: '드라이',   emoji: '✨' },
  { id: 'other',        label: '기타',     emoji: '⚠️' },
];

// 약/매우 뱃지 텍스트
function intensityBadge(gentle?: boolean, veryGentle?: boolean) {
  if (veryGentle) return '매우 약하게';
  if (gentle)     return '약하게';
  return null;
}

export function GuideScreen() {
  const location = useLocation();
  const initTab = (location.state?.tab as TabType | undefined) ?? 'machine_wash';
  const [activeTab, setActiveTab] = useState<TabType>(initTab);
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
        {SYMBOLS[activeTab].map((sym, i) => {
          const isWash = !!sym.washType;
          const badge  = isWash ? intensityBadge(sym.gentle, sym.veryGentle) : null;

          return (
            <div key={i} className="bg-white rounded-2xl p-5"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-4 mb-3">
                {/* 기호 아이콘 */}
                <div
                  className="flex-shrink-0 bg-[#f8fafb] rounded-2xl flex items-center justify-center p-2"
                  style={{ width: '56px', height: isWash ? '64px' : '56px' }}
                >
                  {sym.washType === 'machine' ? (
                    <MachineWashIcon
                      temp={sym.temp!}
                      gentle={sym.gentle}
                      veryGentle={sym.veryGentle}
                      neutral={sym.neutral}
                      className="w-full h-full"
                    />
                  ) : sym.washType === 'hand' ? (
                    <HandWashIcon
                      temp={sym.temp!}
                      gentle={sym.gentle}
                      veryGentle={sym.veryGentle}
                      neutral={sym.neutral}
                      className="w-full h-full"
                    />
                  ) : (
                    <SymbolIcon code={sym.code} />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-[#1a2332]"
                    style={{ fontSize: '15px', fontWeight: 700, lineHeight: '1.4' }}>
                    {sym.name}
                  </h3>
                  {/* 강도·중성 뱃지 */}
                  {(badge || sym.neutral) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {badge && (
                        <span className="px-2 py-0.5 rounded-full"
                          style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '10px', fontWeight: 700 }}>
                          {sym.veryGentle ? '══ 매우 약하게' : '─ 약하게'}
                        </span>
                      )}
                      {sym.neutral && (
                        <span className="px-2 py-0.5 rounded-full"
                          style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700 }}>
                          중성세제 필수
                        </span>
                      )}
                    </div>
                  )}
                </div>
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
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
