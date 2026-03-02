import { getGameNumber } from '../utils/game';
import './Header.css';

interface HeaderProps {
  dateStr: string;
  onHelp: () => void;
}

export function Header({ dateStr, onHelp }: HeaderProps) {
  const gameNumber = getGameNumber(dateStr);

  return (
    <header className="header">
      <div className="header-left" />
      <div className="header-center">
        <h1 className="header-title">Kuntale</h1>
        <span className="header-game-number">#{gameNumber}</span>
      </div>
      <button className="header-help" onClick={onHelp} aria-label="Ohje">
        ?
      </button>
    </header>
  );
}
