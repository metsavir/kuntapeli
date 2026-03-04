import { useRef, useLayoutEffect } from 'react';
import type { GameMode } from '../data/types';
import './Header.css';

const MODES: GameMode[] = ['daily', 'casual', 'career'];

interface HeaderProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onBack: () => void;
  onStats: () => void;
  onBadges: () => void;
  onHelp: () => void;
  onDebugToggle?: () => void;
}

export function Header({
  mode,
  onModeChange,
  onBack,
  onStats,
  onBadges,
  onHelp,
  onDebugToggle,
}: HeaderProps) {
  const tapRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | undefined;
  }>({ count: 0, timer: undefined });
  const toggleRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    const container = toggleRef.current;
    const el = indicatorRef.current;
    if (!container || !el) return;
    const idx = MODES.indexOf(mode);
    const btn = container.children[idx + 1] as HTMLElement; // +1 to skip the indicator div
    if (!btn) return;

    if (firstRender.current) {
      el.style.transition = 'none';
    }
    el.style.left = btn.offsetLeft + 'px';
    el.style.width = btn.offsetWidth + 'px';
    el.style.visibility = 'visible';

    if (firstRender.current) {
      el.offsetHeight; // force reflow
      el.style.transition = '';
      firstRender.current = false;
    }
  }, [mode]);

  const handleTitleClick = () => {
    tapRef.current.count++;
    clearTimeout(tapRef.current.timer);
    if (tapRef.current.count >= 3) {
      tapRef.current.count = 0;
      onDebugToggle?.();
    } else {
      tapRef.current.timer = setTimeout(() => {
        tapRef.current.count = 0;
      }, 500);
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <button className="header-back" onClick={onBack} aria-label="Takaisin">
          ←
        </button>
        <h1 className="header-title" onClick={handleTitleClick}>
          Kuntapeli
        </h1>
        <div className="header-actions">
          <button
            className="header-stats"
            onClick={onStats}
            aria-label="Tilastot"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="9"
                width="3"
                height="6"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="6.5"
                y="4"
                width="3"
                height="11"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="12"
                y="1"
                width="3"
                height="14"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            className="header-stats"
            onClick={onBadges}
            aria-label="Saavutukset"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button className="header-help" onClick={onHelp} aria-label="Ohje">
            ?
          </button>
        </div>
      </div>
      <div className="mode-toggle" ref={toggleRef}>
        <div
          className="mode-indicator"
          ref={indicatorRef}
          style={{ visibility: 'hidden' }}
        />
        <button
          className={`mode-pill${mode === 'daily' ? ' mode-pill--active' : ''}`}
          onClick={() => onModeChange('daily')}
        >
          Päivittäinen
        </button>
        <button
          className={`mode-pill${mode === 'casual' ? ' mode-pill--active' : ''}`}
          onClick={() => onModeChange('casual')}
        >
          Harjoittelu
        </button>
        <button
          className={`mode-pill${mode === 'career' ? ' mode-pill--active' : ''}`}
          onClick={() => onModeChange('career')}
        >
          Ura
        </button>
      </div>
    </header>
  );
}
