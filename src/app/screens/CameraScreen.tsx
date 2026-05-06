import {
  ArrowLeft, Camera, FileText, Lightbulb, CheckCircle2,
  Tag, ScanLine, ImageIcon, Images
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useState, useRef } from 'react';

export function CameraScreen() {
  const navigate = useNavigate();

  // 의류 이미지
  const [clothingFile, setClothingFile]       = useState<File | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);

  // 라벨 추가 정보
  const [labelType, setLabelType]     = useState<'symbol' | 'ocr' | null>(null);
  const [labelFile, setLabelFile]     = useState<File | null>(null);
  const [labelPreview, setLabelPreview] = useState<string | null>(null);

  // 파일 input refs
  const clothingCameraRef  = useRef<HTMLInputElement>(null);  // 카메라 촬영
  const clothingGalleryRef = useRef<HTMLInputElement>(null);  // 갤러리 선택
  const labelCameraRef     = useRef<HTMLInputElement>(null);
  const labelGalleryRef    = useRef<HTMLInputElement>(null);

  // ── 파일 선택 핸들러 ──────────────────────────────────────────────
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'clothing' | 'label'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (target === 'clothing') {
      setClothingFile(file);
      setClothingPreview(url);
    } else {
      setLabelFile(file);
      setLabelPreview(url);
    }
    // input 초기화 (같은 파일 재선택 허용)
    e.target.value = '';
  };

  const handleLabelTypeSelect = (type: 'symbol' | 'ocr') => {
    if (labelType === type) {
      setLabelType(null);
      setLabelFile(null);
      setLabelPreview(null);
    } else {
      setLabelType(type);
      setLabelFile(null);
      setLabelPreview(null);
    }
  };

  const clearClothing = () => {
    setClothingFile(null);
    setClothingPreview(null);
  };

  const clearLabel = () => {
    setLabelFile(null);
    setLabelPreview(null);
  };

  // ── 분석 시작 ────────────────────────────────────────────────────
  const handleAnalyze = () => {
    if (!clothingFile) return;
    navigate('/loading', {
      state: {
        clothingFile:   clothingFile.name,   // 실제 연동 시 FormData로 전송
        labelType:      labelFile ? labelType : null,
        hasLabel:       !!labelFile,
      },
    });
  };

  const clothingUploaded = !!clothingFile;
  const labelUploaded    = !!labelFile;
  const isSymbolDisabled = labelType === 'ocr' && labelUploaded;
  const isOcrDisabled    = labelType === 'symbol' && labelUploaded;

  const getButtonLabel = () => {
    if (!clothingUploaded) return '의류 사진을 먼저 업로드하세요';
    if (labelUploaded) {
      if (labelType === 'symbol') return '라벨 포함 정밀 분석 시작';
      if (labelType === 'ocr')    return '문구 인식 분석 시작';
    }
    return '의류만으로 분석 시작';
  };

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: '40px' }}>

      {/* ── 숨겨진 file inputs ── */}
      {/* 의류 — 카메라 */}
      <input
        ref={clothingCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'clothing')}
      />
      {/* 의류 — 갤러리 */}
      <input
        ref={clothingGalleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'clothing')}
      />
      {/* 라벨 — 카메라 */}
      <input
        ref={labelCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'label')}
      />
      {/* 라벨 — 갤러리 */}
      <input
        ref={labelGalleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'label')}
      />

      {/* Header */}
      <div className="px-6 pt-12 pb-5 flex items-center">
        <Link to="/" className="mr-4">
          <ArrowLeft size={24} className="stroke-[#1a2332]" strokeWidth={2} />
        </Link>
        <h1 className="text-[#1a2332] flex-1 text-center mr-8" style={{ fontSize: '22px', fontWeight: 700 }}>
          사진 업로드
        </h1>
      </div>

      <div className="px-6 space-y-5">

        {/* ── Slot 1: 의류 사진 (필수) ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: '#87CEEB', fontSize: '12px', fontWeight: 700 }}>1</span>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>의류 사진</p>
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600 }}>필수</span>
          </div>

          {clothingPreview ? (
            /* 미리보기 */
            <div className="relative w-full rounded-3xl overflow-hidden" style={{ height: '188px' }}>
              <img src={clothingPreview} alt="의류 미리보기" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-end pb-4 gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => clothingCameraRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Camera size={14} strokeWidth={2} />
                    재촬영
                  </button>
                  <button
                    onClick={() => clothingGalleryRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Images size={14} strokeWidth={2} />
                    다시 선택
                  </button>
                  <button
                    onClick={clearClothing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(220,38,38,0.7)', fontSize: '12px', fontWeight: 600 }}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <CheckCircle2 size={24} className="stroke-white fill-[#87CEEB]" strokeWidth={2} />
              </div>
            </div>
          ) : (
            /* 업로드 버튼 2개 */
            <div
              className="w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-8"
              style={{ borderColor: '#cbd5e1', background: '#f8fafb', minHeight: '188px' }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7688' }}>사진을 추가하세요</p>
              <div className="flex gap-3">
                <button
                  onClick={() => clothingCameraRef.current?.click()}
                  className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border transition-all"
                  style={{ borderColor: '#87CEEB', background: '#f0f9ff' }}
                >
                  <Camera size={24} color="#87CEEB" strokeWidth={1.5} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a5f7a' }}>카메라 촬영</span>
                </button>
                <button
                  onClick={() => clothingGalleryRef.current?.click()}
                  className="flex flex-col items-center gap-2 px-6 py-3 rounded-2xl border transition-all"
                  style={{ borderColor: '#e5e9ef', background: 'white' }}
                >
                  <Images size={24} color="#6b7688" strokeWidth={1.5} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7688' }}>갤러리 선택</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Slot 2: 추가 정보 (선택) ── */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#e3f4fb', color: '#87CEEB', fontSize: '12px', fontWeight: 700 }}>2</span>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>추가 정보</p>
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#f0f4f8', color: '#6b7688', fontSize: '11px', fontWeight: 600 }}>선택</span>
          </div>
          <p className="text-[#8896a8] mb-4" style={{ fontSize: '13px' }}>
            아래 중 하나만 선택 가능합니다. 추가하면 더 정밀한 분석을 드려요.
          </p>

          {/* 라벨 기호 / 주의 문구 선택 */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleLabelTypeSelect('symbol')}
              disabled={isSymbolDisabled}
              className="flex-1 rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2"
              style={{
                borderColor: labelType === 'symbol' ? '#87CEEB' : '#e5e9ef',
                background:  labelType === 'symbol' ? '#f0f9ff' : 'white',
                opacity: isSymbolDisabled ? 0.35 : 1,
                cursor: isSymbolDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: labelType === 'symbol' ? '#87CEEB' : '#f0f4f8' }}>
                <Tag size={20} color={labelType === 'symbol' ? 'white' : '#6b7688'} strokeWidth={2} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: labelType === 'symbol' ? '#1a5f7a' : '#1a2332' }}>라벨 기호</p>
              <p style={{ fontSize: '11px', color: '#8896a8', textAlign: 'center', lineHeight: '1.4' }}>세탁 기호 사진</p>
            </button>

            <button
              onClick={() => handleLabelTypeSelect('ocr')}
              disabled={isOcrDisabled}
              className="flex-1 rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2"
              style={{
                borderColor: labelType === 'ocr' ? '#87CEEB' : '#e5e9ef',
                background:  labelType === 'ocr' ? '#f0f9ff' : 'white',
                opacity: isOcrDisabled ? 0.35 : 1,
                cursor: isOcrDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: labelType === 'ocr' ? '#87CEEB' : '#f0f4f8' }}>
                <ScanLine size={20} color={labelType === 'ocr' ? 'white' : '#6b7688'} strokeWidth={2} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: labelType === 'ocr' ? '#1a5f7a' : '#1a2332' }}>주의 문구</p>
              <p style={{ fontSize: '11px', color: '#8896a8', textAlign: 'center', lineHeight: '1.4' }}>텍스트 인식 (OCR)</p>
            </button>
          </div>

          {/* 라벨 이미지 업로드 */}
          {labelType && (
            labelPreview ? (
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: '110px' }}>
                <img src={labelPreview} alt="라벨 미리보기" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2">
                  <button
                    onClick={() => labelCameraRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Camera size={13} strokeWidth={2} /> 재촬영
                  </button>
                  <button
                    onClick={() => labelGalleryRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Images size={13} strokeWidth={2} /> 다시 선택
                  </button>
                  <button
                    onClick={clearLabel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(220,38,38,0.7)', fontSize: '12px', fontWeight: 600 }}
                  >삭제</button>
                </div>
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={20} className="stroke-white fill-[#87CEEB]" strokeWidth={2} />
                </div>
              </div>
            ) : (
              <div
                className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-5"
                style={{ borderColor: '#cbd5e1', background: '#f8fafb', minHeight: '110px' }}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7688' }}>
                  {labelType === 'symbol' ? '라벨 기호 사진 추가' : '주의 문구 사진 추가'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => labelCameraRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border"
                    style={{ borderColor: '#87CEEB', background: '#f0f9ff', fontSize: '12px', fontWeight: 600, color: '#1a5f7a' }}
                  >
                    <Camera size={14} strokeWidth={2} /> 카메라
                  </button>
                  <button
                    onClick={() => labelGalleryRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border"
                    style={{ borderColor: '#e5e9ef', background: 'white', fontSize: '12px', fontWeight: 600, color: '#6b7688' }}
                  >
                    {labelType === 'symbol'
                      ? <><ImageIcon size={14} strokeWidth={2} /> 갤러리</>
                      : <><FileText size={14} strokeWidth={2} /> 갤러리</>
                    }
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Tips Card */}
        <div className="bg-[#fffbeb] rounded-2xl p-5 border border-[#fde68a]">
          <div className="flex items-start gap-3 mb-3">
            <Lightbulb size={20} className="stroke-[#f59e0b] mt-0.5" strokeWidth={2} />
            <h3 className="text-[#92400e]" style={{ fontSize: '15px', fontWeight: 600 }}>촬영 팁</h3>
          </div>
          <ul className="space-y-1.5 ml-8">
            <li className="text-[#78350f]" style={{ fontSize: '13px', lineHeight: '1.6' }}>밝은 곳에서 촬영하세요</li>
            <li className="text-[#78350f]" style={{ fontSize: '13px', lineHeight: '1.6' }}>라벨이 정면으로 보이게 촬영하세요</li>
            <li className="text-[#78350f]" style={{ fontSize: '13px', lineHeight: '1.6' }}>의류 전체 형태가 보이게 촬영하세요</li>
          </ul>
        </div>

        {/* Bottom Button — inline (not fixed) */}
        <div className="pt-2 pb-4">
          {clothingUploaded && (
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#87CEEB' }} />
                <span style={{ fontSize: '12px', color: '#6b7688', fontWeight: 500 }}>의류 사진</span>
              </div>
              {labelUploaded && (
                <>
                  <div style={{ width: '16px', height: '1px', background: '#cbd5e1' }} />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#98D8C8' }} />
                    <span style={{ fontSize: '12px', color: '#6b7688', fontWeight: 500 }}>
                      {labelType === 'symbol' ? '라벨 기호' : '주의 문구'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!clothingUploaded}
            className="w-full rounded-2xl transition-all"
            style={{
              height: '56px',
              fontSize: '16px',
              fontWeight: 600,
              background: clothingUploaded ? '#87CEEB' : '#e0e7ef',
              color: clothingUploaded ? 'white' : '#8896a8',
              boxShadow: clothingUploaded ? '0 4px 16px rgba(135,206,235,0.4)' : 'none',
              cursor: clothingUploaded ? 'pointer' : 'not-allowed',
            }}
          >
            {getButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}