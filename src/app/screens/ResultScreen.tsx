import { ArrowLeft, Droplet, Wind, AlertTriangle, Package, Shirt, Trash2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { saveHistoryItem } from './HistoryScreen';
import { SymbolIcon } from '../components/LaundrySymbols';

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface Candidate { cls: string; confidence: number; }
interface OcrResult {
  care?: string[]; warning?: string[]; prohibitions?: string[]; materials?: string[];
}
interface SymbolResult { cls: string; confidence: number; subclass?: string | null; }
interface LocationState {
  fromAnalysis?: boolean;
  labelType?: 'symbol' | 'ocr' | null;
  topCandidates?: Candidate[];
  lowConfidence?: boolean;
  ocrResult?: OcrResult;
  symbols?: SymbolResult[];
  capturedImage?: string;
  clothingPreview?: string;
  /**
   * 모델이 직접 생성한 한국어 분석 문장.
   * analysisService.ts 의 AnalysisApiResponse.modelSummary 에서 전달됩니다.
   * 값이 있으면 규칙 기반 문장(buildSymbolSummary 등) 대신 이 값을 표시합니다.
   */
  modelSummary?: string;
  readOnly?: boolean;
  initialSymSel?: Record<string, string | null>;
}

// ─── 의류 기본 정보 ────────────────────────────────────────────────────────────
const CLASS_KR: Record<string,string> = {
  T_shirt:'티셔츠', denim:'데님', knit:'니트', pants:'바지',
  shirt:'셔츠', dress:'원피스', skirt:'치마', blouse:'블라우스', jacket:'자켓',
};
interface ClothingGuide {
  washMethod:string; washMode:string; dryMethod:string; caution:string;
  gradientFrom:string; gradientTo:string; iconColor:string; summary:string;
}
const CLOTHING: Record<string,ClothingGuide> = {
  knit:{
    washMethod:'찬물 또는 미지근한 물 (30°C 이하)',washMode:'울 코스 / 약한 세탁',
    dryMethod:'자연건조 (평평하게 펼쳐서)',caution:'건조기 금지, 강한 탈수 주의',
    gradientFrom:'#e3f4fb',gradientTo:'#c8e9f8',iconColor:'#87CEEB',
    summary:'니트는 열과 마찰에 약해요. 찬물에 손세탁하거나 울 코스로 부드럽게 세탁하고, 건조기 없이 평평하게 펴서 말려 주세요.',
  },
  T_shirt:{
    washMethod:'미지근한 물 (30~40°C)',washMode:'표준 코스',
    dryMethod:'자연건조 또는 저온 건조기',caution:'인쇄 면 고온 다림질 금지',
    gradientFrom:'#d4f1e8',gradientTo:'#b8e8d4',iconColor:'#98D8C8',
    summary:'면 티셔츠는 세탁기로 편하게 세탁할 수 있어요. 뒤집어서 세탁하면 프린팅 손상을 줄일 수 있고, 고온 건조는 수축의 원인이 될 수 있어요.',
  },
  shirt:{
    washMethod:'미지근한 물 (40°C 이하)',washMode:'일반 코스',
    dryMethod:'걸어서 자연건조',caution:'세탁 후 바로 꺼내 구김 방지',
    gradientFrom:'#f0f9ff',gradientTo:'#e0f2fe',iconColor:'#7dd3fc',
    summary:'셔츠는 세탁기 일반 코스로 세탁 가능해요. 세탁 후 빠르게 꺼내어 걸어두면 구김을 크게 줄일 수 있어요.',
  },
  pants:{
    washMethod:'미지근한 물',washMode:'일반 또는 울 코스',
    dryMethod:'자연건조 (접지 않고 걸기)',caution:'세탁 후 빠르게 꺼내기',
    gradientFrom:'#f5f3ff',gradientTo:'#ede9fe',iconColor:'#a78bfa',
    summary:'바지는 소재에 따라 세탁 방법이 다를 수 있어요. 뒤집어서 세탁하고, 구김을 줄이려면 세탁 후 바로 꺼내어 펴 주세요.',
  },
  denim:{
    washMethod:'찬물 (30°C 이하)',washMode:'섬세 / 데님 코스',
    dryMethod:'그늘 자연건조',caution:'처음 세탁 시 단독 세탁 필수',
    gradientFrom:'#eff6ff',gradientTo:'#dbeafe',iconColor:'#60a5fa',
    summary:'데님은 처음 세탁할 때 색이 빠질 수 있어요. 찬물에 반드시 단독으로 세탁하고, 뒤집어서 그늘에 말려 퇴색을 방지하세요.',
  },
  dress:{
    washMethod:'미지근한 물 (30°C 이하)',washMode:'섬세 코스 또는 손세탁',
    dryMethod:'그늘 자연건조 (걸어서)',caution:'비틀어 짜지 말고 눌러 탈수',
    gradientFrom:'#fdf2f8',gradientTo:'#fce7f3',iconColor:'#f472b6',
    summary:'원피스는 소재에 따라 취급이 달라요. 섬세 코스나 손세탁을 선택하고, 짜지 말고 눌러서 수분을 제거한 뒤 걸어서 그늘에 건조해 주세요.',
  },
  skirt:{
    washMethod:'미지근한 물 (30°C 이하)',washMode:'섬세 코스',
    dryMethod:'자연건조 (걸어서)',caution:'비틀어 짜지 않기',
    gradientFrom:'#fff7ed',gradientTo:'#ffedd5',iconColor:'#fb923c',
    summary:'치마는 섬세 코스로 부드럽게 세탁하세요. 강하게 짜면 형태가 흐트러질 수 있어요. 세탁망을 사용하면 더 안전해요.',
  },
  blouse:{
    washMethod:'찬물 (30°C 이하)',washMode:'손세탁 또는 울 코스',
    dryMethod:'그늘 자연건조 (걸어서)',caution:'세게 비비거나 탈수 금지',
    gradientFrom:'#f0fdf4',gradientTo:'#dcfce7',iconColor:'#4ade80',
    summary:'블라우스는 섬세한 소재인 경우가 많아요. 손세탁하거나 울 코스를 이용하고, 중성세제를 사용하면 원단 손상을 줄일 수 있어요.',
  },
  jacket:{
    washMethod:'찬물 또는 드라이클리닝',washMode:'드라이클리닝 권장',
    dryMethod:'자연건조 (걸어서)',caution:'라벨 필수 확인 후 세탁',
    gradientFrom:'#f8fafc',gradientTo:'#f1f5f9',iconColor:'#94a3b8',
    summary:'자켓은 소재와 구조가 복잡해 임의로 세탁하면 변형될 수 있어요. 라벨을 먼저 확인하고, 가능하면 드라이클리닝을 선택하세요.',
  },
};

// ─── 기호 선택 상태 ────────────────────────────────────────────────────────────
type WashSel     = 'machine_30'|'machine_40'|'machine_60'|'hand_40'|'hand_30'|'hand_neutral'|'no_wash'|null;
type BleachSel   = 'cl_ok'|'cl_no'|'ox_ok'|'ox_no'|null;
type MachineDry  = 'ok_60'|'ok_80'|'no'|null;
type NaturalDry  = 'hang_sun'|'hang_shade'|'flat_sun'|'flat_shade'|null;
type IronSel     = 'low'|'mid'|'high'|'no'|null;
type DryCleanSel = 'ok'|'gentle'|'special'|'no'|null;
type SqueezeSel  = 'ok'|'no'|null;
interface SymbolSel {
  wash: WashSel; bleach: BleachSel; machine_dry: MachineDry;
  natural_dry: NaturalDry; iron: IronSel; dryclean: DryCleanSel; squeeze: SqueezeSel;
}

// ── subclass 텍스트에서 키워드를 찾아 세부 값을 결정하는 헬퍼 ─────────────────
function matchSub(sub: string | null | undefined, keywords: string[]): boolean {
  if (!sub) return false;
  return keywords.some(kw => sub.includes(kw));
}

// ── YOLO 탐지 결과 + subclass(OCR) → 앱 내부 선택 상태로 변환 ─────────────────
function yoloToSel(yolo: SymbolResult[]): SymbolSel {
  const map = new Map(yolo.map(x => [x.cls, x]));

  // 세탁 방법
  let wash: WashSel = null;
  if (map.has('no_wash')) {
    wash = 'no_wash';
  } else if (map.has('hand_wash')) {
    const sub = map.get('hand_wash')?.subclass;
    wash = matchSub(sub, ['중성'])        ? 'hand_neutral'
         : matchSub(sub, ['40'])          ? 'hand_40'
         : 'hand_30'; // 기본값
  } else if (map.has('machine_wash')) {
    const sub = map.get('machine_wash')?.subclass;
    wash = matchSub(sub, ['60', '70', '95']) ? 'machine_60'
         : matchSub(sub, ['30'])             ? 'machine_30'
         : 'machine_40'; // 기본값
  }

  // 표백
  const bleach: BleachSel =
    map.has('no_bleach') ? 'cl_no' :
    map.has('bleach')    ? 'cl_ok' : null;

  // 건조기
  let machine_dry: MachineDry = null;
  if (map.has('no_tumble_dry')) {
    machine_dry = 'no';
  } else if (map.has('tumble_dry')) {
    const sub = map.get('tumble_dry')?.subclass;
    machine_dry = matchSub(sub, ['80']) ? 'ok_80' : 'ok_60';
  }

  // 자연건조
  let natural_dry: NaturalDry = null;
  if (map.has('natural_dry')) {
    const sub = map.get('natural_dry')?.subclass;
    natural_dry = matchSub(sub, ['뉘어', '평평']) && matchSub(sub, ['햇빛', '햇볕']) ? 'flat_sun'
                : matchSub(sub, ['뉘어', '평평'])                                    ? 'flat_shade'
                : matchSub(sub, ['햇빛', '햇볕'])                                    ? 'hang_sun'
                : 'hang_shade'; // 기본값
  }

  // 다림질
  let iron: IronSel = null;
  if (map.has('no_iron')) {
    iron = 'no';
  } else if (map.has('iron')) {
    const sub = map.get('iron')?.subclass;
    iron = matchSub(sub, ['저온', '120']) ? 'low'
         : matchSub(sub, ['고온', '210']) ? 'high'
         : 'mid'; // 기본값 (중온 160°C)
  }

  // 드라이클리닝
  let dryclean: DryCleanSel = null;
  if (map.has('no_dry_clean')) {
    dryclean = 'no';
  } else if (map.has('dry_clean')) {
    const sub = map.get('dry_clean')?.subclass;
    dryclean = matchSub(sub, ['석유', '실리콘', '전문', '퍼클']) ? 'special'
             : matchSub(sub, ['약'])                              ? 'gentle'
             : 'ok'; // 기본값
  }

  // 탈수
  const squeeze: SqueezeSel =
    map.has('no_squeeze') ? 'no' :
    map.has('squeeze')    ? 'ok' : null;

  return { wash, bleach, machine_dry, natural_dry, iron, dryclean, squeeze };
}

// ─── 가이드 행 생성 ────────────────────────────────────────────────────────────
interface GuideRow { category: string; code: string; label: string; prohibited: boolean; }

function buildRows(sel: SymbolSel): GuideRow[] {
  const rows: GuideRow[] = [];
  const washMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    machine_30:  {code:'wash_30',      label:'세탁기 세탁 (30°C 이하)',         prohibited:false},
    machine_40:  {code:'wash_40',      label:'세탁기 세탁 (40~50°C)',           prohibited:false},
    machine_60:  {code:'wash_60',      label:'세탁기 세탁 (60°C 이상)',         prohibited:false},
    hand_40:     {code:'hand_40',      label:'손세탁 (40°C 이하, 세탁기 불가)', prohibited:false},
    hand_30:     {code:'hand_30',      label:'손세탁 (30°C 이하, 세탁기 불가)', prohibited:false},
    hand_neutral:{code:'hand_neutral', label:'손세탁 (중성세제, 세탁기 불가)',  prohibited:false},
    no_wash:     {code:'wash_no',      label:'물세탁 금지',                     prohibited:true},
  };
  if (sel.wash && washMap[sel.wash]) {
    const w = washMap[sel.wash];
    rows.push({category:'세탁',code:w.code,label:w.label,prohibited:w.prohibited});
  }
  const bleachMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    cl_ok:{code:'bleach_cl_ok',label:'염소계 표백 가능',prohibited:false},
    cl_no:{code:'bleach_cl_no',label:'염소계 표백 금지',prohibited:true},
    ox_ok:{code:'bleach_ox_ok',label:'산소계 표백 가능',prohibited:false},
    ox_no:{code:'bleach_ox_no',label:'산소계 표백 금지',prohibited:true},
  };
  if (sel.bleach && bleachMap[sel.bleach]) {
    const b = bleachMap[sel.bleach];
    rows.push({category:'표백',code:b.code,label:b.label,prohibited:b.prohibited});
  }
  const mdMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    ok_60:{code:'machine_dry_60',label:'건조기 사용 가능 (60°C 이하)',prohibited:false},
    ok_80:{code:'machine_dry_80',label:'건조기 사용 가능 (80°C 이하)',prohibited:false},
    no:   {code:'machine_dry_no',label:'건조기 사용 금지',prohibited:true},
  };
  if (sel.machine_dry && mdMap[sel.machine_dry]) {
    const m = mdMap[sel.machine_dry];
    rows.push({category:'건조기',code:m.code,label:m.label,prohibited:m.prohibited});
  }
  const ndMap: Record<string,{code:string;label:string}> = {
    hang_sun:  {code:'natural_hang_sun',  label:'옷걸이에 걸어 햇빛 건조'},
    hang_shade:{code:'natural_hang_shade',label:'옷걸이에 걸어 그늘 건조'},
    flat_sun:  {code:'natural_flat_sun',  label:'뉘어서 햇빛 건조'},
    flat_shade:{code:'natural_flat_shade',label:'뉘어서 그늘 건조'},
  };
  if (sel.natural_dry && ndMap[sel.natural_dry]) {
    const n = ndMap[sel.natural_dry];
    rows.push({category:'자연건조',code:n.code,label:n.label,prohibited:false});
  }
  const ironMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    low: {code:'iron_low', label:'저온 다림질 (120°C 이하)',prohibited:false},
    mid: {code:'iron_mid', label:'중온 다림질 (160°C 이하)',prohibited:false},
    high:{code:'iron_high',label:'고온 다림질 (210°C 이하)',prohibited:false},
    no:  {code:'iron_no',  label:'다림질 금지',prohibited:true},
  };
  if (sel.iron && ironMap[sel.iron]) {
    const ir = ironMap[sel.iron];
    rows.push({category:'다림질',code:ir.code,label:ir.label,prohibited:ir.prohibited});
  }
  const dcMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    ok:     {code:'dryclean_ok',     label:'드라이클리닝 가능',prohibited:false},
    gentle: {code:'dryclean_gentle', label:'드라이클리닝 약하게',prohibited:false},
    special:{code:'dryclean_special',label:'전문점 드라이클리닝',prohibited:false},
    no:     {code:'dryclean_no',     label:'드라이클리닝 금지',prohibited:true},
  };
  if (sel.dryclean && dcMap[sel.dryclean]) {
    const dc = dcMap[sel.dryclean];
    rows.push({category:'드라이클리닝',code:dc.code,label:dc.label,prohibited:dc.prohibited});
  }
  const sqMap: Record<string,{code:string;label:string;prohibited:boolean}> = {
    ok:{code:'squeeze_ok',label:'약하게 탈수 가능',prohibited:false},
    no:{code:'squeeze_no',label:'탈수 금지',prohibited:true},
  };
  if (sel.squeeze && sqMap[sel.squeeze]) {
    const sq = sqMap[sel.squeeze];
    rows.push({category:'탈수',code:sq.code,label:sq.label,prohibited:sq.prohibited});
  }
  return rows;
}

// ─── AI 분석 문장 생성 ───────────────────────────────────────────────────────
function buildSymbolSummary(sel: SymbolSel, name: string): string {
  const s: string[] = [];

  // 세탁
  if (sel.wash === 'no_wash')       s.push(`${name}은(는) 물세탁이 불가해요. 드라이클리닝을 이용해 주세요.`);
  else if (sel.wash === 'machine_30') s.push('찬물(30°C 이하)로 세탁기 세탁이 가능해요.');
  else if (sel.wash === 'machine_40') s.push('미지근한 물(40~50°C)로 세탁기 세탁이 가능해요.');
  else if (sel.wash === 'machine_60') s.push('뜨거운 물(60°C 이상)로 세탁기 세탁이 가능해요.');
  else if (sel.wash === 'hand_40')    s.push('40°C 이하 미지근한 물로 손세탁만 가능해요. 세탁기 사용은 피해 주세요.');
  else if (sel.wash === 'hand_30')    s.push('30°C 이하 찬물로 손세탁만 가능해요. 세탁기 사용은 피해 주세요.');
  else if (sel.wash === 'hand_neutral') s.push('중성세제로 손세탁해 주세요. 세탁기 사용은 피해 주세요.');

  // 표백
  if (sel.bleach === 'cl_no' || sel.bleach === 'ox_no') s.push('표백제는 사용하지 마세요.');
  else if (sel.bleach === 'cl_ok') s.push('염소계 표백제 사용이 가능해요.');
  else if (sel.bleach === 'ox_ok') s.push('산소계 표백제 사용이 가능해요.');

  // 건조기
  if (sel.machine_dry === 'no')      s.push('건조기 사용은 금지되어 있어요.');
  else if (sel.machine_dry === 'ok_60') s.push('건조기를 60°C 이하로 사용할 수 있어요.');
  else if (sel.machine_dry === 'ok_80') s.push('건조기를 80°C 이하로 사용할 수 있어요.');

  // 자연건조
  if (sel.natural_dry === 'hang_sun')   s.push('옷걸이에 걸어 햇빛에서 자연건조해 주세요.');
  else if (sel.natural_dry === 'hang_shade') s.push('옷걸이에 걸어 그늘에서 자연건조해 주세요.');
  else if (sel.natural_dry === 'flat_sun')  s.push('평평하게 뉘어서 햇빛에서 건조해 주세요.');
  else if (sel.natural_dry === 'flat_shade') s.push('평평하게 뉘어서 그늘에서 건조해 주세요.');

  // 다림질
  if (sel.iron === 'no')    s.push('다림질은 하지 마세요.');
  else if (sel.iron === 'low')  s.push('저온(120°C 이하)으로만 다림질할 수 있어요.');
  else if (sel.iron === 'mid')  s.push('중온(160°C 이하)으로 다림질할 수 있어요.');
  else if (sel.iron === 'high') s.push('고온(210°C 이하)으로 다림질할 수 있어요.');

  // 드라이클리닝
  if (sel.dryclean === 'no')      s.push('드라이클리닝은 불가해요.');
  else if (sel.dryclean === 'ok')     s.push('드라이클리닝이 가능해요.');
  else if (sel.dryclean === 'gentle') s.push('드라이클리닝 시 약하게 처리해 달라고 요청해 주세요.');
  else if (sel.dryclean === 'special') s.push('특수 용제를 사용하는 전문 드라이클리닝이 필요해요.');

  // 탈수
  if (sel.squeeze === 'no')  s.push('탈수 또는 짜기는 하지 마세요.');
  else if (sel.squeeze === 'ok') s.push('약하게 탈수할 수 있어요.');

  return s.length
    ? s.join(' ')
    : `${name} 라벨 기호를 인식했어요. 아래 세탁 방법을 참고해 주세요.`;
}

function buildOcrSummary(ocr: OcrResult, name: string): string {
  const s: string[] = [];
  if (ocr.materials?.length)
    s.push(`이 ${name}의 소재는 ${ocr.materials.join(', ')}로 이루어져 있어요.`);
  if (ocr.care?.length)
    s.push(`세탁 방법: ${ocr.care.join(', ')}으로 관리해 주세요.`);
  if (ocr.prohibitions?.length)
    s.push(`주의하세요 — ${ocr.prohibitions.join(', ')}은(는) 하지 마세요.`);
  if (ocr.warning?.length)
    s.push(ocr.warning.join(' '));
  return s.length
    ? s.join(' ')
    : `${name} 세탁 라벨에서 관리 지침을 읽었어요. 라벨 원문을 꼭 확인해 주세요.`;
}

// ─── 수정 패널 카테고리 정의 ──────────────────────────────────────────────────
const CORRECTION_CATS: {
  key: keyof SymbolSel; label: string;
  options: { value: string; code: string; label: string }[];
}[] = [
  { key:'wash', label:'세탁 방법',
    options:[
      {value:'machine_30',  code:'wash_30',      label:'세탁기 30°C'},
      {value:'machine_40',  code:'wash_40',       label:'세탁기 40~50°C'},
      {value:'machine_60',  code:'wash_60',       label:'세탁기 60°C+'},
      {value:'hand_40',     code:'hand_40',       label:'손세탁 40°C'},
      {value:'hand_30',     code:'hand_30',       label:'손세탁 30°C'},
      {value:'hand_neutral',code:'hand_neutral',  label:'손세탁 중성세제'},
      {value:'no_wash',     code:'wash_no',       label:'물세탁 금지'},
    ],
  },
  { key:'bleach', label:'표백',
    options:[
      {value:'cl_ok',code:'bleach_cl_ok',label:'염소계 가능'},
      {value:'cl_no',code:'bleach_cl_no',label:'염소계 금지'},
      {value:'ox_ok',code:'bleach_ox_ok',label:'산소계 가능'},
      {value:'ox_no',code:'bleach_ox_no',label:'산소계 금지'},
    ],
  },
  { key:'machine_dry', label:'건조기',
    options:[
      {value:'ok_60',code:'machine_dry_60',label:'건조기 60°C'},
      {value:'ok_80',code:'machine_dry_80',label:'건조기 80°C'},
      {value:'no',   code:'machine_dry_no',label:'건조기 금지'},
    ],
  },
  { key:'natural_dry', label:'자연건조',
    options:[
      {value:'hang_sun',  code:'natural_hang_sun',  label:'옷걸이 햇빛'},
      {value:'hang_shade',code:'natural_hang_shade',label:'옷걸이 그늘'},
      {value:'flat_sun',  code:'natural_flat_sun',  label:'뉘어서 햇빛'},
      {value:'flat_shade',code:'natural_flat_shade',label:'뉘어서 그늘'},
    ],
  },
  { key:'iron', label:'다림질',
    options:[
      {value:'low', code:'iron_low', label:'저온 120°C'},
      {value:'mid', code:'iron_mid', label:'중온 160°C'},
      {value:'high',code:'iron_high',label:'고온 210°C'},
      {value:'no',  code:'iron_no',  label:'금지'},
    ],
  },
  { key:'dryclean', label:'드라이클리닝',
    options:[
      {value:'ok',     code:'dryclean_ok',     label:'일반'},
      {value:'gentle', code:'dryclean_gentle', label:'약하게'},
      {value:'special',code:'dryclean_special',label:'전문점'},
      {value:'no',     code:'dryclean_no',     label:'금지'},
    ],
  },
  { key:'squeeze', label:'탈수',
    options:[
      {value:'ok',code:'squeeze_ok',label:'가능'},
      {value:'no',code:'squeeze_no',label:'금지'},
    ],
  },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function ResultScreen() {
  const location = useLocation();
  const navigate  = useNavigate();
  const state: LocationState = location.state ?? {};

  const fromAnalysis   = state.fromAnalysis  ?? false;
  const readOnly       = state.readOnly      ?? false;
  const labelType      = state.labelType     ?? null;
  const capturedImage  = state.capturedImage ?? state.clothingPreview ?? null;
  const topCandidates: Candidate[] = state.topCandidates ?? [
    {cls:'knit',confidence:0.87},{cls:'T_shirt',confidence:0.74},
  ];

  const [selectedIdx,   setSelectedIdx]   = useState(0);
  const [showCorrection, setShowCorrection] = useState(false);
  const [symSel, setSymSel] = useState<SymbolSel>(() => {
    if (state.initialSymSel) return state.initialSymSel as SymbolSel;
    return yoloToSel(state.symbols ?? []);
  });

  // 카테고리 내 단일 선택 토글
  const toggleSel = (key: keyof SymbolSel, value: string) => {
    setSymSel(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const currentCls  = topCandidates[selectedIdx]?.cls ?? 'knit';
  const clothing    = CLOTHING[currentCls] ?? CLOTHING['knit'];
  const displayName = CLASS_KR[currentCls] ?? currentCls;
  const ocr         = state.ocrResult;
  const guideRows   = buildRows(symSel);

  const aiSummary =
    labelType === 'symbol'
      ? (state.modelSummary ?? buildSymbolSummary(symSel, displayName))
      : labelType === 'ocr'
      ? (state.modelSummary ?? buildOcrSummary(ocr ?? {}, displayName))
      : (state.modelSummary ?? clothing.summary);

  // 저장 시 요약 텍스트
  const saveSummary =
    labelType === 'symbol'
      ? guideRows.filter(r => !r.prohibited).map(r => r.label).join(' / ') || aiSummary
      : labelType === 'ocr'
        ? aiSummary
        : clothing.washMethod + ' / ' + clothing.dryMethod;

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* ── 헤더 ── */}
      <div className="bg-white px-6 pt-12 pb-5 flex items-center">
        <button onClick={() => readOnly ? navigate('/history') : navigate('/')} className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2}/>
        </button>
        <h1 className="text-[#1a2332] flex-1 text-center mr-8" style={{fontSize:'22px',fontWeight:700}}>
          {readOnly ? '세탁 기록 상세' : '맞춤 세탁 가이드'}
        </h1>
      </div>

      <div className="px-6 pt-5 pb-10 space-y-4">

        {/* ── 의류 카드 (사용자 촬영 이미지 / 기본 아이콘) ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {/* 썸네일 */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
              style={{background:`linear-gradient(135deg,${clothing.gradientFrom},${clothing.gradientTo})`}}>
              {capturedImage ? (
                <img src={capturedImage} alt="의류 사진" className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shirt size={30} color={clothing.iconColor} strokeWidth={1.5}/>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[#1a2332]" style={{fontSize:'20px',fontWeight:700}}>{displayName}</p>
              <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full"
                style={{background:'#e3f4fb',color:'#1a5f7a',fontSize:'11px',fontWeight:600}}>
                {labelType==='symbol' ? '🏷 라벨 기호 분석'
                  : labelType==='ocr'    ? '📝 주의 문구 분석'
                  : '📷 의류 사진 분석'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Top-2 후보 (의류만 모드, 분석 직후만) ── */}
        {!labelType && !readOnly && topCandidates.length >= 2 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1a2332]" style={{fontSize:'15px',fontWeight:700}}>의류가 맞나요?</h2>
            </div>
            <div className="flex gap-3">
              {topCandidates.slice(0,2).map((c,idx) => {
                const cg = CLOTHING[c.cls] ?? CLOTHING['knit'];
                return (
                  <button key={idx} onClick={()=>setSelectedIdx(idx)}
                    className="flex-1 rounded-2xl p-3 border-2 transition-all flex items-center gap-3"
                    style={{borderColor:selectedIdx===idx?'#87CEEB':'#e5e9ef',
                      background:selectedIdx===idx?'#f0f9ff':'white'}}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                      style={{background:`linear-gradient(135deg,${cg.gradientFrom},${cg.gradientTo})`}}>
                      {capturedImage ? (
                        <img src={capturedImage} alt="" className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt size={18} color={cg.iconColor} strokeWidth={1.5}/>
                        </div>
                      )}
                    </div>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#1a2332'}}>
                      {CLASS_KR[c.cls]??c.cls}
                    </p>
                    {selectedIdx===idx && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                        style={{background:'#87CEEB'}}>
                        <div className="w-2 h-2 bg-white rounded-full"/>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════ 모드 A: 세탁 기호 ════════════ */}
        {labelType === 'symbol' && (
          <>
            {/* 기호 가이드 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-[#1a2332] mb-4" style={{fontSize:'17px',fontWeight:700}}>세탁 방법</h2>
              {guideRows.length === 0 ? (
                <p className="text-[#8896a8]" style={{fontSize:'14px'}}>
                  인식된 기호가 없어요.{!readOnly && ' 아래에서 직접 선택해 주세요.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {guideRows.map((row,i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-[#f8fafb] rounded-xl flex items-center justify-center p-1.5">
                        <SymbolIcon code={row.code}/>
                      </div>
                      <div>
                        <p className="text-[#8896a8]" style={{fontSize:'11px',fontWeight:700}}>{row.category}</p>
                        <p style={{fontSize:'14px',fontWeight:500,color:row.prohibited?'#dc2626':'#1a2332'}}>
                          {row.prohibited && '🚫 '}{row.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 기호 수정 패널 — 조회 모드에서는 숨김 */}
            {!readOnly && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <button onClick={()=>setShowCorrection(v=>!v)}
                  className="w-full px-6 py-4 flex items-center justify-between">
                  <span style={{fontSize:'14px',fontWeight:600,color:'#1a2332'}}>
                    기호가 잘못 인식됐나요?
                  </span>
                  <span className="flex items-center gap-1 text-[#87CEEB]"
                    style={{fontSize:'13px',fontWeight:600}}>
                    직접 선택하기
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#87CEEB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {showCorrection
                        ? <polyline points="18 15 12 9 6 15"/>
                        : <polyline points="6 9 12 15 18 9"/>}
                    </svg>
                  </span>
                </button>

                {showCorrection && (
                  <div className="px-6 pb-6" style={{borderTop:'1px solid #f0f4f8'}}>
                    <p className="text-[#8896a8] mt-4 mb-5" style={{fontSize:'12px'}}>
                      항목 선택 시 같은 카테고리의 나머지 버튼은 비활성화됩니다.
                      선택된 항목의 🗑 아이콘 또는 버튼을 다시 누르면 선택이 해제됩니다.
                    </p>
                    {CORRECTION_CATS.map(cat => {
                      const catVal = symSel[cat.key];
                      const hasSelection = catVal !== null;
                      return (
                        <div key={cat.key} className="mb-6">
                          <p className="text-[#8896a8] mb-3"
                            style={{fontSize:'12px',fontWeight:700,letterSpacing:'0.4px'}}>
                            {cat.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cat.options.map(opt => {
                              const isActive   = catVal === opt.value;
                              const isDisabled = hasSelection && !isActive;
                              return (
                                <button key={opt.value}
                                  onClick={() => { if (!isDisabled) toggleSel(cat.key, opt.value); }}
                                  className="flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-xl border-2 transition-all"
                                  style={{
                                    borderColor: isActive ? '#87CEEB' : '#e5e9ef',
                                    background:  isActive ? '#f0f9ff' : isDisabled ? '#f5f7fa' : 'white',
                                    opacity:     isDisabled ? 0.4 : 1,
                                    cursor:      isDisabled ? 'not-allowed' : 'pointer',
                                  }}>
                                  <div className="w-8 h-8 flex-shrink-0">
                                    <SymbolIcon code={opt.code}/>
                                  </div>
                                  <span style={{
                                    fontSize:'12px',fontWeight:600,
                                    color: isActive ? '#1a5f7a' : isDisabled ? '#c0c8d4' : '#6b7688',
                                  }}>
                                    {opt.label}
                                  </span>
                                  {isActive && (
                                    <Trash2 size={13} color="#ef4444" strokeWidth={2.5}
                                      className="ml-1 flex-shrink-0"/>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════════ 모드 B: OCR ════════════ */}
        {labelType === 'ocr' && ocr && (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-[#1a2332] mb-4" style={{fontSize:'17px',fontWeight:700}}>세탁 방법</h2>
            <div className="space-y-4">
              {ocr.care && ocr.care.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#e3f4fb'}}>
                      <Droplet size={16} className="stroke-[#87CEEB]" strokeWidth={2}/>
                    </div>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#1a2332'}}>세탁 방법</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10">
                    {ocr.care.map((t,i)=>(
                      <span key={i} className="px-3 py-1.5 rounded-full"
                        style={{background:'#dbeafe',color:'#2563eb',fontSize:'13px',fontWeight:500}}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.prohibitions && ocr.prohibitions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#fee2e2'}}>
                      <AlertTriangle size={16} className="stroke-[#dc2626]" strokeWidth={2}/>
                    </div>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#1a2332'}}>금지 사항</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10">
                    {ocr.prohibitions.map((t,i)=>(
                      <span key={i} className="px-3 py-1.5 rounded-full"
                        style={{background:'#fee2e2',color:'#dc2626',fontSize:'13px',fontWeight:500}}>🚫 {t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.warning && ocr.warning.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#fef3c7'}}>
                      <Package size={16} className="stroke-[#d97706]" strokeWidth={2}/>
                    </div>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#1a2332'}}>주의 문구</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10">
                    {ocr.warning.map((t,i)=>(
                      <span key={i} className="px-3 py-1.5 rounded-full"
                        style={{background:'#fef3c7',color:'#d97706',fontSize:'13px',fontWeight:500}}>⚠️ {t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ocr.materials && ocr.materials.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#f3f4f6'}}>
                      <Wind size={16} className="stroke-[#6b7280]" strokeWidth={2}/>
                    </div>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#1a2332'}}>소재</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-10">
                    {ocr.materials.map((t,i)=>(
                      <span key={i} className="px-3 py-1.5 rounded-full"
                        style={{background:'#f3f4f6',color:'#374151',fontSize:'13px',fontWeight:500}}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ 모드 C: 의류 사진만 ════════════ */}
        {!labelType && (
          <>
            {!readOnly && (
              <div className="rounded-3xl p-4"
                style={{background:'linear-gradient(135deg,#e3f4fb,#d4f1e8)'}}>
                <p className="text-[#1a5f7a]" style={{fontSize:'13px',lineHeight:'1.6'}}>
                  💡 라벨 사진을 함께 추가하면 더 정확한 가이드를 드릴 수 있어요.
                </p>
              </div>
            )}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-[#1a2332] mb-5" style={{fontSize:'17px',fontWeight:700}}>세탁 방법</h2>
              <div className="space-y-4">
                {[
                  {icon:<Droplet size={20} className="stroke-[#87CEEB]" strokeWidth={2}/>,bg:'#e3f4fb',label:'세탁 방식',value:clothing.washMethod},
                  {icon:<Package size={20} className="stroke-[#87CEEB]" strokeWidth={2}/>,bg:'#e3f4fb',label:'권장 모드',value:clothing.washMode},
                  {icon:<Wind size={20} className="stroke-[#98D8C8]" strokeWidth={2}/>,bg:'#d4f1e8',label:'건조 방법',value:clothing.dryMethod},
                  {icon:<AlertTriangle size={20} className="stroke-[#ef4444]" strokeWidth={2}/>,bg:'#fee2e2',label:'주의 사항',value:clothing.caution},
                ].map((row,i)=>(
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{background:row.bg}}>
                      {row.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#1a2332] mb-0.5" style={{fontSize:'14px',fontWeight:600}}>{row.label}</p>
                      <p className="text-[#6b7688]" style={{fontSize:'13px'}}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── AI 분석 정보 ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} color="#87CEEB" strokeWidth={2}/>
            <h2 className="text-[#1a2332]" style={{fontSize:'17px',fontWeight:700}}>AI 분석 정보</h2>
          </div>
          <p className="text-[#4b5a6e]" style={{fontSize:'14px',lineHeight:'1.8'}}>{aiSummary}</p>
        </div>

        {/* ── 하단 버튼 — 조회 전용 모드에서는 숨김 ── */}
        {(fromAnalysis && !readOnly) && (
          <div className="flex gap-3 pt-1">
            <button onClick={()=>navigate('/camera')}
              className="flex-1 bg-gray-100 text-[#1a2332] rounded-2xl px-6 py-4 text-center"
              style={{fontSize:'15px',fontWeight:600}}>
              다시 촬영
            </button>
            <button
              onClick={() => {
                saveHistoryItem({
                  typeEn: currentCls,
                  typeKr: displayName,
                  summary: saveSummary,
                  tags: [], tagColors: [],
                  labelType,
                  capturedImage: capturedImage ?? undefined,
                  symSel: symSel as Record<string, string | null>,
                  ocrResult: ocr,
                });
                navigate('/history');
              }}
              className="flex-1 text-white rounded-2xl px-6 py-4 text-center"
              style={{fontSize:'15px',fontWeight:600,background:'#87CEEB',
                boxShadow:'0 4px 14px rgba(135,206,235,0.4)'}}>
              기록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}