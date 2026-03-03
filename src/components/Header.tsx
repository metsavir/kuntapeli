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
  onHelp: () => void;
  onDebugToggle?: () => void;
}

export function Header({ dateStr, mode, careerCount, onModeChange, onBack, onHelp, onDebugToggle }: HeaderProps) {
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
      <button className="header-help" onClick={onHelp} aria-label="Ohje">
        ?
      </button>
    </header>
  );
}
