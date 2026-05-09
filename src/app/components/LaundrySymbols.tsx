// ─── 공통 세탁 기호 SVG 컴포넌트 ─────────────────────────────────────────────
// symbol_code 체계:
//   wash_30 / wash_40 / wash_60 / wash_no
//   hand_40 / hand_30 / hand_neutral
//   bleach_cl_ok / bleach_cl_no / bleach_ox_ok / bleach_ox_no
//   machine_dry_60 / machine_dry_80 / machine_dry_no
//   natural_hang_sun / natural_hang_shade / natural_flat_sun / natural_flat_shade
//   iron_low / iron_mid / iron_high / iron_no
//   dryclean_ok / dryclean_gentle / dryclean_special / dryclean_no
//   squeeze_ok / squeeze_no

const S  = '#1a2332';
const SW = 2.2;

// ── X 마크 헬퍼 ───────────────────────────────────────────────────────────────
const X_MARK = (x1: number, y1: number, x2: number, y2: number) => <>
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={S} strokeWidth={SW} strokeLinecap="round"/>
  <line x1={x2} y1={y1} x2={x1} y2={y2} stroke={S} strokeWidth={SW} strokeLinecap="round"/>
</>;

// ── 세탁 통: 개방형 사다리꼴 대야 — 평평한 바닥 ─────────────────────────────
// Top: x=4~36 / Bottom flat: y=36.5 / Rounded bottom corners
const TUB = 'M4,7 L8.5,32 Q8.5,36.5 13,36.5 L27,36.5 Q31.5,36.5 31.5,32 L36,7';

// ── 대야 내부 물결 무늬 (1줄, ∿ 패턴) ────────────────────────────────────────
// y: 기준선, 진폭 ±3, x=11~29 범위
function TubWave({ y }: { y: number }) {
  const d = `M11,${y} Q14,${y - 3} 17,${y} Q20,${y + 3} 23,${y} Q26,${y - 3} 29,${y}`;
  return <path d={d} stroke={S} strokeWidth="1.8" fill="none" strokeLinecap="round"/>;
}

// ── 자연건조: 원형 + 16 스포크 + 내부 텍스트 (KS 표준 이미지-3 기반) ─────────
//   햇빛(sun) → 흰 배경 + 원 + 스포크 + 텍스트
//   그늘(shade) → 동일 + 원 내부 대각선 빗금 (/ 방향)
function NatDrySymbol({ hang, shade, clipId, className }:
  { hang: boolean; shade: boolean; clipId: string; className: string }) {

  const spokes = Array.from({ length: 16 }, (_, i) => {
    const a   = (i * 2 * Math.PI) / 16;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return (
      <line key={i}
        x1={+(20 + 13 * cos).toFixed(2)} y1={+(20 + 13 * sin).toFixed(2)}
        x2={+(20 + 18.5 * cos).toFixed(2)} y2={+(20 + 18.5 * sin).toFixed(2)}
        stroke={S} strokeWidth="1.7" strokeLinecap="round"
      />
    );
  });

  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="12.5"/>
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="12.5" fill="white"/>
      <circle cx="20" cy="20" r="13" stroke={S} strokeWidth={SW} fill="none"/>
      {spokes}
      {shade && (
        <g clipPath={`url(#${clipId})`} opacity="0.72">
          <line x1="0"  y1="15" x2="15" y2="0"  stroke={S} strokeWidth="3"/>
          <line x1="0"  y1="21" x2="21" y2="0"  stroke={S} strokeWidth="3"/>
          <line x1="0"  y1="28" x2="28" y2="0"  stroke={S} strokeWidth="3"/>
          <line x1="0"  y1="35" x2="35" y2="0"  stroke={S} strokeWidth="3"/>
          <line x1="2"  y1="40" x2="40" y2="2"  stroke={S} strokeWidth="3"/>
          <line x1="9"  y1="40" x2="40" y2="9"  stroke={S} strokeWidth="3"/>
        </g>
      )}
      <text
        x="20" y="20.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="800"
        fill={S}
        fontFamily="system-ui, -apple-system, sans-serif"
        style={{ letterSpacing: '-0.3px' }}
      >
        {hang ? '옷걸이' : '뉘어서'}
      </text>
    </svg>
  );
}

// ── 탈수: interlocking 타원 3개 ���─────────────────────────────────────────────
function SqueezeBase() {
  return (
    <>
      <ellipse cx="12" cy="20" rx="7" ry="5.5" stroke={S} strokeWidth="2" fill="none"/>
      <ellipse cx="20" cy="20" rx="7" ry="5.5" stroke={S} strokeWidth="2" fill="none"/>
      <ellipse cx="28" cy="20" rx="7" ry="5.5" stroke={S} strokeWidth="2" fill="none"/>
    </>
  );
}

// ── 공통 도형 ─────────────────────────────────────────────────────────────────
const TRI      = 'M20,5 L36,34 L4,34 Z';
const SQ       = <rect x="5" y="5" width="30" height="30" rx="3" stroke={S} strokeWidth={SW} fill="none"/>;
const IRON_BODY = 'M4,27 H33 Q38,27 38,23 L32,13 H13 Q7,13 7,19 L4,27 Z';

// ─────────────────────────────────────────────────────────────────────────────
export function SymbolIcon({ code, className = 'w-full h-full' }: { code: string; className?: string }) {
  const p  = { viewBox: '0 0 40 40', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', className };
  const ip = { viewBox: '0 0 42 42', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', className };

  // ── 세탁기 세탁: 정사각형 + 우상단 작은 원 + 온도 ──────────────────────────
  if (code === 'wash_30') return (
    <svg {...p}>
      <rect x="4" y="4" width="32" height="32" rx="2" stroke={S} strokeWidth={SW} fill="none"/>
      <circle cx="29" cy="11" r="2.5" stroke={S} strokeWidth="1.6" fill="none"/>
      <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">30℃</text>
    </svg>
  );
  if (code === 'wash_40') return (
    <svg {...p}>
      <rect x="4" y="4" width="32" height="32" rx="2" stroke={S} strokeWidth={SW} fill="none"/>
      <circle cx="29" cy="11" r="2.5" stroke={S} strokeWidth="1.6" fill="none"/>
      <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">40℃</text>
    </svg>
  );
  if (code === 'wash_60') return (
    <svg {...p}>
      <rect x="4" y="4" width="32" height="32" rx="2" stroke={S} strokeWidth={SW} fill="none"/>
      <circle cx="29" cy="11" r="2.5" stroke={S} strokeWidth="1.6" fill="none"/>
      <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">60℃</text>
    </svg>
  );

  // ── 물세탁 금지 (물결 없음) ──────────────────────────────────────────────────
  if (code === 'wash_no') return (
    <svg {...p}>
      <path d={TUB} stroke={S} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {X_MARK(11, 11, 29, 32)}
    </svg>
  );

  // ── 손세탁: 온도 + 물결 1줄 ─────────────────────────────────────────────────
  if (code === 'hand_40') return (
    <svg {...p}>
      <path d={TUB} stroke={S} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="20" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">40℃</text>
      <TubWave y={30}/>
    </svg>
  );
  if (code === 'hand_30') return (
    <svg {...p}>
      <path d={TUB} stroke={S} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="20" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">30℃</text>
      <TubWave y={30}/>
    </svg>
  );
  if (code === 'hand_neutral') return (
    <svg {...p}>
      <path d={TUB} stroke={S} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="20" y="21" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={S} fontFamily="system-ui,sans-serif">약,중성</text>
      <TubWave y={30}/>
    </svg>
  );

  // ── 표백 ─────────────────────────────────────────────────────────────────────
  if (code === 'bleach_cl_ok') return (
    <svg {...p}>
      <path d={TRI} stroke={S} strokeWidth={SW} fill="none" strokeLinejoin="round"/>
      <text x="20" y="28" textAnchor="middle" fontSize="9" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">Cl</text>
    </svg>
  );
  if (code === 'bleach_cl_no') return (
    <svg {...p}>
      <path d={TRI} stroke={S} strokeWidth={SW} fill="none" strokeLinejoin="round"/>
      {X_MARK(12, 18, 28, 30)}
    </svg>
  );
  if (code === 'bleach_ox_ok') return (
    <svg {...p}>
      <path d={TRI} stroke={S} strokeWidth={SW} fill="none" strokeLinejoin="round"/>
      <line x1="15" y1="29" x2="18" y2="16" stroke={S} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="22" y1="29" x2="25" y2="16" stroke={S} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (code === 'bleach_ox_no') return (
    <svg {...p}>
      <path d={TRI} stroke={S} strokeWidth={SW} fill="none" strokeLinejoin="round"/>
      <line x1="15" y1="29" x2="18" y2="16" stroke={S} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="22" y1="29" x2="25" y2="16" stroke={S} strokeWidth="1.8" strokeLinecap="round"/>
      {X_MARK(12, 20, 28, 30)}
    </svg>
  );

  // ── 건조기 (정사각형 + 원) ────────────────────────────────────────────────────
  if (code === 'machine_dry_60') return (
    <svg {...p}>
      {SQ}
      <circle cx="20" cy="20" r="10" stroke={S} strokeWidth={SW} fill="none"/>
      <text x="20" y="24" textAnchor="middle" fontSize="8" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">60°</text>
    </svg>
  );
  if (code === 'machine_dry_80') return (
    <svg {...p}>
      {SQ}
      <circle cx="20" cy="20" r="10" stroke={S} strokeWidth={SW} fill="none"/>
      <text x="20" y="24" textAnchor="middle" fontSize="8" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">80°</text>
    </svg>
  );
  if (code === 'machine_dry_no') return (
    <svg {...p}>
      {SQ}
      <circle cx="20" cy="20" r="10" stroke={S} strokeWidth={SW} fill="none"/>
      {X_MARK(13, 13, 27, 27)}
    </svg>
  );

  // ── 자연건조 ──────────────────────────────────────────────────────────────────
  if (code === 'natural_hang_sun')
    return <NatDrySymbol hang={true}  shade={false} clipId="nd-hs" className={className}/>;
  if (code === 'natural_hang_shade')
    return <NatDrySymbol hang={true}  shade={true}  clipId="nd-hd" className={className}/>;
  if (code === 'natural_flat_sun')
    return <NatDrySymbol hang={false} shade={false} clipId="nd-fs" className={className}/>;
  if (code === 'natural_flat_shade')
    return <NatDrySymbol hang={false} shade={true}  clipId="nd-fd" className={className}/>;

  // ── 다림질 ──────────────────────────────────────────────────────────────��─────
  if (code === 'iron_high') return (
    <svg {...ip}>
      <path d={IRON_BODY} stroke={S} strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <circle cx="13" cy="33" r="2" fill={S}/>
      <circle cx="21" cy="33" r="2" fill={S}/>
      <circle cx="29" cy="33" r="2" fill={S}/>
    </svg>
  );
  if (code === 'iron_mid') return (
    <svg {...ip}>
      <path d={IRON_BODY} stroke={S} strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <circle cx="16" cy="33" r="2" fill={S}/>
      <circle cx="26" cy="33" r="2" fill={S}/>
    </svg>
  );
  if (code === 'iron_low') return (
    <svg {...ip}>
      <path d={IRON_BODY} stroke={S} strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <circle cx="21" cy="33" r="2" fill={S}/>
    </svg>
  );
  if (code === 'iron_no') return (
    <svg {...ip}>
      <path d={IRON_BODY} stroke={S} strokeWidth="2" fill="none" strokeLinejoin="round"/>
      <line x1="9"  y1="10" x2="35" y2="31" stroke={S} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="10" x2="9"  y2="31" stroke={S} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  // ── 드라이클리닝 ──────────────────────────────────────────────────────────────
  if (code === 'dryclean_ok') return (
    <svg {...p}>
      <circle cx="20" cy="20" r="15" stroke={S} strokeWidth={SW}/>
      <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">A</text>
    </svg>
  );
  if (code === 'dryclean_gentle') return (
    <svg {...p}>
      <circle cx="20" cy="20" r="15" stroke={S} strokeWidth={SW}/>
      <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">F</text>
      <line x1="10" y1="33" x2="30" y2="33" stroke={S} strokeWidth="1.5"/>
    </svg>
  );
  if (code === 'dryclean_special') return (
    <svg {...p}>
      <circle cx="20" cy="20" r="15" stroke={S} strokeWidth={SW}/>
      <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill={S} fontFamily="system-ui,sans-serif">S</text>
    </svg>
  );
  if (code === 'dryclean_no') return (
    <svg {...p}>
      <circle cx="20" cy="20" r="15" stroke={S} strokeWidth={SW}/>
      {X_MARK(10, 10, 30, 30)}
    </svg>
  );

  // ── 탈수/짜기 ─────────────────────────────────────────────────────────────────
  if (code === 'squeeze_ok') return (
    <svg {...p}>
      <SqueezeBase/>
    </svg>
  );
  if (code === 'squeeze_no') return (
    <svg {...p}>
      <SqueezeBase/>
      {X_MARK(7, 13, 33, 27)}
    </svg>
  );

  return null;
}