import { useRef } from 'react';
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
  onDebugToggle?: () => void;
}

export function Header({
  mode,
  onModeChange,
  onBack,
  onStats,
  onBadges,
  onDebugToggle,
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
        </div>
      </div>
      <PillTabs
        options={MODE_OPTIONS}
        value={mode}
        onChange={onModeChange}
        className="mode-toggle"
      />
    </header>
  );
}
