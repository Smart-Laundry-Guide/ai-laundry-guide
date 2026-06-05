import { ArrowLeft, Shirt, Calendar, Filter, Trash2, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';

// ─── 타입 & 스토리지 ──────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string;
  typeEn: string;
  typeKr: string;
  summary: string;
  tags: string[];
  tagColors: string[];
  date: string; // ISO string
  // 기록 재조회용 추가 필드
  labelType?: 'symbol' | 'ocr' | null;
  capturedImage?: string;
  symSel?: Record<string, string | null>;
  ocrResult?: { care?: string[]; warning?: string[]; prohibitions?: string[]; materials?: string[] };
}

const STORAGE_KEY = 'laundry_history';

export function saveHistoryItem(item: Omit<HistoryEntry, 'id' | 'date'>) {
  const existing = loadHistory();
  const newItem: HistoryEntry = {
    ...item,
    id:   Date.now().toString(),
    date: new Date().toISOString(),
  };
  const updated = [newItem, ...existing].slice(0, 100);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function deleteHistoryItem(id: string) {
  const updated = loadHistory().filter(e => e.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const CLASS_FILTERS = [
  { label: '전체',   value: ''        },
  { label: '티셔츠', value: 'T_shirt' },
  { label: '셔츠',   value: 'shirt'   },
  { label: '바지',   value: 'pants'   },
  { label: '데님',   value: 'denim'   },
  { label: '니트',   value: 'knit'    },
];

const GRADIENT: Record<string, { from: string; to: string; icon: string }> = {
  T_shirt:  { from: '#d4f1e8', to: '#b8e8d4', icon: '#98D8C8' },
  shirt:    { from: '#f0f9ff', to: '#e0f2fe', icon: '#7dd3fc' },
  pants:    { from: '#f5f3ff', to: '#ede9fe', icon: '#a78bfa' },
  denim:    { from: '#eff6ff', to: '#dbeafe', icon: '#60a5fa' },
  knit:     { from: '#e3f4fb', to: '#c8e9f8', icon: '#87CEEB' },
  dress:    { from: '#fdf2f8', to: '#fce7f3', icon: '#f472b6' },
  skirt:    { from: '#fff7ed', to: '#ffedd5', icon: '#fb923c' },
  blouse:   { from: '#f0fdf4', to: '#dcfce7', icon: '#4ade80' },
  jacket:   { from: '#f8fafc', to: '#f1f5f9', icon: '#94a3b8' },
};
const DEFAULT_GRAD = { from: '#e3f4fb', to: '#c8e9f8', icon: '#87CEEB' };

function formatDate(iso: string) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7)  return `${diff}일 전`;
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function groupByMonth(items: HistoryEntry[]): { label: string; items: HistoryEntry[] }[] {
  const map = new Map<string, HistoryEntry[]>();
  items.forEach(item => {
    const d   = new Date(item.date);
    const key = `${d.getFullYear()}년 ${d.getMonth()+1}월`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// 분석 방식 뱃지 텍스트
function analysisBadge(labelType?: string | null) {
  if (labelType === 'symbol') return '라벨 기호';
  if (labelType === 'ocr')    return '주의 문구';
  return '의류 사진';
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function HistoryScreen() {
  const navigate = useNavigate();
  const [entries, setEntries]             = useState<HistoryEntry[]>([]);
  const [filter, setFilter]               = useState('');
  const [showCalendar, setShowCalendar]   = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => { setEntries(loadHistory()); }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭(상세 이동) 방지
    deleteHistoryItem(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // 기록 클릭 → ResultScreen Read-Only 모드로 이동
  const handleEntryClick = (entry: HistoryEntry) => {
    navigate('/result', {
      state: {
        readOnly:        true,
        labelType:       entry.labelType ?? null,
        capturedImage:   entry.capturedImage ?? null,
        topCandidates:   [{ cls: entry.typeEn, confidence: 1 }],
        initialSymSel:   entry.symSel ?? null,
        ocrResult:       entry.ocrResult ?? null,
        fromAnalysis:    false,
      },
    });
  };

  // 필터링
  let filtered = filter ? entries.filter(e => e.typeEn === filter) : entries;
  if (selectedMonth) {
    filtered = filtered.filter(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}년 ${d.getMonth()+1}월` === selectedMonth;
    });
  }
  const groups = groupByMonth(filtered);

  // 캘린더용 월 목록
  const allMonths = Array.from(
    new Set(entries.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
    }))
  );

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
          세탁 기록
        </h1>
      </div>

      {/* 통계 뱃지 */}
      <div className="px-6 pt-4 pb-3 flex items-center gap-3">
        <div className="flex-1 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #e3f4fb, #d4f1e8)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.6)' }}>
            <Shirt size={18} color="#87CEEB" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[#1a5f7a]" style={{ fontSize: '20px', fontWeight: 800 }}>
              {entries.length}
            </p>
            <p className="text-[#5a8fa0]" style={{ fontSize: '11px', fontWeight: 500 }}>
              총 세탁 기록
            </p>
          </div>
        </div>
        {/* 캘린더 버튼 */}
        <button
          onClick={() => setShowCalendar(v => !v)}
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all"
          style={{
            background: showCalendar ? '#87CEEB' : 'white',
            border: `1.5px solid ${showCalendar ? '#87CEEB' : '#e5e9ef'}`,
          }}>
          <Calendar size={18} color={showCalendar ? 'white' : '#6b7688'} strokeWidth={2} />
          <span style={{ fontSize: '10px', fontWeight: 600,
            color: showCalendar ? 'white' : '#6b7688' }}>월별</span>
        </button>
      </div>

      {/* 월별 캘린더 피커 */}
      {showCalendar && (
        <div className="mx-6 mb-3 rounded-2xl p-4"
          style={{ background: 'white', border: '1px solid #e5e9ef',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[#8896a8] mb-3" style={{ fontSize: '12px', fontWeight: 600 }}>
            월 선택
          </p>
          {allMonths.length === 0 ? (
            <p className="text-[#8896a8]" style={{ fontSize: '13px' }}>기록이 없어요</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedMonth(null)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: !selectedMonth ? '#87CEEB' : '#f0f4f8',
                  color: !selectedMonth ? 'white' : '#6b7688',
                  fontSize: '12px', fontWeight: 600,
                }}>전체</button>
              {allMonths.map(m => (
                <button key={m}
                  onClick={() => setSelectedMonth(prev => prev === m ? null : m)}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    background: selectedMonth === m ? '#87CEEB' : '#f0f4f8',
                    color: selectedMonth === m ? 'white' : '#6b7688',
                    fontSize: '12px', fontWeight: 600,
                  }}>{m}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 의류 종류 필터 */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={13} color="#8896a8" strokeWidth={2} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#8896a8' }}>
            의류 종류 필터
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CLASS_FILTERS.map(f => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0 px-3.5 py-2 rounded-full transition-all"
              style={{
                background: filter === f.value ? '#87CEEB' : 'white',
                color:      filter === f.value ? 'white'   : '#6b7688',
                border: `1.5px solid ${filter === f.value ? '#87CEEB' : '#e5e9ef'}`,
                fontSize: '12px', fontWeight: 600,
              }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="px-6 space-y-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: '#e3f4fb' }}>
              <Shirt size={36} color="#87CEEB" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-[#1a2332]" style={{ fontSize: '16px', fontWeight: 700 }}>
                {filter || selectedMonth ? '해당하는 기록이 없어요' : '아직 저장된 기록이 없어요'}
              </p>
              <p className="text-[#8896a8] mt-1" style={{ fontSize: '13px' }}>
                의류를 분석하고 결과를 저장해보세요!
              </p>
            </div>
            {!filter && !selectedMonth && (
              <Link to="/camera"
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: '#87CEEB', fontSize: '14px', fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(135,206,235,0.4)' }}>
                지금 분석하기
              </Link>
            )}
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              {/* 월 헤더 */}
              <div className="flex items-center gap-2 mb-3">
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#8896a8' }}>
                  {group.label}
                </p>
                <div className="flex-1 h-px" style={{ background: '#e5e9ef' }} />
                <span className="px-2 py-0.5 rounded-full"
                  style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '11px', fontWeight: 600 }}>
                  {group.items.length}건
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map(entry => {
                  const grad = GRADIENT[entry.typeEn] ?? DEFAULT_GRAD;
                  return (
                    <div key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className="bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-transform"
                      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.04)' }}>

                      {/* 썸네일: 촬영 이미지 or 기본 아이콘 */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
                        {entry.capturedImage ? (
                          <img src={entry.capturedImage} alt="의류"
                            className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt size={26} color={grad.icon} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>
                            {entry.typeKr}
                          </p>
                          <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: '#e3f4fb', color: '#1a5f7a',
                              fontSize: '10px', fontWeight: 700,
                            }}>
                            {analysisBadge(entry.labelType)}
                          </span>
                        </div>
                        <p className="text-[#6b7688] truncate"
                          style={{ fontSize: '12px', lineHeight: '1.5' }}>
                          {entry.summary}
                        </p>
                        <p className="text-[#adb5bd] mt-1" style={{ fontSize: '11px' }}>
                          {formatDate(entry.date)}
                        </p>
                      </div>

                      {/* 오른쪽: 삭제 + 이동 화살표 */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: '#fef2f2' }}>
                          <Trash2 size={13} color="#ef4444" strokeWidth={2} />
                        </button>
                        <ChevronRight size={16} color="#c0c8d4" strokeWidth={2}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
