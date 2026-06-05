import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect, useState } from 'react';

function WashingMachineLogo() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Machine body shadow */}
      <rect x="8" y="12" width="104" height="102" rx="18" fill="rgba(135,206,235,0.18)" />

      {/* Machine body */}
      <rect x="6" y="8" width="108" height="104" rx="18" fill="white" />
      <rect x="6" y="8" width="108" height="104" rx="18"
        stroke="rgba(135,206,235,0.5)" strokeWidth="1.5" />

      {/* Top control panel */}
      <rect x="6" y="8" width="108" height="28" rx="18" fill="rgba(224,244,255,0.7)" />
      <rect x="6" y="24" width="108" height="12" fill="rgba(224,244,255,0.7)" />

      {/* Control dots in panel */}
      <circle cx="28" cy="22" r="5" fill="#87CEEB" opacity="0.9" />
      <circle cx="44" cy="22" r="3.5" fill="#b3dff7" opacity="0.8" />
      <circle cx="57" cy="22" r="3.5" fill="#b3dff7" opacity="0.8" />

      {/* Power button */}
      <circle cx="90" cy="22" r="7" fill="rgba(135,206,235,0.2)"
        stroke="#87CEEB" strokeWidth="1.5" />
      <path d="M90 17.5 V22" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" />
      <path d="M86.8 19.2 A5 5 0 1 0 93.2 19.2"
        stroke="#87CEEB" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Door ring outer */}
      <circle cx="60" cy="72" r="36" fill="rgba(224,244,255,0.5)"
        stroke="rgba(135,206,235,0.4)" strokeWidth="2" />

      {/* Door ring inner track */}
      <circle cx="60" cy="72" r="30" fill="white"
        stroke="rgba(135,206,235,0.3)" strokeWidth="1.2" />

      {/* Drum window */}
      <circle cx="60" cy="72" r="25" fill="rgba(219,242,253,0.6)" />

      {/* Drum inner pattern — paddles */}
      <g opacity="0.55">
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(0 60 72)" />
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(60 60 72)" />
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(120 60 72)" />
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(180 60 72)" />
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(240 60 72)" />
        <rect x="58.5" y="49" width="3" height="10" rx="1.5"
          fill="#87CEEB" transform="rotate(300 60 72)" />
      </g>

      {/* Center hub */}
      <circle cx="60" cy="72" r="6" fill="white"
        stroke="rgba(135,206,235,0.6)" strokeWidth="1.5" />
      <circle cx="60" cy="72" r="2.5" fill="#87CEEB" opacity="0.7" />

      {/* Door handle */}
      <rect x="80" y="70" width="9" height="4" rx="2"
        fill="rgba(135,206,235,0.5)" stroke="rgba(135,206,235,0.6)" strokeWidth="1" />

      {/* Bubble details — bottom of window */}
      <circle cx="48" cy="84" r="3.5" fill="rgba(255,255,255,0.7)"
        stroke="rgba(135,206,235,0.35)" strokeWidth="1" />
      <circle cx="57" cy="88" r="2.5" fill="rgba(255,255,255,0.7)"
        stroke="rgba(135,206,235,0.35)" strokeWidth="1" />
      <circle cx="66" cy="86" r="3" fill="rgba(255,255,255,0.7)"
        stroke="rgba(135,206,235,0.35)" strokeWidth="1" />

      {/* Bottom feet */}
      <rect x="24" y="108" width="16" height="6" rx="3" fill="rgba(135,206,235,0.35)" />
      <rect x="80" y="108" width="16" height="6" rx="3" fill="rgba(135,206,235,0.35)" />
    </svg>
  );
}

function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #d8f1fb 0%, #c8ecf8 45%, #c0f0e4 100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
        transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Ambient bubbles */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-20px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(135,206,235,0.32) 0%, transparent 70%)',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '60px', left: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(152,216,200,0.35) 0%, transparent 70%)',
        filter: 'blur(25px)',
      }} />

      {/* Logo + Name */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(12px)',
          transition: 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        {/* Logo card */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '32px',
            background: 'rgba(255,255,255,0.62)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(135,206,235,0.28), 0 2px 8px rgba(0,0,0,0.06)',
            border: '1.5px solid rgba(255,255,255,0.85)',
          }}
        >
          <WashingMachineLogo />
        </div>

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#1a2332',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}>
            Laundry Care
          </p>
          <p style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#5a8fa0',
            marginTop: '5px',
            letterSpacing: '0.3px',
          }}>
            스마트 세탁 도우미
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: '52px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: visible ? 0.65 : 0,
          transition: 'opacity 0.55s ease 0.2s',
        }}
      >
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#87CEEB',
        }} />
        <p style={{ fontSize: '12px', color: '#5a8fa0', fontWeight: 500 }}>
          의류 분석 · 세탁 가이드 · AI 도우미
        </p>
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#98D8C8',
        }} />
      </div>
    </div>
  );
}

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    // Start fade-out after 1.3s
    const fadeTimer = setTimeout(() => setSplashVisible(false), 1300);
    // Fully unmount after fade-out completes (1.3s + 0.55s)
    const unmountTimer = setTimeout(() => setSplashMounted(false), 1950);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {splashMounted && <SplashScreen visible={splashVisible} />}
    </>
  );
}
