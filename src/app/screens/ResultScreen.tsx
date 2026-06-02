import { ArrowLeft, Droplet, Wind, AlertTriangle, Package, Shirt, Trash2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { saveHistoryItem } from './HistoryScreen';
import { SymbolIcon, MachineWashIcon, HandWashIcon } from '../components/LaundrySymbols';

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface Candidate { cls: string; confidence: number; }
interface OcrResult {
  care?: string[]; warning?: string[]; prohibitions?: string[]; materials?: string[];
}
interface SymbolResult { cls: string; confidence: number; }
interface LocationState {
  fromAnalysis?: boolean;
  labelType?: 'symbol' | 'ocr' | null;
  topCandidates?: Candidate[];
  lowConfidence?: boolean;
  ocrResult?: OcrResult;
  symbols?: SymbolResult[];
  capturedImage?: string;
  clothingPreview?: string;
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
type WashSel =
  | 'm30gn' | 'm30vg' | 'm30g'
  | 'm60g'  | 'm50g'  | 'm40vg' | 'm40g'
  | 'm95' | 'm70' | 'm60' | 'm50' | 'm40' | 'm30'
  | 'h40gn' | 'h30gn' | 'h40n' | 'h30n'
  | 'h40g'  | 'h30g'  | 'h40'  | 'h30'
  | 'no_wash' | null;
type BleachSel   = 'cl_ok'|'cl_no'|'ox_ok'|'ox_no'|null;
type MachineDry  = 'ok_60'|'ok_80'|'no'|null;
type NaturalDry  = 'hang_sun'|'hang_shade'|'flat_sun'|'flat_shade'|null;
type IronSel     = 'low'|'mid'|'high'|'no'|null;
type DryCleanSel = 'ok'|'petroleum'|'silicone'|'special'|'no'|null;
type SqueezeSel  = 'ok'|'no'|null;
interface SymbolSel {
  wash: WashSel; bleach: BleachSel; machine_dry: MachineDry;
  natural_dry: NaturalDry; iron: IronSel; dryclean: DryCleanSel; squeeze: SqueezeSel;
}

function yoloToSel(yolo: SymbolResult[]): SymbolSel {
  const s = new Set(yolo.map(x => x.cls));
  return {
    wash:        s.has('no_wash')      ? 'no_wash'
                :s.has('hand_wash')    ? 'h30'
                :s.has('machine_wash') ? 'm40' : null,
    bleach:      s.has('no_bleach') ? 'cl_no' : s.has('bleach') ? 'cl_ok' : null,
    machine_dry: s.has('no_tumble_dry') ? 'no' : s.has('tumble_dry') ? 'ok_60' : null,
    natural_dry: s.has('natural_dry') ? 'hang_shade' : null,
    iron:        s.has('no_iron') ? 'no' : s.has('iron') ? 'mid' : null,
    dryclean:    s.has('no_dry_clean') ? 'no' : s.has('dry_clean') ? 'ok' : null,
    squeeze:     s.has('no_squeeze') ? 'no' : s.has('squeeze') ? 'ok' : null,
  };
}

// ─── 가이드 행 생성 ────────────────────────────────────────────────────────────
interface GuideRow {
  category: string; code: string; label: string; prohibited: boolean;
  washType?: 'machine' | 'hand'; temp?: number; gentle?: boolean; veryGentle?: boolean; neutral?: boolean;
}

function buildRows(sel: SymbolSel): GuideRow[] {
  const rows: GuideRow[] = [];
  type WashEntry = { code: string; label: string; prohibited: boolean; washType?: 'machine'|'hand'; temp?: number; gentle?: boolean; veryGentle?: boolean; neutral?: boolean };
  const washMap: Record<string, WashEntry> = {
    m30gn: { code:'', label:'세탁기 세탁 (30°C, 약하게, 중성세제)', prohibited:false, washType:'machine', temp:30, gentle:true,     neutral:true  },
    m30vg: { code:'', label:'세탁기 세탁 (30°C, 매우 약하게)',       prohibited:false, washType:'machine', temp:30, veryGentle:true                },
    m30g:  { code:'', label:'세탁기 세탁 (30°C, 약하게)',            prohibited:false, washType:'machine', temp:30, gentle:true                    },
    m60g:  { code:'', label:'세탁기 세탁 (60°C, 약하게)',            prohibited:false, washType:'machine', temp:60, gentle:true                    },
    m50g:  { code:'', label:'세탁기 세탁 (50°C, 약하게)',            prohibited:false, washType:'machine', temp:50, gentle:true                    },
    m40vg: { code:'', label:'세탁기 세탁 (40°C, 매우 약하게)',       prohibited:false, washType:'machine', temp:40, veryGentle:true                },
    m40g:  { code:'', label:'세탁기 세탁 (40°C, 약하게)',            prohibited:false, washType:'machine', temp:40, gentle:true                    },
    m95:   { code:'', label:'세탁기 세탁 (95°C)',                    prohibited:false, washType:'machine', temp:95  },
    m70:   { code:'', label:'세탁기 세탁 (70°C)',                    prohibited:false, washType:'machine', temp:70  },
    m60:   { code:'', label:'세탁기 세탁 (60°C)',                    prohibited:false, washType:'machine', temp:60  },
    m50:   { code:'', label:'세탁기 세탁 (50°C)',                    prohibited:false, washType:'machine', temp:50  },
    m40:   { code:'', label:'세탁기 세탁 (40°C)',                    prohibited:false, washType:'machine', temp:40  },
    m30:   { code:'', label:'세탁기 세탁 (30°C)',                    prohibited:false, washType:'machine', temp:30  },
    h40gn: { code:'', label:'손세탁 (40°C, 약하게, 중성세제)',       prohibited:false, washType:'hand', temp:40, gentle:true, neutral:true },
    h30gn: { code:'', label:'손세탁 (30°C, 약하게, 중성세제)',       prohibited:false, washType:'hand', temp:30, gentle:true, neutral:true },
    h40n:  { code:'', label:'손세탁 (40°C, 중성세제)',               prohibited:false, washType:'hand', temp:40, neutral:true               },
    h30n:  { code:'', label:'손세탁 (30°C, 중성세제)',               prohibited:false, washType:'hand', temp:30, neutral:true               },
    h40g:  { code:'', label:'손세탁 (40°C, 약하게)',                 prohibited:false, washType:'hand', temp:40, gentle:true                },
    h30g:  { code:'', label:'손세탁 (30°C, 약하게)',                 prohibited:false, washType:'hand', temp:30, gentle:true                },
    h40:   { code:'', label:'손세탁 (40°C)',                         prohibited:false, washType:'hand', temp:40 },
    h30:   { code:'', label:'손세탁 (30°C)',                         prohibited:false, washType:'hand', temp:30 },
    no_wash:{ code:'wash_no', label:'물세탁 금지', prohibited:true },
  };
  if (sel.wash && washMap[sel.wash]) {
    const w = washMap[sel.wash];
    rows.push({ category:'세탁', code:w.code, label:w.label, prohibited:w.prohibited,
      washType:w.washType, temp:w.temp, gentle:w.gentle, veryGentle:w.veryGentle, neutral:w.neutral });
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
    ok:       {code:'dryclean_ok',        label:'드라이클리닝 가능',  prohibited:false},
    petroleum:{code:'dryclean_petroleum', label:'석유계 드라이클리닝',prohibited:false},
    silicone: {code:'dryclean_silicone',  label:'실리콘계 드라이클리닝',prohibited:false},
    special:  {code:'dryclean_special',   label:'전문점 드라이클리닝',prohibited:false},
    no:       {code:'dryclean_no',        label:'드라이클리닝 금지',  prohibited:true},
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
  const sentences: string[] = [];

  // ── 세탁 ──────────────────────────────────────────────────────────────────
  if (sel.wash === 'no_wash') {
    sentences.push(`${name}은(는) 물세탁이 불가능해요. 반드시 드라이클리닝을 이용해 주세요.`);
  } else if (sel.wash) {
    const washPhrase: Record<string, string> = {
      m30gn: '30°C 이하 찬물에 중성세제를 사용해 약한 수류로 세탁기 세탁하세요',
      m30vg: '30°C 이하 찬물에서 매우 약한 수류(세탁망 권장)로 세탁기 세탁하세요',
      m30g:  '30°C 이하 찬물에서 약한 수류로 세탁기 세탁이 가능해요',
      m60g:  '60°C에서 약한 수류로 세탁기 세탁이 가능해요',
      m50g:  '50°C에서 약한 수류로 세탁기 세탁이 가능해요',
      m40vg: '40°C 이하에서 매우 약한 수류(울 코스)로 세탁기 세탁이 가능해요',
      m40g:  '40°C 이하에서 약한 수류(섬세 코스)로 세탁기 세탁이 가능해요',
      m95:   '95°C 고온으로 세탁기 세탁이 가능해요. 흰 면 소재에 적합해요',
      m70:   '70°C 뜨거운 물로 세탁기 세탁이 가능해요',
      m60:   '60°C 뜨거운 물로 세탁기 세탁이 가능해요',
      m50:   '50°C 미온수로 세탁기 세탁이 가능해요',
      m40:   '40°C 이하 미온수로 세탁기 세탁이 가능해요',
      m30:   '30°C 이하 찬물로 세탁기 세탁이 가능해요',
      h40gn: '40°C 이하 미온수에 중성세제를 사용해 약하게 손세탁해 주세요',
      h30gn: '30°C 이하 찬물에 중성세제를 사용해 약하게 손세탁해 주세요',
      h40n:  '40°C 이하 미온수에 중성세제로 손세탁해 주세요',
      h30n:  '30°C 이하 찬물에 중성세제로 손세탁해 주세요',
      h40g:  '40°C 이하 미온수에서 약하게 손세탁해 주세요',
      h30g:  '30°C 이하 찬물에서 약하게 손세탁해 주세요',
      h40:   '40°C 이하 미온수로 손세탁해 주세요',
      h30:   '30°C 이하 찬물로 손세탁해 주세요',
    };

    const isHand = sel.wash.startsWith('h');
    let ws = washPhrase[sel.wash] ?? '';

    // 손세탁이면 세탁기 금지 문구를 자연스럽게 이어 붙임
    if (isHand) ws += '. 세탁기 사용은 피해 주세요';

    // 표백 정보를 세탁 문장에 이어 붙여 한 문단으로 묶음
    if (sel.bleach === 'cl_no' || sel.bleach === 'ox_no') {
      ws += '. 표백제는 사용하지 마세요';
    } else if (sel.bleach === 'ox_ok') {
      ws += '. 산소계 표백제는 사용 가능해요';
    } else if (sel.bleach === 'cl_ok') {
      ws += '. 염소계 표백제도 사용 가능해요';
    }

    if (ws) sentences.push(ws + '.');
  }

  // 세탁 정보 없이 표백 정보만 있을 경우
  if (!sel.wash) {
    if (sel.bleach === 'cl_no' || sel.bleach === 'ox_no') sentences.push('표백제는 사용하지 마세요.');
    else if (sel.bleach === 'ox_ok') sentences.push('산소계 표백제는 사용 가능해요.');
    else if (sel.bleach === 'cl_ok') sentences.push('염소계 표백제도 사용 가능해요.');
  }

  // ── 건조 (machine_dry + natural_dry 한 문장으로 묶기) ─────────────────────
  const natPhrase: Record<string, string> = {
    hang_sun:   '옷걸이에 걸어 햇빛에서 자연건조해 주세요',
    hang_shade: '옷걸이에 걸어 그늘에서 자연건조해 주세요',
    flat_sun:   '평평하게 뉘어 햇빛에서 건조해 주세요',
    flat_shade: '평평하게 뉘어 그늘에서 건조해 주세요',
  };
  const nat = sel.natural_dry ? natPhrase[sel.natural_dry] : '';

  if (sel.machine_dry === 'no' && nat) {
    sentences.push(`건조기 사용은 금지되어 있어요. ${nat}.`);
  } else if (sel.machine_dry === 'no') {
    sentences.push('건조기 사용은 금지되어 있어요.');
  } else if (sel.machine_dry === 'ok_60' && nat) {
    sentences.push(`건조기를 60°C 이하로 사용하거나, ${nat}.`);
  } else if (sel.machine_dry === 'ok_80' && nat) {
    sentences.push(`건조기를 80°C 이하로 사용하거나, ${nat}.`);
  } else if (sel.machine_dry === 'ok_60') {
    sentences.push('건조기를 60°C 이하로 사용할 수 있어요.');
  } else if (sel.machine_dry === 'ok_80') {
    sentences.push('건조기를 80°C 이하로 사용할 수 있어요.');
  } else if (nat) {
    sentences.push(nat + '.');
  }

  // ── 다림질 ────────────────────────────────────────────────────────────────
  if (sel.iron === 'no')        sentences.push('다림질은 하지 마세요.');
  else if (sel.iron === 'low')  sentences.push('다림질이 필요하다면 저온(120°C 이하)으로만 해 주세요.');
  else if (sel.iron === 'mid')  sentences.push('중온(160°C 이하)으로 다림질할 수 있어요.');
  else if (sel.iron === 'high') sentences.push('고온(210°C 이하)으로 다림질 가능해요.');

  // ── 드라이클리닝 ──────────────────────────────────────────────────────────
  if (sel.dryclean === 'no')             sentences.push('드라이클리닝은 불가해요.');
  else if (sel.dryclean === 'ok')        sentences.push('드라이클리닝도 가능해요.');
  else if (sel.dryclean === 'petroleum') sentences.push('드라이클리닝 시 세탁소에 석유계 용제 처리를 요청하세요.');
  else if (sel.dryclean === 'silicone')  sentences.push('드라이클리닝 시 세탁소에 실리콘계 용제 처리를 요청하세요.');
  else if (sel.dryclean === 'special')   sentences.push('특수 소재 전문점에서만 드라이클리닝이 가능해요.');

  // ── 탈수 ─────────────────────────────────────────────────────────────────
  if (sel.squeeze === 'no')      sentences.push('세탁 후 탈수나 짜기는 하지 마세요.');
  else if (sel.squeeze === 'ok') sentences.push('약하게 탈수할 수 있어요.');

  return sentences.length
    ? sentences.join(' ')
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
  options: {
    value: string; code: string; label: string;
    group?: string;
    washType?: 'machine' | 'hand';
    temp?: number;
    gentle?: boolean;
    veryGentle?: boolean;
    neutral?: boolean;
  }[];
}[] = [
  { key:'wash', label:'세탁 방법',
    options:[
      { group:'일반세탁', value:'m30gn', code:'', label:'세탁기 30°C · 약 · 중성',  washType:'machine', temp:30, gentle:true,     neutral:true },
      { group:'일반세탁', value:'m30vg', code:'', label:'세탁기 30°C · 매우 약하게', washType:'machine', temp:30, veryGentle:true               },
      { group:'일반세탁', value:'m30g',  code:'', label:'세탁기 30°C · 약하게',      washType:'machine', temp:30, gentle:true                   },
      { group:'일반세탁', value:'m60g',  code:'', label:'세탁기 60°C · 약하게',      washType:'machine', temp:60, gentle:true                   },
      { group:'일반세탁', value:'m50g',  code:'', label:'세탁기 50°C · 약하게',      washType:'machine', temp:50, gentle:true                   },
      { group:'일반세탁', value:'m40vg', code:'', label:'세탁기 40°C · 매우 약하게', washType:'machine', temp:40, veryGentle:true               },
      { group:'일반세탁', value:'m40g',  code:'', label:'세탁기 40°C · 약하게',      washType:'machine', temp:40, gentle:true                   },
      { group:'일반세탁', value:'m95',   code:'', label:'세탁기 95°C',               washType:'machine', temp:95  },
      { group:'일반세탁', value:'m70',   code:'', label:'세탁기 70°C',               washType:'machine', temp:70  },
      { group:'일반세탁', value:'m60',   code:'', label:'세탁기 60°C',               washType:'machine', temp:60  },
      { group:'일반세탁', value:'m50',   code:'', label:'세탁기 50°C',               washType:'machine', temp:50  },
      { group:'일반세탁', value:'m40',   code:'', label:'세탁기 40°C',               washType:'machine', temp:40  },
      { group:'일반세탁', value:'m30',   code:'', label:'세탁기 30°C',               washType:'machine', temp:30  },
      { group:'손세탁', value:'h40gn', code:'', label:'손세탁 40°C · 약 · 중성',  washType:'hand', temp:40, gentle:true, neutral:true },
      { group:'손세탁', value:'h30gn', code:'', label:'손세탁 30°C · 약 · 중성',  washType:'hand', temp:30, gentle:true, neutral:true },
      { group:'손세탁', value:'h40n',  code:'', label:'손세탁 40°C · 중성',       washType:'hand', temp:40, neutral:true               },
      { group:'손세탁', value:'h30n',  code:'', label:'손세탁 30°C · 중성',       washType:'hand', temp:30, neutral:true               },
      { group:'손세탁', value:'h40g',  code:'', label:'손세탁 40°C · 약하게',     washType:'hand', temp:40, gentle:true                },
      { group:'손세탁', value:'h30g',  code:'', label:'손세탁 30°C · 약하게',     washType:'hand', temp:30, gentle:true                },
      { group:'손세탁', value:'h40',   code:'', label:'손세탁 40°C',              washType:'hand', temp:40 },
      { group:'손세탁', value:'h30',   code:'', label:'손세탁 30°C',              washType:'hand', temp:30 },
      { group:'금지', value:'no_wash', code:'wash_no', label:'물세탁 금지' },
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
      {value:'ok',        code:'dryclean_ok',        label:'가능'},
      {value:'petroleum', code:'dryclean_petroleum',  label:'석유계'},
      {value:'silicone',  code:'dryclean_silicone',   label:'실리콘계'},
      {value:'special',   code:'dryclean_special',    label:'전문점'},
      {value:'no',        code:'dryclean_no',         label:'금지'},
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

  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [showCorrection, setShowCorrection] = useState(false);
  const [openCats,       setOpenCats]       = useState<Set<string>>(new Set());
  const toggleCat = (key: string) =>
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const [openWashGroups, setOpenWashGroups] = useState<Set<string>>(new Set());
  const toggleWashGroup = (g: string) =>
    setOpenWashGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  const [symSel, setSymSel] = useState<SymbolSel>(() => {
    if (state.initialSymSel) return state.initialSymSel as unknown as SymbolSel;
    return yoloToSel(state.symbols ?? []);
  });

  const toggleSel = (key: keyof SymbolSel, value: string) => {
    setSymSel(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const currentCls  = topCandidates[selectedIdx]?.cls ?? 'knit';
  const clothing    = CLOTHING[currentCls] ?? CLOTHING['knit'];
  const displayName = CLASS_KR[currentCls] ?? currentCls;
  const ocr         = state.ocrResult;
  const guideRows   = buildRows(symSel);

  // OCR 결과가 없거나 모든 항목이 비어 있으면 실패로 간주
  const ocrFailed = labelType === 'ocr' && (
    !ocr ||
    (!ocr.care?.length && !ocr.warning?.length && !ocr.prohibitions?.length && !ocr.materials?.length)
  );

  const aiSummary =
    labelType === 'symbol'
      ? buildSymbolSummary(symSel, displayName)
      : (labelType === 'ocr' && !ocrFailed)
      ? buildOcrSummary(ocr ?? {}, displayName)
      : clothing.summary;

  const saveSummary =
    labelType === 'symbol'
      ? guideRows.filter(r => !r.prohibited).map(r => r.label).join(' / ') || aiSummary
      : aiSummary;

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

        {/* ── 의류 카드 ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
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
                {labelType==='symbol' ? '라벨 기호 분석'
                  : labelType==='ocr' && !ocrFailed ? '주의 문구 분석'
                  : labelType==='ocr' && ocrFailed  ? '의류 사진 분석 (대체)'
                  : '의류 사진 분석'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Top-2 후보 ── */}
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
                      <div className="flex-shrink-0 bg-[#f8fafb] rounded-xl flex items-center justify-center p-1.5"
                        style={{ width:'48px', height: row.washType ? '56px' : '48px' }}>
                        {row.washType === 'machine' ? (
                          <MachineWashIcon temp={row.temp!} gentle={row.gentle} veryGentle={row.veryGentle} neutral={row.neutral} className="w-full h-full"/>
                        ) : row.washType === 'hand' ? (
                          <HandWashIcon temp={row.temp!} gentle={row.gentle} veryGentle={row.veryGentle} neutral={row.neutral} className="w-full h-full"/>
                        ) : (
                          <SymbolIcon code={row.code}/>
                        )}
                      </div>
                      <div className="flex-1">
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

            {/* 기호 수정 패널 */}
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
                      const isOpen = openCats.has(cat.key);
                      return (
                        <div key={cat.key} className="mb-6">
                          <button
                            onClick={() => toggleCat(cat.key)}
                            className="w-full flex items-center justify-between mb-3">
                            <span className="text-[#8896a8]"
                              style={{
                                fontSize:'12px', fontWeight:700, letterSpacing:'0.4px',
                                color: isOpen ? '#87CEEB' : undefined,
                              }}>
                              {cat.label}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke={isOpen ? '#87CEEB' : '#8896a8'} strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round">
                              {isOpen
                                ? <polyline points="18 15 12 9 6 15"/>
                                : <polyline points="6 9 12 15 18 9"/>}
                            </svg>
                          </button>
                          {isOpen && (
                            <div>
                              {cat.key === 'wash' ? (
                                (['일반세탁', '손세탁', '금지'] as const).map(groupName => {
                                  const groupOpts = cat.options.filter(o => o.group === groupName);
                                  if (!groupOpts.length) return null;
                                  const isGroupOpen = openWashGroups.has(groupName);
                                  const noToggle = groupName === '금지';
                                  return (
                                    <div key={groupName} className="mb-3">
                                      {noToggle ? (
                                        <p className="mb-2"
                                          style={{fontSize:'11px',fontWeight:700,color:'#87CEEB'}}>
                                          {groupName}
                                        </p>
                                      ) : (
                                        <button
                                          onClick={() => toggleWashGroup(groupName)}
                                          className="w-full flex items-center justify-between mb-2 py-1">
                                          <span style={{fontSize:'11px',fontWeight:700,
                                            color: isGroupOpen ? '#87CEEB' : '#8896a8'}}>
                                            {groupName}
                                          </span>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                            stroke={isGroupOpen ? '#87CEEB' : '#8896a8'}
                                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            {isGroupOpen
                                              ? <polyline points="18 15 12 9 6 15"/>
                                              : <polyline points="6 9 12 15 18 9"/>}
                                          </svg>
                                        </button>
                                      )}
                                      {(noToggle || isGroupOpen) && (
                                        <div className="flex flex-wrap gap-2">
                                          {groupOpts.map(opt => {
                                            const isActive   = catVal === opt.value;
                                            const isDisabled = hasSelection && !isActive;
                                            const iconH = opt.washType ? '40px' : '32px';
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
                                                <div className="flex-shrink-0" style={{width:'32px', height:iconH}}>
                                                  {opt.washType === 'machine' ? (
                                                    <MachineWashIcon temp={opt.temp!} gentle={opt.gentle} veryGentle={opt.veryGentle} neutral={opt.neutral} className="w-full h-full"/>
                                                  ) : opt.washType === 'hand' ? (
                                                    <HandWashIcon temp={opt.temp!} gentle={opt.gentle} veryGentle={opt.veryGentle} neutral={opt.neutral} className="w-full h-full"/>
                                                  ) : (
                                                    <SymbolIcon code={opt.code}/>
                                                  )}
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
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
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
                                        <div className="flex-shrink-0" style={{width:'32px',height:'32px'}}>
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
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════════ 모드 B-1: OCR 실패 → 의류 사진 분석으로 대체 ════════════ */}
        {ocrFailed && (
          <>
            <div className="rounded-3xl p-4"
              style={{background:'linear-gradient(135deg,#fef3c7,#fde68a)'}}>
              <p className="text-[#92400e]" style={{fontSize:'13px',lineHeight:'1.6'}}>
                ⚠️ 주의 문구 인식에 실패했어요. 의류 사진 분석 결과로 대체합니다.
              </p>
            </div>
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

        {/* ════════════ 모드 B-2: OCR 성공 ════════════ */}
        {labelType === 'ocr' && ocr && !ocrFailed && (
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
        {!labelType && !ocrFailed && (
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

        {/* ── 하단 버튼 ── */}
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
                  symSel: symSel as unknown as Record<string, string | null>,
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
