import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameMode } from '../data/types';
import { PillTabs } from './PillTabs';
import './Header.css';

const MODE_OPTIONS: { key: GameMode; label: string }[] = [
  { key: 'daily', label: 'Päivittäinen' },
  { key: 'casual', label: 'Harjoittelu' },
  { key: 'career', label: 'Ura' },
];

interface HeaderProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onBack: () => void;
  onStats: () => void;
  onBadges: () => void;
  onSettings: () => void;
  onTimedMode?: () => void;
  onDebugToggle?: () => void;
  minimal?: boolean;
}

function MoreMenu({
  onBadges,
  onSettings,
  onTimedMode,
}: {
  onBadges: () => void;
  onSettings: () => void;
  onTimedMode?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  return (
    <div className="header-more" ref={ref}>
      <button
        className="header-icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Lisää"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="13" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="header-dropdown">
          <button
            className="header-dropdown-item"
            onClick={() => {
              close();
              onBadges();
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                fill="currentColor"
              />
            </svg>
            Saavutukset
          </button>
          {onTimedMode && (
            <button
              className="header-dropdown-item"
              onClick={() => {
                close();
                onTimedMode();
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 4V8.5L11 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Aikakisa
            </button>
          )}
          <button
            className="header-dropdown-item"
            onClick={() => {
              close();
              onSettings();
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="2.5"
                width="14"
                height="1.5"
                rx=".75"
                fill="currentColor"
              />
              <rect
                x="1"
                y="7.25"
                width="14"
                height="1.5"
                rx=".75"
                fill="currentColor"
              />
              <rect
                x="1"
                y="12"
                width="14"
                height="1.5"
                rx=".75"
                fill="currentColor"
              />
              <circle
                cx="4.5"
                cy="3.25"
                r="2"
                fill="currentColor"
                stroke="var(--color-surface, #2a2a3e)"
                strokeWidth="1"
              />
              <circle
                cx="10.5"
                cy="8"
                r="2"
                fill="currentColor"
                stroke="var(--color-surface, #2a2a3e)"
                strokeWidth="1"
              />
              <circle
                cx="6"
                cy="12.75"
                r="2"
                fill="currentColor"
                stroke="var(--color-surface, #2a2a3e)"
                strokeWidth="1"
              />
            </svg>
            Asetukset
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({
  mode,
  onModeChange,
  onBack,
  onStats,
  onBadges,
  onSettings,
  onTimedMode,
  onDebugToggle,
  minimal,
}: HeaderProps) {
  const tapRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | undefined;
  }>({ count: 0, timer: undefined });

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
          {!minimal && (
            <button
              className="header-icon-btn"
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
          )}
          <MoreMenu
            onBadges={onBadges}
            onSettings={onSettings}
            onTimedMode={onTimedMode}
          />
        </div>
      </div>
      {minimal ? (
        <PillTabs
          options={[{ key: 'timed' as GameMode, label: 'Aikakisa' }]}
          value={'timed' as GameMode}
          onChange={() => {}}
          className="mode-toggle"
        />
      ) : (
        <PillTabs
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          className="mode-toggle"
        />
      )}
    </header>
  );
}
