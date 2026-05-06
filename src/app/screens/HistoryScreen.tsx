import { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X, Shirt, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

type PeriodFilter = 'all' | 'week' | 'month';
type ClothingFilter = '전체' | '티셔츠' | '셔츠' | '바지' | '데님' | '니트' | '원피스' | '치마' | '블라우스' | '자켓';

const clothingTypes: ClothingFilter[] = [
  '전체', '티셔츠', '셔츠', '바지', '데님', '니트', '원피스', '치마', '블라우스', '자켓'
];

// ─── localStorage 키 ──────────────────────────────────────────────────────────
export const HISTORY_KEY = 'laundry_history';

// ─── 저장 항목 타입 ────────────────────────────────────────────────────────────
export interface HistoryItem {
  id: string;
  typeEn: string;       // 영어 클래스명
  typeKr: string;       // 한국어 표시명
  riskLabel: string;    // 위험군
  summary: string;      // 요약 세탁 가이드
  date: string;         // 표시용 날짜
  savedAt: number;      // 정렬용 timestamp
  tags: string[];
  tagColors: string[];
}

// ─── 저장 유틸 (ResultScreen에서 import해서 사용) ─────────────────────────────
export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'savedAt' | 'date'>) {
  const existing: HistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  const now = Date.now();
  const d = new Date(now);
  const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;

  const newItem: HistoryItem = {
    ...item,
    id: String(now),
    savedAt: now,
    date: dateStr,
  };

  const updated = [newItem, ...existing].slice(0, 50); // 최대 50개 보관
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

// ─── 썸네일 색상 ───────────────────────────────────────────────────────────────
const thumbColors: Record<string, { from: string; to: string; icon: string }> = {
  니트:    { from: '#e3f4fb', to: '#c8e9f8', icon: '#87CEEB' },
  티셔츠:  { from: '#d4f1e8', to: '#b8e8d4', icon: '#98D8C8' },
  셔츠:    { from: '#f0fdf4', to: '#bbf7d0', icon: '#34d399' },
  바지:    { from: '#fdf4ff', to: '#e9d5ff', icon: '#a855f7' },
  데님:    { from: '#eff6ff', to: '#bfdbfe', icon: '#60a5fa' },
  원피스:  { from: '#fdf2f8', to: '#fce7f3', icon: '#f472b6' },
  치마:    { from: '#fff7ed', to: '#ffedd5', icon: '#fb923c' },
  블라우스:{ from: '#f0fdf4', to: '#dcfce7', icon: '#4ade80' },
  자켓:    { from: '#f8fafc', to: '#f1f5f9', icon: '#94a3b8' },
};

// ─── 위험군 뱃지 색상 ──────────────────────────────────────────────────────────
const riskBadge: Record<string, { color: string; bg: string }> = {
  '고위험군': { color: '#dc2626', bg: '#fee2e2' },
  '중위험군': { color: '#d97706', bg: '#fef3c7' },
  '저위험군': { color: '#16a34a', bg: '#dcfce7' },
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function HistoryScreen() {
  const [items, setItems]               = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showFilter, setShowFilter]     = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [clothingFilter, setClothingFilter] = useState<ClothingFilter>('전체');

  // localStorage에서 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  // 항목 삭제
  const deleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  // 전체 삭제
  const clearAll = () => {
    setItems([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // 필터 적용
  const now = Date.now();
  const filtered = items.filter((item) => {
    const matchSearch =
      searchQuery === '' ||
      item.typeKr.includes(searchQuery) ||
      item.summary.includes(searchQuery);

    const matchClothing =
      clothingFilter === '전체' || item.typeKr === clothingFilter;

    let matchPeriod = true;
    if (periodFilter === 'week')  matchPeriod = now - item.savedAt < 7 * 86400000;
    if (periodFilter === 'month') matchPeriod = now - item.savedAt < 30 * 86400000;

    return matchSearch && matchClothing && matchPeriod;
  });

  const activeFilterCount =
    (periodFilter !== 'all' ? 1 : 0) + (clothingFilter !== '전체' ? 1 : 0);

  const periodLabels: Record<PeriodFilter, string> = {
    all: '전체 기간', week: '최근 1주일', month: '이번 달',
  };

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: '24px' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
          </Link>
          <h1 className="text-[#1a2332]" style={{ fontSize: '22px', fontWeight: 700 }}>
            분석 기록
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}
          >
            <Trash2 size={14} strokeWidth={2} />
            전체 삭제
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="px-6 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[#8896a8]" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="옷 종류로 검색"
              className="w-full bg-[#f8fafb] border border-gray-200 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-[#87CEEB] focus:bg-white transition-all"
              style={{ fontSize: '14px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="stroke-[#8896a8]" strokeWidth={2} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="relative rounded-2xl px-4 py-3 flex items-center gap-2 transition-all"
            style={{
              background: showFilter || activeFilterCount > 0 ? '#87CEEB' : '#f0f4f8',
              color:      showFilter || activeFilterCount > 0 ? 'white' : '#6b7688',
              minWidth: '80px',
            }}
          >
            <SlidersHorizontal size={17} strokeWidth={2} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>필터</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: '#ef4444', fontSize: '10px', fontWeight: 700 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="mt-3 rounded-2xl p-4 space-y-4" style={{ background: '#f8fafb', border: '1.5px solid #e3f4fb' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8896a8', marginBottom: '8px' }}>기간</p>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'week', 'month'] as PeriodFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className="px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: periodFilter === p ? '#87CEEB' : 'white',
                      color:      periodFilter === p ? 'white' : '#6b7688',
                      fontSize: '13px', fontWeight: 600,
                      border: `1.5px solid ${periodFilter === p ? '#87CEEB' : '#e5e9ef'}`,
                    }}
                  >{periodLabels[p]}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8896a8', marginBottom: '8px' }}>의류 종류</p>
              <div className="flex gap-2 flex-wrap">
                {clothingTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setClothingFilter(t)}
                    className="px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: clothingFilter === t ? '#87CEEB' : 'white',
                      color:      clothingFilter === t ? 'white' : '#6b7688',
                      fontSize: '13px', fontWeight: 600,
                      border: `1.5px solid ${clothingFilter === t ? '#87CEEB' : '#e5e9ef'}`,
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setPeriodFilter('all'); setClothingFilter('전체'); }}
                className="text-[#87CEEB] flex items-center gap-1"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <X size={14} strokeWidth={2.5} /> 필터 초기화
              </button>
            )}
          </div>
        )}

        {!showFilter && activeFilterCount > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {periodFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '12px', fontWeight: 600 }}>
                {periodLabels[periodFilter]}
                <button onClick={() => setPeriodFilter('all')}><X size={12} strokeWidth={2.5} /></button>
              </span>
            )}
            {clothingFilter !== '전체' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: '#e3f4fb', color: '#1a5f7a', fontSize: '12px', fontWeight: 600 }}>
                {clothingFilter}
                <button onClick={() => setClothingFilter('전체')}><X size={12} strokeWidth={2.5} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="px-6 mb-3">
        <p style={{ fontSize: '13px', color: '#8896a8', fontWeight: 500 }}>
          총 {filtered.length}개의 기록
        </p>
      </div>

      {/* History List */}
      <div className="px-6 space-y-3">
        {filtered.map((item) => {
          const thumb = thumbColors[item.typeKr] ?? { from: '#e3f4fb', to: '#d4f1e8', icon: '#87CEEB' };
          const risk  = riskBadge[item.riskLabel] ?? riskBadge['중위험군'];
          return (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all hover:shadow-md"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)', background: 'white' }}
            >
              <Link to="/result" className="flex gap-0 block">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '76px', background: `linear-gradient(160deg, ${thumb.from}, ${thumb.to})` }}
                >
                  <Shirt size={30} color={thumb.icon} strokeWidth={1.5} />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#1a2332]" style={{ fontSize: '16px', fontWeight: 700 }}>
                        {item.typeKr}
                      </h3>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: risk.bg, color: risk.color, fontSize: '10px', fontWeight: 700 }}
                      >
                        {item.riskLabel}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#adb5bd' }}>{item.date}</span>
                  </div>
                  <p className="text-[#6b7688] mb-2" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {item.summary}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag, ti) => (
                        <span key={ti} className={`px-2 py-0.5 rounded-full ${item.tagColors[ti]}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              {/* 개별 삭제 버튼 */}
              <div className="px-4 pb-3 flex justify-end">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex items-center gap-1 text-[#adb5bd]"
                  style={{ fontSize: '12px' }}
                >
                  <Trash2 size={13} strokeWidth={2} /> 삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 pt-16">
          <div className="w-20 h-20 bg-[#f8fafb] rounded-full flex items-center justify-center mb-4">
            <Shirt size={36} className="stroke-[#cbd5e1]" strokeWidth={1.5} />
          </div>
          <p className="text-[#8896a8] text-center mb-1" style={{ fontSize: '15px' }}>
            {items.length === 0 ? '아직 분석 기록이 없어요' : '조건에 맞는 기록이 없어요'}
          </p>
          {items.length === 0 ? (
            <Link to="/camera" className="text-[#87CEEB] mt-2" style={{ fontSize: '14px', fontWeight: 600 }}>
              첫 분석 시작하기
            </Link>
          ) : (
            <button
              onClick={() => { setSearchQuery(''); setPeriodFilter('all'); setClothingFilter('전체'); }}
              className="text-[#87CEEB]"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
