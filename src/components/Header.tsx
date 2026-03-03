import type { GameMode } from '../data/types';
import { getGameNumber } from '../utils/game';
import './Header.css';

interface HeaderProps {
  dateStr: string;
  mode: GameMode;
  careerCount?: string;
  onModeChange: (mode: GameMode) => void;
  onHelp: () => void;
}

export function Header({ dateStr, mode, careerCount, onModeChange, onHelp }: HeaderProps) {
  const gameNumber = getGameNumber(dateStr);

  const subtitle =
    mode === 'daily'
      ? `#${gameNumber}`
      : mode === 'career'
        ? (careerCount ?? 'Ura')
        : 'Harjoittelu';

  return (
    <header className="header">
      <div className="header-left" />
      <div className="header-center">
        <h1 className="header-title">Kuntapeli</h1>
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
