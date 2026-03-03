import { useRef } from 'react';
import type { GameMode } from '../data/types';
import { getGameNumber } from '../utils/game';
import './Header.css';

interface HeaderProps {
  dateStr: string;
  mode: GameMode;
  careerCount?: string;
  onModeChange: (mode: GameMode) => void;
  onBack: () => void;
  onStats: () => void;
  onHelp: () => void;
  onDebugToggle?: () => void;
}

export function Header({ dateStr, mode, careerCount, onModeChange, onBack, onStats, onHelp, onDebugToggle }: HeaderProps) {
  const gameNumber = getGameNumber(dateStr);
  const tapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | undefined }>({ count: 0, timer: undefined });

  const handleTitleClick = () => {
    tapRef.current.count++;
    clearTimeout(tapRef.current.timer);
    if (tapRef.current.count >= 3) {
      tapRef.current.count = 0;
      onDebugToggle?.();
    } else {
      tapRef.current.timer = setTimeout(() => { tapRef.current.count = 0; }, 500);
    }
  };

  const subtitle =
    mode === 'daily'
      ? `#${gameNumber}`
      : mode === 'career'
        ? (careerCount ?? 'Ura')
        : 'Harjoittelu';

  return (
    <header className="header">
      <button className="header-back" onClick={onBack} aria-label="Takaisin">
        ←
      </button>
      <div className="header-center">
        <h1 className="header-title" onClick={handleTitleClick}>Kuntapeli</h1>
        <span className="header-game-number">{subtitle}</span>
        <div className="mode-toggle">
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
      </div>
      <div className="header-actions">
        <button className="header-stats" onClick={onStats} aria-label="Tilastot">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="9" width="3" height="6" rx="0.5" fill="currentColor"/>
            <rect x="6.5" y="4" width="3" height="11" rx="0.5" fill="currentColor"/>
            <rect x="12" y="1" width="3" height="14" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        <button className="header-help" onClick={onHelp} aria-label="Ohje">
          ?
        </button>
      </div>
    </header>
  );
}
